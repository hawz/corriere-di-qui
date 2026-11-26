import { statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

type Frontmatter = Record<string, unknown>

const REQUIRED = ['title', 'description', 'date', 'image', 'sezione', 'firma']
// La data ha un controllo tutto suo: vedi dateProblem.
const TEXT = REQUIRED.filter(field => field !== 'date')

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
  if (image) {
    const problem = imageProblem(image, publicDir)
    if (problem) errors.push(`image: ${problem}`)
  }
  return errors
}

function dateProblem(date: unknown): string | null {
  if (date instanceof Date) return 'va scritta tra virgolette, come "2026-03-20"'
  const text = typeof date === 'string' ? date : JSON.stringify(date)
  // Riscrivere la data scarta anche i giorni che non esistono, come il 30 febbraio.
  const day = new Date(`${text}T00:00:00Z`)
  const isDay = /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(day.getTime()) && day.toISOString().startsWith(text)
  return isDay ? null : `"${text}" non è una data nel formato AAAA-MM-GG`
}

function imageProblem(image: string, publicDir: string): string | null {
  if (!image.startsWith('/')) return 'deve essere un percorso che inizia con /, come /images/foto.png'
  const path = join(publicDir, image)
  if (relative(publicDir, path).split(sep)[0] === '..') return `il percorso ${image} esce da public/`
  const isFile = statSync(path, { throwIfNoEntry: false })?.isFile()
  return isFile ? null : `il file public${image} non esiste`
}
