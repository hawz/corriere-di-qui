import { queryCollection } from '@nuxt/content/server'

// Generata durante la build (vedi `nitro.prerender` in nuxt.config.ts).
export default defineEventHandler(async (event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  const articles = await queryCollection(event, 'news').order('date', 'DESC').all()

  const urls = [
    { path: '/', priority: '1.0' },
    { path: '/news', priority: '0.9' },
    { path: '/about', priority: '0.7' },
    // `stem` è ciò con cui la pagina dell'Articolo lo cerca, quindi è il suo indirizzo.
    ...articles.map(article => ({ path: `/${article.stem}`, priority: '0.8', lastmod: article.date })),
  ]

  setHeader(event, 'Content-Type', 'application/xml')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${siteUrl}${url.path}</loc>${'lastmod' in url ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>
`
})
