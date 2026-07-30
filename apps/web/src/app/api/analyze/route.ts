import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { NextRequest, NextResponse } from 'next/server'

interface AnalysisRequest {
  code: string
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

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalysisResponse | { error: string }>> {
  let tmpDir: string | null = null

  try {
    const body: AnalysisRequest = await request.json()

    if (!body.code || !body.code.trim()) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    if (Buffer.byteLength(body.code, 'utf8') > MAX_CODE_BYTES) {
      return NextResponse.json(
        { error: `Code exceeds ${MAX_CODE_BYTES / 1000}KB limit for web analysis. Use the CLI for larger projects.` },
        { status: 413 }
      )
    }

    const startTime = Date.now()

    tmpDir = mkdtempSync(join(tmpdir(), 'rivet-'))
    const filePath = join(tmpDir, 'input.ts')
    writeFileSync(filePath, body.code, 'utf-8')

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

    const result = await engine.analyze(tmpDir)

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
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  } finally {
    if (tmpDir) {
      try {
        rmSync(tmpDir, { recursive: true, force: true })
      } catch (e) {
        console.warn('Failed to cleanup tmpdir:', e)
      }
    }
  }
}
