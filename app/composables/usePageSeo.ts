// composables/usePageSeo.ts
export const usePageSeo = ({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedAt,
  author,
}: {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedAt?: string
  author?: string
}) => {
  const site = useSiteConfig()

  const fullTitle = title ? `${title} — ${site.siteName}` : site.siteName
  const metaDescription = description ?? site.description
  const metaImage = image ?? site.defaultImage
  const canonicalUrl = url ?? site.siteUrl

  useSeoMeta({
    // Base
    title: fullTitle,
    description: metaDescription,

    // Open Graph
    ogTitle: fullTitle,
    ogDescription: metaDescription,
    ogImage: metaImage.startsWith('http') ? metaImage : `${site.siteUrl}${metaImage}`,
    ogUrl: canonicalUrl,
    ogType: type,
    ogLocale: site.locale,
    ogSiteName: site.siteName,

    // Twitter/X Card
    twitterCard: 'summary_large_image',
    twitterTitle: fullTitle,
    twitterDescription: metaDescription,
    twitterImage: metaImage.startsWith('http') ? metaImage : `${site.siteUrl}${metaImage}`,
    ...(site.twitterHandle && { twitterSite: site.twitterHandle }),

    // Articolo (solo se type === 'article')
    ...(type === 'article' && publishedAt && {
      articlePublishedTime: new Date(publishedAt).toISOString(),
    }),
    ...(type === 'article' && author && {
      articleAuthor: [author],
    }),
  })

  // Canonical URL
  useHead({
    link: [
      { rel: 'canonical', href: canonicalUrl },
    ],
  })
}
