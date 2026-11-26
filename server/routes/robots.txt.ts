// Generato durante la build (vedi `nitro.prerender` in nuxt.config.ts).
export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
})
