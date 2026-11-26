import { defineConfig } from 'vitest/config'

// I test dei contenuti leggono i file del repo in Node, senza runtime Nuxt né build.
export default defineConfig({
  test: {
    include: ['tests/content/**/*.test.ts'],
    environment: 'node',
  },
})
