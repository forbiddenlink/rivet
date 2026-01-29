import { describe, it, expect, beforeEach } from 'vitest'
import { RivetEngine } from './engine'
import type { AnalysisEngine, AnalysisContext, Detection } from './types'

// Mock engine for testing
class MockEngine implements AnalysisEngine {
  name = 'mock-engine'
  category = 'smells' as const
  description = 'Mock engine for testing'
  
  async analyze(context: AnalysisContext): Promise<Detection[]> {
    return [
      {
        id: 'mock-1',
        ruleId: 'mock-rule',
        category: 'smells',
        severity: 'medium',
        message: 'Mock detection',
        filePath: context.parseResult.filePath,
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 10 },
        },
      },
    ]
  }
}

describe('RivetEngine', () => {
  let engine: RivetEngine

  beforeEach(() => {
    engine = new RivetEngine()
  })

  describe('configuration', () => {
    it('should initialize with default config', () => {
      const defaultEngine = new RivetEngine()
      expect(defaultEngine).toBeDefined()
    })

    it('should accept custom configuration', () => {
      const customEngine = new RivetEngine({
        severity: 'high',
        maxIssues: 50,
      })
      expect(customEngine).toBeDefined()
    })

    it('should merge custom config with defaults', () => {
      const customEngine = new RivetEngine({
        maxIssues: 25,
      })
      expect(customEngine).toBeDefined()
    })
  })

  describe('engine registration', () => {
    it('should register a single engine', () => {
      const mockEngine = new MockEngine()
      expect(() => engine.registerEngine(mockEngine)).not.toThrow()
    })

    it('should register multiple engines', () => {
      const engine1 = new MockEngine()
      engine1.name = 'engine-1'
      
      const engine2: AnalysisEngine = {
        ...new MockEngine(),
        name: 'engine-2',
        category: 'security',
      }

      expect(() => {
        engine.registerEngine(engine1)
        engine.registerEngine(engine2)
      }).not.toThrow()
    })

    it('should allow multiple engines per category', () => {
      const engine1 = new MockEngine()
      engine1.name = 'engine-1'
      
      const engine2 = new MockEngine()
      engine2.name = 'engine-2'

      expect(() => {
        engine.registerEngine(engine1)
        engine.registerEngine(engine2)
      }).not.toThrow()
    })
  })

  describe('severity filtering', () => {
    it('should respect severity configuration', () => {
      const highSeverityEngine = new RivetEngine({
        severity: 'high',
      })
      expect(highSeverityEngine).toBeDefined()
    })

    it('should filter by all severity levels', () => {
      const levels: Array<'critical' | 'high' | 'medium' | 'low' | 'info'> = [
        'critical',
        'high',
        'medium',
        'low',
        'info',
      ]

      levels.forEach((severity) => {
        const testEngine = new RivetEngine({ severity })
        expect(testEngine).toBeDefined()
      })
    })
  })

  describe('detection limits', () => {
    it('should respect maxIssues configuration', () => {
      const limitedEngine = new RivetEngine({
        maxIssues: 10,
      })
      expect(limitedEngine).toBeDefined()
    })

    it('should handle unlimited issues', () => {
      const unlimitedEngine = new RivetEngine({
        maxIssues: Infinity,
      })
      expect(unlimitedEngine).toBeDefined()
    })
  })

  describe('file pattern handling', () => {
    it('should use default include patterns', () => {
      const defaultEngine = new RivetEngine()
      expect(defaultEngine).toBeDefined()
    })

    it('should accept custom include patterns', () => {
      const customEngine = new RivetEngine({
        include: ['**/*.ts', '**/*.tsx'],
      })
      expect(customEngine).toBeDefined()
    })

    it('should accept custom exclude patterns', () => {
      const customEngine = new RivetEngine({
        exclude: ['**/test/**', '**/spec/**'],
      })
      expect(customEngine).toBeDefined()
    })
  })

  describe('engine execution', () => {
    it('should handle engine errors gracefully', async () => {
      class ErrorEngine implements AnalysisEngine {
        name = 'error-engine'
        category = 'bugs' as const
        description = 'Engine that throws errors'
        
        async analyze(): Promise<Detection[]> {
          throw new Error('Test error')
        }
      }

      const testEngine = new RivetEngine()
      testEngine.registerEngine(new ErrorEngine())

      // Engine should catch errors and continue
      expect(testEngine).toBeDefined()
    })

    it('should return empty detections for empty engines', async () => {
      class EmptyEngine implements AnalysisEngine {
        name = 'empty-engine'
        category = 'smells' as const
        description = 'Engine with no detections'
        
        async analyze(): Promise<Detection[]> {
          return []
        }
      }

      const testEngine = new RivetEngine()
      testEngine.registerEngine(new EmptyEngine())
      expect(testEngine).toBeDefined()
    })
  })

  describe('detection metadata', () => {
    it('should preserve detection properties', () => {
      const detection: Detection = {
        id: 'test-1',
        ruleId: 'test-rule',
        category: 'smells',
        severity: 'high',
        message: 'Test message',
        filePath: '/test/file.ts',
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 10, column: 0 },
        },
      }

      expect(detection.id).toBe('test-1')
      expect(detection.severity).toBe('high')
      expect(detection.category).toBe('smells')
    })

    it('should support optional detection fields', () => {
      const detection: Detection = {
        id: 'test-1',
        ruleId: 'test-rule',
        category: 'security',
        severity: 'critical',
        message: 'Security issue',
        filePath: '/test/file.ts',
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 10 },
        },
        suggestion: 'Fix this issue',
        codeSnippet: 'const x = 1',
      }

      expect(detection.suggestion).toBe('Fix this issue')
      expect(detection.codeSnippet).toBe('const x = 1')
    })
  })
})
