import { describe, it, expect, vi } from 'vitest'
import { AIEnhancer } from './enhancer'
import { TechDebtCalculator } from './tech-debt'
import type { Detection } from '@rivet/core'

// Mock OpenAI - using @langchain/openai path
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    pipe: vi.fn().mockReturnValue({
      pipe: vi.fn().mockReturnValue({
        invoke: vi.fn().mockResolvedValue(JSON.stringify({
          explanation: 'This is a test explanation',
          analogy: 'Like a test analogy',
          suggestion: 'Fix it this way',
        })),
      }),
    }),
  })),
}))

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
      model: 'gpt-4',
      enabled: true,
    })

    expect(enhancer).toBeDefined()
  })

  it('should not enhance when disabled', async () => {
    const enhancer = new AIEnhancer({
      apiKey: 'test-key',
      model: 'gpt-4',
      enabled: false,
    })

    const result = await enhancer.enhanceDetections([mockDetection])

    expect(result).toEqual([mockDetection])
  })

  it('should handle empty detection array', async () => {
    const enhancer = new AIEnhancer({
      apiKey: 'test-key',
      model: 'gpt-4',
      enabled: true,
    })

    const result = await enhancer.enhanceDetections([])

    expect(result).toEqual([])
  })

  it('should respect maxConcurrent option', async () => {
    const enhancer = new AIEnhancer({
      apiKey: 'test-key',
      model: 'gpt-4',
      enabled: true,
    })

    const detections = Array.from({ length: 10 }, (_, i) => ({
      ...mockDetection,
      id: `test-${i}`,
    }))

    const result = await enhancer.enhanceDetections(detections, 3)

    expect(result.length).toBe(10)
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
