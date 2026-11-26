// content.config.ts
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    pages: defineCollection({
      type: 'data',
      source: 'pages/*.yml',
    }),
    news: defineCollection({
      type: 'page',
      source: 'news/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.string(),
        image: z.string(),
        sezione: z.string(),
        firma: z.string(),
        tags: z.array(z.string()).optional(),
      }),
    }),
  },
})
