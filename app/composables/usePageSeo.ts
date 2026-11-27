// composables/usePageSeo.ts
export const usePageSeo = ({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedAt,
  firma,
}: {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedAt?: string
  firma?: string
}) => {
  const site = useSiteConfig()

  const fullTitle = title ? `${title} — ${site.siteName}` : site.siteName
  const metaDescription = description ?? site.description
  // I social non garantiscono il WebP: per loro la CDN genera un JPEG largo 1200 px.
  const socialImage = useImage()(image ?? site.defaultImage, { width: 1200, format: 'jpg' })
  const metaImage = socialImage.startsWith('http') ? socialImage : `${site.siteUrl}${socialImage}`
  const canonicalUrl = url ?? site.siteUrl

  useSeoMeta({
    // Base
    title: fullTitle,
    description: metaDescription,

    // Open Graph
    ogTitle: fullTitle,
    ogDescription: metaDescription,
    ogImage: metaImage,
    ogUrl: canonicalUrl,
    ogType: type,
    ogLocale: site.locale,
    ogSiteName: site.siteName,

    // Twitter/X Card
    twitterCard: 'summary_large_image',
    twitterTitle: fullTitle,
    twitterDescription: metaDescription,
    twitterImage: metaImage,
    // ...(site.twitterHandle && { twitterSite: site.twitterHandle }),

    // Articolo (solo se type === 'article')
    ...(type === 'article' && publishedAt && {
      articlePublishedTime: new Date(publishedAt).toISOString(),
    }),
    ...(type === 'article' && firma && {
      articleAuthor: [firma],
    }),
  })

  // Canonical URL
  useHead({
    link: [
      { rel: 'canonical', href: canonicalUrl },
    ],
  })
}
