import { defineConfig } from 'vitest/config'

// Due gruppi di test, in Node e senza runtime Nuxt:
// `content` legge i file del repo; `site` legge il sito generato, quindi richiede `npm run generate`.
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'content', include: ['tests/content/**/*.test.ts'], environment: 'node' } },
      { test: { name: 'site', include: ['tests/site/**/*.test.ts'], environment: 'node' } },
    ],
  },
})
