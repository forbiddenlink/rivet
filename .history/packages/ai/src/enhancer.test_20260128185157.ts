import { describe, it, expect, vi } from 'vitest'
import { AIEnhancer } from './enhancer'
import { TechDebtCalculator } from './tech-debt'
import type { Detection } from '@rivet/core'

// Mock OpenAI
vi.mock('langchain/chat_models/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    call: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        explanation: 'This is a test explanation',
        analogy: 'Like a test analogy',
        suggestion: 'Fix it this way',
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
    const calculator = new TechDebtCalculator()
    const metrics = calculator.calculate(mockDetections)

    expect(metrics.totalMinutes).toBeGreaterThan(0)
    expect(metrics.totalIssues).toBe(2)
    expect(metrics.breakdown).toBeDefined()
  })

  it('should handle empty detections', () => {
    const calculator = new TechDebtCalculator()
    const metrics = calculator.calculate([])

    expect(metrics.totalMinutes).toBe(0)
    expect(metrics.totalIssues).toBe(0)
  })

  it('should categorize by severity', () => {
    const calculator = new TechDebtCalculator()
    const metrics = calculator.calculate(mockDetections)

    expect(metrics.breakdown.bySeverity.critical).toBeGreaterThan(0)
    expect(metrics.breakdown.bySeverity.medium).toBeGreaterThan(0)
  })

  it('should categorize by category', () => {
    const calculator = new TechDebtCalculator()
    const metrics = calculator.calculate(mockDetections)

    expect(metrics.breakdown.byCategory.smells).toBeGreaterThan(0)
    expect(metrics.breakdown.byCategory.security).toBeGreaterThan(0)
  })

  it('should format time correctly', () => {
    const calculator = new TechDebtCalculator()
    const metrics = calculator.calculate(mockDetections)

    expect(metrics.formattedTime).toBeDefined()
    expect(typeof metrics.formattedTime).toBe('string')
  })
})
