// composables/usePageData.ts

/** I dati delle pagine in `content/pages/`, uno per file. */
interface Pagine {
  'pages/home': {
    masthead?: string
    tagline?: string
    subtagline?: string
    ticker?: string[]
  }
  'pages/news': {
    title?: string
    hero?: { heading?: string, subheading?: string }
  }
  'pages/about': {
    title?: string
    hero?: { heading?: string, image?: string }
    bio?: { paragraphs?: string[] }
    team?: { heading?: string, items?: { name: string, role: string, note: string }[] }
    mission?: { heading?: string, text?: string }
  }
}

export async function usePageData<Stem extends keyof Pagine>(stem: Stem) {
  const { data } = await useAsyncData(`page-${stem}`, () =>
    queryCollection('pages').where('stem', '=', stem).first()
  )
  // Lo schema della collezione `pages` è vuoto: i campi del file arrivano in `meta`, senza tipi.
  // Il tipo qui sopra è una dichiarazione: nessuno controlla che il file la rispetti.
  return computed(() => (data.value?.meta ?? null) as Pagine[Stem] | null)
}
