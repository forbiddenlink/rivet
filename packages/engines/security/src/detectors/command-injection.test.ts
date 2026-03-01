import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'

import { detectCommandInjection } from './command-injection'

function createAST(code: string, filePath = 'test.ts') {
  const parseResult = parseTypeScript({
    filePath,
    sourceCode: code,
    extractTypes: false,
  })
  return parseResult.ast
}

describe('Command Injection Detector', () => {
  describe('detects vulnerabilities', () => {
    it('should detect exec with user input', () => {
      const code = `
        import { exec } from 'child_process'
        function runCommand(cmd: string) {
          exec(cmd)
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('command-injection')
      expect(detections[0]?.severity).toBe('critical')
    })

    it('should detect execSync with template literal', () => {
      const code = `
        import { execSync } from 'child_process'
        function run(name: string) {
          execSync(\`ls -la \${name}\`)
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('command-injection')
    })

    it('should detect spawn with string concatenation', () => {
      const code = `
        import { spawn } from 'child_process'
        function run(arg: string) {
          spawn('ls ' + arg)
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect spawnSync with dynamic input', () => {
      const code = `
        import { spawnSync } from 'child_process'
        function execute(command: string) {
          spawnSync(command)
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect execFile with user input', () => {
      const code = `
        import { execFile } from 'child_process'
        function run(file: string) {
          execFile(file)
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect execFileSync with dynamic path', () => {
      const code = `
        import { execFileSync } from 'child_process'
        function execute(binary: string) {
          execFileSync(binary)
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should include OWASP reference in metadata', () => {
      const code = `
        import { exec } from 'child_process'
        exec(userInput)
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.metadata?.owasp).toContain('Injection')
    })
  })

  describe('safe patterns (no false positives)', () => {
    it('should not flag exec with static command', () => {
      const code = `
        import { exec } from 'child_process'
        function listFiles() {
          exec('ls -la')
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag spawn with array arguments', () => {
      const code = `
        import { spawn } from 'child_process'
        function run() {
          spawn('ls', ['-la'])
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag non-child_process functions', () => {
      // Note: Functions with the same name as child_process methods (exec, spawn, etc.)
      // will be flagged as potential false positives. Use unique names for custom functions.
      const code = `
        function runCustomCommand(cmd: string) {
          console.log('Custom command:', cmd)
        }
        function execute(cmd: string) {
          runCustomCommand(cmd)
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag unrelated function calls', () => {
      const code = `
        async function fetchData() {
          const response = await fetch('/api')
          return response.json()
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle empty code', () => {
      const code = ``

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle code without command execution', () => {
      const code = `
        function greet(name: string) {
          return \`Hello, \${name}!\`
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should set correct file path in detections', () => {
      const code = `
        import { exec } from 'child_process'
        exec(cmd)
      `

      const detections = detectCommandInjection(createAST(code, 'src/commands.ts'), 'src/commands.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.filePath).toBe('src/commands.ts')
    })

    it('should include method name in message', () => {
      const code = `
        import { execSync } from 'child_process'
        execSync(command)
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.message).toContain('execSync')
    })

    it('should detect child_process method calls on require import', () => {
      const code = `
        const cp = require('child_process')
        function run(cmd: string) {
          cp.exec(cmd)
        }
      `

      const detections = detectCommandInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })
  })
})
