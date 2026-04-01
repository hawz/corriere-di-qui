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
        description: z.string().optional(),
        date: z.string().optional(),
        image: z.string().optional(),
        categoria: z.string().optional(),
        autore: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    }),
  },
})
