// composables/useSiteConfig.ts
export const useSiteConfig = () => ({
  siteName: 'Il Corriere di Qui',
  siteUrl: useRuntimeConfig().public.siteUrl,
  description: 'Notizie locali, tech e satira. Tutte le notizie che contano. E anche quelle che non contano.',
  // twitterHandle: '@ilcorrierediqui', // ← optional
  defaultImage: '/images/og-default.png',
  locale: 'it_IT',
})
