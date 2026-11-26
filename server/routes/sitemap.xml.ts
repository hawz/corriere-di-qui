// server/routes/sitemap.xml.ts
export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/xml')

  // Leggi gli articoli dal filesystem direttamente
  const { readdir } = await import('fs/promises')
  const { resolve } = await import('path')

  const blogDir = resolve('./content/blog')
  let files: string[]

  try {
    files = await readdir(blogDir)
  } catch {
    files = []
  }

  const siteUrl = 'https://corriere-di-qui.netlify.app'
  const today = new Date().toISOString()

  const staticUrls = [
    { loc: '/', priority: '1.0' },
    { loc: '/blog', priority: '0.9' },
    { loc: '/about', priority: '0.7' },
  ]

  const articleUrls = files
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      loc: `/blog/${f.replace('.md', '')}`,
      priority: '0.8',
    }))

  const allUrls = [...staticUrls, ...articleUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${siteUrl}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return xml
})
