import { readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { imageMeta } from 'image-meta'

type Frontmatter = Record<string, unknown>

const REQUIRED = ['title', 'description', 'date', 'image', 'sezione', 'firma']
// La data ha un controllo tutto suo: vedi dateProblem.
const TEXT = REQUIRED.filter(field => field !== 'date')

// I limiti sulle immagini originali: la Netlify Image CDN non gestisce ogni formato, e i file restano nel repo.
// I formati ammessi: il tipo che si legge nel file e il nome per chi legge.
const FORMATI = new Map([['jpg', 'JPEG'], ['png', 'PNG'], ['webp', 'WebP']])
const MAX_LARGHEZZA = 2000
// 1 MB come lo conta il Finder: un milione di byte.
const MAX_BYTE = 1_000_000

/** Ciò con cui un Articolo va confrontato. */
export interface Riferimenti {
  publicDir: string
  /** Gli slug delle Sezioni. */
  sezioni: string[]
  /** I nomi della Redazione. */
  firme: string[]
}

/** I problemi del frontmatter di un Articolo, uno per elemento. */
export function validateArticle(data: Frontmatter, { publicDir, sezioni, firme }: Riferimenti): string[] {
  const errors = REQUIRED.filter(field => !data[field]).map(field => `${field}: campo mancante`)
  errors.push(...TEXT.filter(field => data[field] && typeof data[field] !== 'string').map(field => `${field}: deve essere un testo`))
  // I controlli sul valore valgono solo per un testo: convertire una lista in testo la farebbe passare.
  const text = (field: string) => typeof data[field] === 'string' ? data[field] : ''
  const [image, sezione, firma] = [text('image'), text('sezione'), text('firma')]
  if (data.date) {
    const problem = dateProblem(data.date)
    if (problem) errors.push(`date: ${problem}`)
  }
  if (sezione && !sezioni.includes(sezione)) {
    errors.push(`sezione: "${sezione}" non è nell’elenco delle Sezioni (${sezioni.join(', ')})`)
  }
  if (firma && !firme.includes(firma)) {
    errors.push(`firma: "${firma}" non fa parte della Redazione in content/pages/about.yml (${firme.join(', ')})`)
  }
  if (image) errors.push(...imageProblems(image, publicDir).map(problem => `image: ${problem}`))
  return errors
}

/** I problemi delle immagini inserite nel testo di un Articolo, uno per elemento. */
export async function validateBodyImages(markdown: string, publicDir: string): Promise<string[]> {
  // Lo stesso parser che rende gli Articoli: così si controlla ogni immagine che il lettore vedrà, in qualunque forma sia scritta.
  const { body } = await parseMarkdown(markdown)
  return imageAddresses(body).flatMap(address =>
    imageProblems(address, publicDir).map(problem => `testo, immagine ${address}: ${problem}`))
}

type MarkdownNode = Awaited<ReturnType<typeof parseMarkdown>>['body']['children'][number]

// I tag che sul sito mostrano un’immagine. Un <source> conta solo per la `srcset`: il suo `src` è quello di un video.
const IMAGE_TAGS = ['img', 'prose-img', 'nuxt-img', 'nuxt-picture']

function imageAddresses(node: MarkdownNode | { type: 'root', children: MarkdownNode[] }): string[] {
  if (node.type !== 'element' && node.type !== 'root') return []
  const own: string[] = []
  if (node.type === 'element') {
    const { src, srcSet } = node.props ?? {}
    if (IMAGE_TAGS.includes(node.tag) && src) own.push(String(src))
    if ([...IMAGE_TAGS, 'source'].includes(node.tag) && srcSet) {
      own.push(...String(srcSet).split(',').flatMap(candidate => candidate.trim().split(/\s+/)[0] || []))
    }
  }
  return [...own, ...(node.children ?? []).flatMap(imageAddresses)]
}

function dateProblem(date: unknown): string | null {
  if (date instanceof Date) return 'va scritta tra virgolette, come "2026-03-20"'
  const text = typeof date === 'string' ? date : JSON.stringify(date)
  // Riscrivere la data scarta anche i giorni che non esistono, come il 30 febbraio.
  const day = new Date(`${text}T00:00:00Z`)
  const isDay = /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(day.getTime()) && day.toISOString().startsWith(text)
  return isDay ? null : `"${text}" non è una data nel formato AAAA-MM-GG`
}

/** I problemi di un’immagine, dato il percorso come è scritto nel contenuto, uno per elemento. */
export function imageProblems(image: string, publicDir: string): string[] {
  if (!image.startsWith('/')) return ['deve essere un percorso che inizia con /, come /images/foto.png']
  const path = join(publicDir, image)
  if (relative(publicDir, path).split(sep)[0] === '..') return [`il percorso ${image} esce da public/`]
  const stats = statSync(path, { throwIfNoEntry: false })
  if (!stats?.isFile()) return [`il file public${image} non esiste`]
  const weight = stats.size > MAX_BYTE
    ? [`pesa ${Math.ceil(stats.size / 1000)} KB: il massimo è ${MAX_BYTE / 1000} KB`]
    : []
  return [...weight, ...formatAndWidthProblems(readFileSync(path))].map(problem => `il file public${image} ${problem}`)
}

// Formato e larghezza si leggono dal contenuto del file: il nome e l’estensione non contano.
function formatAndWidthProblems(file: Buffer): string[] {
  const ammessi = `sono ammessi ${new Intl.ListFormat('it').format(FORMATI.values())}`
  let meta: ReturnType<typeof imageMeta>
  try {
    meta = imageMeta(file)
  }
  catch {
    return [`non è un’immagine riconosciuta: ${ammessi}`]
  }
  const { type = '', width = 0, height = 0, orientation = 1 } = meta
  if (!FORMATI.has(type)) return [`è un file ${type.toUpperCase()}: ${ammessi}`]
  // Con l’orientamento EXIF da 5 a 8 la foto si vede ruotata di 90°.
  const larghezza = orientation >= 5 ? height : width
  return larghezza > MAX_LARGHEZZA ? [`è largo ${larghezza} px: il massimo è ${MAX_LARGHEZZA} px`] : []
}
