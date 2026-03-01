import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectBlockingOperations } from './blocking-operations'

describe('Blocking Operations Detector', () => {
  describe('synchronous file operations', () => {
    it('should detect readFileSync', () => {
      const code = `
        import fs from 'fs'

        function readConfig() {
          const content = fs.readFileSync('config.json', 'utf-8')
          return JSON.parse(content)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections.length).toBeGreaterThan(0)
      expect(syncDetections[0]?.severity).toBe('high')
      expect(syncDetections[0]?.message).toContain('readFileSync')
    })

    it('should detect writeFileSync', () => {
      const code = `
        import fs from 'fs'

        function saveData(data: object) {
          fs.writeFileSync('data.json', JSON.stringify(data))
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections.length).toBeGreaterThan(0)
      expect(syncDetections[0]?.message).toContain('writeFileSync')
    })

    it('should detect existsSync', () => {
      const code = `
        import fs from 'fs'

        function checkFile(path: string) {
          return fs.existsSync(path)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections.length).toBeGreaterThan(0)
      expect(syncDetections[0]?.message).toContain('existsSync')
    })

    it('should detect readdirSync', () => {
      const code = `
        import fs from 'fs'

        function listFiles(dir: string) {
          return fs.readdirSync(dir)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections.length).toBeGreaterThan(0)
    })

    it('should detect mkdirSync', () => {
      const code = `
        import fs from 'fs'

        function ensureDir(dir: string) {
          fs.mkdirSync(dir, { recursive: true })
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections.length).toBeGreaterThan(0)
    })

    it('should detect statSync', () => {
      const code = `
        import fs from 'fs'

        function getStats(path: string) {
          return fs.statSync(path)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections.length).toBeGreaterThan(0)
    })

    it('should not flag async fs operations', () => {
      const code = `
        import fs from 'fs/promises'

        async function readConfig() {
          const content = await fs.readFile('config.json', 'utf-8')
          return JSON.parse(content)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections).toEqual([])
    })

    it('should not flag callback-based fs operations', () => {
      const code = `
        import fs from 'fs'

        function readConfig(callback: (err: Error | null, data: string) => void) {
          fs.readFile('config.json', 'utf-8', callback)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections).toEqual([])
    })
  })

  describe('XMLHttpRequest detection', () => {
    it('should detect new XMLHttpRequest()', () => {
      const code = `
        function fetchData(url: string) {
          const xhr = new XMLHttpRequest()
          xhr.open('GET', url)
          xhr.send()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const xhrDetections = detections.filter(d => d.ruleId === 'xmlhttprequest-usage')

      expect(xhrDetections.length).toBeGreaterThan(0)
      expect(xhrDetections[0]?.severity).toBe('medium')
      expect(xhrDetections[0]?.message).toContain('XMLHttpRequest')
      expect(xhrDetections[0]?.message).toContain('deprecated')
    })

    it('should not flag fetch API usage', () => {
      const code = `
        async function getData(url: string) {
          const response = await fetch(url)
          return response.json()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const xhrDetections = detections.filter(d => d.ruleId === 'xmlhttprequest-usage')

      expect(xhrDetections).toEqual([])
    })

    it('should not flag axios usage', () => {
      const code = `
        import axios from 'axios'

        async function getData(url: string) {
          const { data } = await axios.get(url)
          return data
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const xhrDetections = detections.filter(d => d.ruleId === 'xmlhttprequest-usage')

      expect(xhrDetections).toEqual([])
    })
  })

  describe('blocking loop detection', () => {
    it('should detect for loop with large iteration count', () => {
      const code = `
        function heavyComputation() {
          let sum = 0
          for (let i = 0; i < 100000; i++) {
            sum += Math.sqrt(i)
          }
          return sum
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const blockingLoopDetections = detections.filter(d => d.ruleId === 'blocking-loop')

      expect(blockingLoopDetections.length).toBeGreaterThan(0)
      expect(blockingLoopDetections[0]?.severity).toBe('medium')
      expect(blockingLoopDetections[0]?.message).toContain('block the event loop')
    })

    it('should detect while loop with large iteration check', () => {
      // Note: Detection requires the large number to be inside the loop condition
      const code = `
        function countUp() {
          let i = 0
          while (i < 50000) {
            console.log(i)
            i++
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const blockingLoopDetections = detections.filter(d => d.ruleId === 'blocking-loop')

      expect(blockingLoopDetections.length).toBeGreaterThan(0)
    })

    it('should not flag small loops', () => {
      const code = `
        function shortLoop() {
          for (let i = 0; i < 100; i++) {
            console.log(i)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const blockingLoopDetections = detections.filter(d => d.ruleId === 'blocking-loop')

      expect(blockingLoopDetections).toEqual([])
    })

    it('should not flag loops without literal iteration count', () => {
      const code = `
        function dynamicLoop(items: Item[]) {
          for (const item of items) {
            process(item)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const blockingLoopDetections = detections.filter(d => d.ruleId === 'blocking-loop')

      expect(blockingLoopDetections).toEqual([])
    })
  })

  describe('metadata and suggestions', () => {
    it('should suggest async version for sync fs operations', () => {
      const code = `
        import fs from 'fs'

        function readConfig() {
          return fs.readFileSync('config.json', 'utf-8')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections[0]?.metadata?.method).toBe('readFileSync')
      expect(syncDetections[0]?.metadata?.suggestion).toContain('readFile')
    })

    it('should suggest fetch for XMLHttpRequest', () => {
      const code = `
        function getData() {
          const xhr = new XMLHttpRequest()
          return xhr
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const xhrDetections = detections.filter(d => d.ruleId === 'xmlhttprequest-usage')

      expect(xhrDetections[0]?.metadata?.suggestion).toContain('fetch')
    })

    it('should suggest Web Workers for blocking loops', () => {
      const code = `
        function heavyWork() {
          for (let i = 0; i < 1000000; i++) {
            compute(i)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const blockingLoopDetections = detections.filter(d => d.ruleId === 'blocking-loop')

      expect(blockingLoopDetections[0]?.metadata?.suggestion).toContain('Web Workers')
    })
  })

  describe('edge cases', () => {
    it('should handle multiple sync operations in one file', () => {
      const code = `
        import fs from 'fs'

        function processFiles() {
          const files = fs.readdirSync('./data')
          for (const file of files) {
            const content = fs.readFileSync('./data/' + file, 'utf-8')
            const stats = fs.statSync('./data/' + file)
            console.log(content, stats)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections.length).toBe(3)
    })

    it('should handle nested blocking operations', () => {
      const code = `
        import fs from 'fs'

        function nestedBlocking() {
          for (let i = 0; i < 20000; i++) {
            const data = fs.readFileSync('file.txt', 'utf-8')
            console.log(data)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')

      // Should detect both the blocking loop and the sync fs operation
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')
      const blockingLoopDetections = detections.filter(d => d.ruleId === 'blocking-loop')

      expect(syncDetections.length).toBeGreaterThan(0)
      expect(blockingLoopDetections.length).toBeGreaterThan(0)
    })

    it('should not flag fs methods that do not end with Sync', () => {
      const code = `
        import fs from 'fs'

        function asyncOperations() {
          fs.readFile('file.txt', (err, data) => {
            console.log(data)
          })

          fs.writeFile('out.txt', 'data', (err) => {
            if (err) throw err
          })
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBlockingOperations(ast, 'test.ts')
      const syncDetections = detections.filter(d => d.ruleId === 'sync-fs-operation')

      expect(syncDetections).toEqual([])
    })
  })
})
