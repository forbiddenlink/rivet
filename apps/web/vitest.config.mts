import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Framework-free modules, API route handlers and metadata routes: both run as plain
    // functions over the standard Request/Response objects, no DOM involved.
    // Component tests would need a DOM environment and React Testing
    // Library, which this app does not carry yet, so those stay excluded.
    include: ['src/lib/**/*.test.ts', 'src/app/api/**/*.test.ts', 'src/app/*.test.ts'],
  },
})
