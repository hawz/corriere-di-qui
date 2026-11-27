// La lettura delle pagine generate da Nuxt. Bastano le espressioni regolari: l'HTML lo scrive sempre Vue.

export const SOCIAL_METAS = ['og:image', 'twitter:image'] as const
export type SocialMeta = typeof SOCIAL_METAS[number]

export interface PageImage {
  attribute: 'src' | 'srcset'
  address: string
  /** La larghezza o la densità di una voce di `srcset`, come 800w. */
  descriptor?: string
}

export interface PageImages {
  /** Ogni `src` e ogni voce di `srcset` di <img> e <source>, nell'ordine della pagina. */
  images: PageImage[]
  metas: Partial<Record<SocialMeta, string>>
}

// Un tag intero: un valore tra virgolette può contenere `>`.
const TAG = /<(?:img|source|meta)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi
const ATTRIBUTE = /\s([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g

export function readImages(html: string): PageImages {
  const result: PageImages = { images: [], metas: {} }
  // Ciò che è dentro commenti e script non è un tag della pagina. Netlify aggiunge i suoi script alle anteprime.
  const markup = html.replace(/<!--.*?-->|<script\b.*?<\/script>/gs, '')
  for (const [tag] of markup.matchAll(TAG)) {
    const attributes = new Map([...tag.matchAll(ATTRIBUTE)]
      .map(([, name = '', double, single]) => [name.toLowerCase(), decode(double ?? single ?? '')]))
    if (/^<meta/i.test(tag)) {
      const name = attributes.get('property') ?? attributes.get('name')
      const meta = SOCIAL_METAS.find(candidate => candidate === name)
      if (meta) result.metas[meta] = attributes.get('content')
      continue
    }
    const src = attributes.get('src')
    if (src) result.images.push({ attribute: 'src', address: src })
    // La virgola separa le voci solo se seguita da uno spazio: un indirizzo può contenerne.
    for (const candidate of attributes.get('srcset')?.trim().split(/,\s+/) ?? []) {
      const [address, descriptor] = candidate.split(/\s+/)
      if (address) result.images.push({ attribute: 'srcset', address, descriptor })
    }
  }
  return result
}

const ENTITIES: Record<string, string> = { amp: '&', quot: '"', apos: '\'', lt: '<', gt: '>', '#39': '\'' }

// In un passaggio solo: `&amp;lt;` resta il testo `&lt;`.
function decode(value: string): string {
  return value.replace(/&(amp|quot|apos|lt|gt|#39);/g, (_, name: string) => ENTITIES[name]!)
}
