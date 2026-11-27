// content.config.ts
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    pages: defineCollection({
      type: 'data',
      source: 'pages/*.yml',
      // Il tipo di una collezione `data` richiede uno schema. È vuoto: i campi dei file restano in `meta` (vedi usePageData).
      schema: z.object({}),
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
