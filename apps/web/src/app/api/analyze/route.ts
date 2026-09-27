import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import type { AnalysisResult } from '@rivet/core'
import { type NextRequest, NextResponse } from 'next/server'

import { clientKey, rateLimit, rateLimitHeaders } from '@/lib/rate-limit'

/** The only extensions the parser (and the upload picker) accept. */
const SUPPORTED_EXTENSIONS = new Set<string>(['.ts', '.tsx', '.js', '.jsx'])

interface AnalysisRequest {
  code: string
  /**
   * Original filename, when the code came from a file upload. Absent for
   * pasted code, which has no filename to go on.
   */
  fileName?: string
  config?: {
    engines?: Record<string, boolean>
    minSeverity?: 'info' | 'low' | 'medium' | 'high' | 'critical'
    categories?: string[]
  }
}

interface Location {
  line: number
  column: number
}

interface Detection {
  id: string
  ruleId: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  filePath: string
  loc: {
    start: Location
    end: Location
  }
  metadata?: Record<string, unknown>
}

interface AnalysisResponse {
  detections: Detection[]
  filesAnalyzed: number
  duration: number
  summary: {
    total: number
    bySeverity: Record<string, number>
    byCategory: Record<string, number>
    byEngine: Record<string, number>
  }
}

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }
const MAX_CODE_BYTES = 200_000

// The route writes to a temp directory and loads the engine packages, so it cannot
// run on the edge runtime. Stating it explicitly stops a future config change from
// silently moving it somewhere node:fs does not exist.
export const runtime = 'nodejs'

// Eight engines parsing up to 200KB of hostile input takes real time. Without this,
// the platform default cuts the response off mid-scan and the caller sees a timeout
// rather than a result.
export const maxDuration = 60

// Unauthenticated and CPU-bound: the limit is what stops one caller pinning a worker.
const RATE_LIMIT = { limit: 10, windowMs: 60_000 }

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalysisResponse | { error: string }>> {
  const limit = rateLimit(clientKey(request), RATE_LIMIT)
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many analysis requests. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  try {
    const body: AnalysisRequest = await request.json()

    if (!(body.code && body.code.trim())) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    if (Buffer.byteLength(body.code, 'utf8') > MAX_CODE_BYTES) {
      return NextResponse.json(
        {
          error: `Code exceeds ${MAX_CODE_BYTES / 1000}KB limit for web analysis. Use the CLI for larger projects.`,
        },
        { status: 413 }
      )
    }

    const startTime = Date.now()

    const { RivetEngine } = await import('@rivet/core')
    const { SmellsEngine } = await import('@rivet/engine-smells')
    const { SecurityEngine } = await import('@rivet/engine-security')
    const { BugEngine } = await import('@rivet/engine-bugs')
    const { PerformanceEngine } = await import('@rivet/engine-performance')
    const { ArchitectureEngine } = await import('@rivet/engine-architecture')
    const { PracticesEngine } = await import('@rivet/engine-practices')
    const { DependenciesEngine } = await import('@rivet/engine-dependencies')
    const { FlowsEngine } = await import('@rivet/engine-flows')

    const enabledEngines = {
      smells: body.config?.engines?.smells !== false,
      security: body.config?.engines?.security !== false,
      bugs: body.config?.engines?.bugs !== false,
      performance: body.config?.engines?.performance !== false,
      architecture: body.config?.engines?.architecture !== false,
      practices: body.config?.engines?.practices !== false,
      dependencies: body.config?.engines?.dependencies !== false,
      flows: body.config?.engines?.flows !== false,
    }
    const minSeverity = body.config?.minSeverity || 'info'
    const minSeverityRank = SEVERITY_RANK[minSeverity as keyof typeof SEVERITY_RANK]

    // Runs the engine once against `code` written out under `extension`, in its own
    // scratch dir so a retry never sees the previous attempt's file. Returns whether
    // the parser choked on that extension (via the `parser`-tagged entry `analyzeFile`
    // pushes into `errors` on a syntax error) so the caller can decide whether to retry.
    async function runScan(
      code: string,
      extension: string
    ): Promise<{ result: AnalysisResult; hadParseError: boolean }> {
      const dir = mkdtempSync(join(tmpdir(), 'rivet-'))
      try {
        writeFileSync(join(dir, `input${extension}`), code, 'utf-8')

        const engine = new RivetEngine({
          severity: { minLevel: 'info' as const },
          maxIssues: 100,
        })

        if (enabledEngines.smells) engine.registerEngine(new SmellsEngine())
        if (enabledEngines.security) engine.registerEngine(new SecurityEngine())
        if (enabledEngines.bugs) engine.registerEngine(new BugEngine())
        if (enabledEngines.performance) engine.registerEngine(new PerformanceEngine())
        if (enabledEngines.architecture) engine.registerEngine(new ArchitectureEngine())
        if (enabledEngines.practices) engine.registerEngine(new PracticesEngine())
        if (enabledEngines.dependencies) engine.registerEngine(new DependenciesEngine())
        if (enabledEngines.flows) engine.registerEngine(new FlowsEngine())

        const result = await engine.analyze(dir)
        const hadParseError = result.errors.some((e) => e.engine === 'parser')
        return { result, hadParseError }
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    }

    let result: AnalysisResult

    const uploadExt = body.fileName ? extname(body.fileName).toLowerCase() : ''
    if (body.fileName && SUPPORTED_EXTENSIONS.has(uploadExt)) {
      // A real filename is unambiguous: it already tells the parser which grammar to
      // use, so there is nothing to retry.
      ;({ result } = await runScan(body.code, uploadExt))
    } else {
      // Pasted code has no filename. Try .tsx first (the syntactic superset that
      // also covers JSX). If it fails to parse, retry as .ts, which is the only
      // grammar under which generic arrow functions (`<T>(x: T) => x`) and
      // angle-bracket type assertions (`<Foo>value`) are unambiguous rather than
      // being read as a stray JSX open tag.
      const tsx = await runScan(body.code, '.tsx')
      if (tsx.hadParseError) {
        const ts = await runScan(body.code, '.ts')
        result = ts.hadParseError ? tsx.result : ts.result
      } else {
        result = tsx.result
      }
    }

    const filteredDetections = result.detections.filter((detection) => {
      const detectionSeverityRank = SEVERITY_RANK[detection.severity]
      return detectionSeverityRank >= minSeverityRank
    })

    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    }
    const byCategory: Record<string, number> = {}
    const byEngine: Record<string, number> = {}

    for (const detection of filteredDetections) {
      bySeverity[detection.severity] = (bySeverity[detection.severity] || 0) + 1
      byCategory[detection.category] = (byCategory[detection.category] || 0) + 1
      const rulePrefix = detection.ruleId?.split('-')[0] || 'unknown'
      byEngine[rulePrefix] = (byEngine[rulePrefix] || 0) + 1
    }

    Object.keys(bySeverity).forEach((key) => {
      if (bySeverity[key] === 0) delete bySeverity[key]
    })

    const duration = Date.now() - startTime

    return NextResponse.json({
      detections: filteredDetections,
      filesAnalyzed: result.filesAnalyzed,
      duration,
      summary: {
        total: filteredDetections.length,
        bySeverity,
        byCategory,
        byEngine,
      },
    })
  } catch (error) {
    // Logged in full server-side; the client gets a fixed message. The raw error
    // carries temp-directory paths and engine internals that a public endpoint
    // should not hand back.
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
