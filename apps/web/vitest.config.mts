import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Only the framework-free modules. Component tests would need a DOM
    // environment and React Testing Library, which this app does not carry yet.
    include: ['src/lib/**/*.test.ts'],
  },
})
