import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'

import { detectPathTraversal } from './path-traversal'

function createAST(code: string, filePath = 'test.ts') {
  const parseResult = parseTypeScript({
    filePath,
    sourceCode: code,
    extractTypes: false,
  })
  return parseResult.ast
}

describe('Path Traversal Detector', () => {
  describe('detects vulnerabilities', () => {
    it('should detect readFile with user-controlled path', () => {
      const code = `
        import fs from 'fs'
        function getFile(filename: string) {
          return fs.readFile(filename)
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('path-traversal')
      expect(detections[0]?.severity).toBe('high')
    })

    it('should detect readFileSync with template literal path', () => {
      const code = `
        import fs from 'fs'
        function getFile(filename: string) {
          return fs.readFileSync(\`./uploads/\${filename}\`)
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('path-traversal')
    })

    it('should detect writeFile with concatenated path', () => {
      const code = `
        import fs from 'fs'
        function saveFile(name: string, content: string) {
          fs.writeFile('./data/' + name, content)
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect writeFileSync with user path', () => {
      const code = `
        import fs from 'fs'
        function save(path: string, data: Buffer) {
          fs.writeFileSync(path, data)
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect unlink with user-controlled path', () => {
      const code = `
        import fs from 'fs'
        function deleteFile(filename: string) {
          fs.unlink(filename)
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect unlinkSync with dynamic path', () => {
      const code = `
        import fs from 'fs'
        function removeFile(path: string) {
          fs.unlinkSync(path)
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect rename with user paths', () => {
      const code = `
        import fs from 'fs'
        function moveFile(oldPath: string, newPath: string) {
          fs.rename(oldPath, newPath)
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should include OWASP reference in metadata', () => {
      const code = `
        import fs from 'fs'
        function read(path: string) {
          return fs.readFile(path)
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.metadata?.owasp).toContain('Access Control')
    })
  })

  describe('safe patterns (no false positives)', () => {
    it('should not flag readFile with static path', () => {
      const code = `
        import fs from 'fs'
        function getConfig() {
          return fs.readFile('./config.json')
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag non-fs operations', () => {
      const code = `
        function processPath(path: string) {
          return path.split('/').pop()
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag unrelated function calls', () => {
      const code = `
        function fetchData() {
          return fetch('/api/data')
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    // Regression test: a bare imported fs call (no `fs.` member access) has
    // an Identifier callee, e.g. "writeFileSync". Before this fix, the
    // search for the path argument didn't exclude the callee node, so that
    // Identifier itself was matched as the "path argument" and the call was
    // flagged before the real first argument (here, a `join()` call) was
    // ever inspected. RIVET's own self-scan caught this on
    // apps/web/src/app/api/analyze/route.ts's `writeFileSync(join(dir,
    // \`input${extension}\`), code, 'utf-8')`.
    it('should not flag a bare imported writeFileSync call whose path is a join() result', () => {
      const code = `
        import { writeFileSync } from 'node:fs'
        import { join } from 'node:path'
        function write(dir: string, extension: string, code: string) {
          writeFileSync(join(dir, \`input\${extension}\`), code, 'utf-8')
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    // True-positive guard: a bare imported call must still be flagged when
    // its path argument really is a raw, unvalidated Identifier or template
    // literal - the callee exclusion above must not blind the detector to
    // the argument that follows it.
    it('should still flag a bare imported readFileSync call with a user-controlled path', () => {
      const code = `
        import { readFileSync } from 'node:fs'
        function read(userPath: string) {
          return readFileSync(userPath)
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('path-traversal')
    })
  })

  describe('edge cases', () => {
    it('should handle empty code', () => {
      const code = ``

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle code without fs operations', () => {
      const code = `
        const x = 1
        const y = 2
        console.log(x + y)
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should set correct file path in detections', () => {
      const code = `
        import fs from 'fs'
        fs.readFile(userPath)
      `

      const detections = detectPathTraversal(createAST(code, 'src/files.ts'), 'src/files.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.filePath).toBe('src/files.ts')
    })

    it('should include method name in message', () => {
      const code = `
        import fs from 'fs'
        fs.readFileSync(path)
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.message).toContain('readFileSync')
    })

    it('should detect open with user-controlled path', () => {
      const code = `
        import fs from 'fs'
        function openFile(path: string) {
          return fs.open(path, 'r')
        }
      `

      const detections = detectPathTraversal(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })
  })
})
