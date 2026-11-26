import { statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

type Frontmatter = Record<string, unknown>

const REQUIRED = ['title', 'description', 'date', 'image']

/** I problemi del frontmatter di un Articolo, uno per elemento. */
export function validateArticle(data: Frontmatter, publicDir: string): string[] {
  const errors = REQUIRED.filter(field => !data[field]).map(field => `${field}: campo mancante`)
  if (data.image) {
    const problem = imageProblem(String(data.image), publicDir)
    if (problem) errors.push(`image: ${problem}`)
  }
  return errors
}

function imageProblem(image: string, publicDir: string): string | null {
  if (!image.startsWith('/')) return 'deve essere un percorso che inizia con /, come /images/foto.png'
  const path = join(publicDir, image)
  if (relative(publicDir, path).split(sep)[0] === '..') return `il percorso ${image} esce da public/`
  const isFile = statSync(path, { throwIfNoEntry: false })?.isFile()
  return isFile ? null : `il file public${image} non esiste`
}
