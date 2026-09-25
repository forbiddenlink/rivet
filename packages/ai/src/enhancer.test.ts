import type { Detection } from '@rivet/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AIEnhancer } from './enhancer'
import { TechDebtCalculator } from './tech-debt'

// The enhancer builds its chain as `prompt.pipe(llm).pipe(parser)`, so the seam that
// has to be mocked is ChatPromptTemplate, not ChatOpenAI. Mocking ChatOpenAI left the
// real LangChain prompt pipeline running against a fake runnable: every call threw
// inside LangChain, the enhancer swallowed it, and the tests passed while asserting
// nothing about enhancement.
const invoke = vi.fn()

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: class {},
}))

vi.mock('@langchain/core/output_parsers', () => ({
  StringOutputParser: class {},
}))

vi.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromMessages: () => ({
      pipe: () => ({
        pipe: () => ({ invoke }),
      }),
    }),
  },
}))

const AI_RESPONSE = JSON.stringify({
  explanation: 'This is a test explanation',
  analogy: 'Like a test analogy',
  suggestion: 'Fix it this way',
})

beforeEach(() => {
  invoke.mockReset()
  invoke.mockResolvedValue(AI_RESPONSE)
})

describe('AIEnhancer', () => {
  const mockDetection: Detection = {
    id: 'test-1',
    ruleId: 'test-rule',
    category: 'smells',
    severity: 'medium',
    message: 'Test issue',
    filePath: 'test.ts',
    loc: {
      start: { line: 1, column: 0 },
      end: { line: 10, column: 0 },
    },
  }

  it('should initialize with config', () => {
    const enhancer = new AIEnhancer({
      apiKey: 'test-key',
      model: 'gpt-6-sol',
      enabled: true,
    })

    expect(enhancer).toBeDefined()
  })

  it('should not enhance when disabled', async () => {
    const enhancer = new AIEnhancer({
      apiKey: 'test-key',
      model: 'gpt-6-sol',
      enabled: false,
    })

    const result = await enhancer.enhanceDetections([mockDetection])

    expect(result).toEqual([mockDetection])
  })

  it('should handle empty detection array', async () => {
    const enhancer = new AIEnhancer({
      apiKey: 'test-key',
      model: 'gpt-6-sol',
      enabled: true,
    })

    const result = await enhancer.enhanceDetections([])

    expect(result).toEqual([])
  })

  it('attaches the AI explanation, suggestion, and analogy to a detection', async () => {
    const enhancer = new AIEnhancer({ apiKey: 'test-key', model: 'gpt-6-sol', enabled: true })

    const [result] = await enhancer.enhanceDetections([mockDetection])

    expect(result?.aiExplanation).toBe('This is a test explanation')
    expect(result?.aiSuggestion).toBe('Fix it this way')
    expect(result?.aiAnalogy).toBe('Like a test analogy')
  })

  it('calls the model once per detection', async () => {
    const enhancer = new AIEnhancer({ apiKey: 'test-key', model: 'gpt-6-sol', enabled: true })

    const detections = Array.from({ length: 10 }, (_, i) => ({ ...mockDetection, id: `test-${i}` }))
    const result = await enhancer.enhanceDetections(detections, 3)

    expect(result).toHaveLength(10)
    expect(invoke).toHaveBeenCalledTimes(10)
  })

  it('never runs more than maxConcurrent calls at once', async () => {
    let inFlight = 0
    let peak = 0
    invoke.mockImplementation(async () => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 1))
      inFlight -= 1
      return AI_RESPONSE
    })

    const enhancer = new AIEnhancer({ apiKey: 'test-key', model: 'gpt-6-sol', enabled: true })
    const detections = Array.from({ length: 10 }, (_, i) => ({ ...mockDetection, id: `test-${i}` }))

    await enhancer.enhanceDetections(detections, 3)

    expect(peak).toBeLessThanOrEqual(3)
  })

  it('returns the original detection when the model call fails', async () => {
    invoke.mockRejectedValue(new Error('rate limited'))
    const enhancer = new AIEnhancer({ apiKey: 'test-key', model: 'gpt-6-sol', enabled: true })

    const [result] = await enhancer.enhanceDetections([mockDetection])

    expect(result).toEqual(mockDetection)
  })

  it('returns the original detection when the model returns unparseable output', async () => {
    invoke.mockResolvedValue('not json at all')
    const enhancer = new AIEnhancer({ apiKey: 'test-key', model: 'gpt-6-sol', enabled: true })

    const [result] = await enhancer.enhanceDetections([mockDetection])

    expect(result?.id).toBe(mockDetection.id)
  })
})

describe('TechDebtCalculator', () => {
  const mockDetections: Detection[] = [
    {
      id: 'smell-1',
      ruleId: 'long-method',
      category: 'smells',
      severity: 'medium',
      message: 'Long method',
      filePath: 'test.ts',
      loc: { start: { line: 1, column: 0 }, end: { line: 50, column: 0 } },
    },
    {
      id: 'security-1',
      ruleId: 'hardcoded-secret',
      category: 'security',
      severity: 'critical',
      message: 'Hardcoded secret',
      filePath: 'test.ts',
      loc: { start: { line: 60, column: 0 }, end: { line: 61, column: 0 } },
    },
  ]

  it('should calculate tech debt metrics', () => {
    const metrics = TechDebtCalculator.calculate(mockDetections)

    expect(metrics.totalDebt).toBeGreaterThan(0)
    expect(metrics.criticalDebt).toBeGreaterThan(0)
    expect(metrics.mediumDebt).toBeGreaterThan(0)
  })

  it('should handle empty detections', () => {
    const metrics = TechDebtCalculator.calculate([])

    expect(metrics.totalDebt).toBe(0)
    expect(metrics.criticalDebt).toBe(0)
  })

  it('should categorize by severity', () => {
    const metrics = TechDebtCalculator.calculate(mockDetections)

    expect(metrics.criticalDebt).toBeGreaterThan(0)
    expect(metrics.mediumDebt).toBeGreaterThan(0)
  })

  it('should categorize by category', () => {
    const metrics = TechDebtCalculator.calculate(mockDetections)

    expect(metrics.byCategory['smells']).toBeGreaterThan(0)
    expect(metrics.byCategory['security']).toBeGreaterThan(0)
  })

  it('should format time correctly', () => {
    const metrics = TechDebtCalculator.calculate(mockDetections)
    const formatted = TechDebtCalculator.formatMetrics(metrics)

    expect(formatted).toBeDefined()
    expect(typeof formatted).toBe('string')
    expect(formatted).toContain('Tech Debt Summary')
  })
})
