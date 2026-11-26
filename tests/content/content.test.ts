import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { validateArticle } from './validators'

const NEWS = fileURLToPath(new URL('../../content/news', import.meta.url))
const PUBLIC = fileURLToPath(new URL('../../public', import.meta.url))

const articles = readdirSync(NEWS, 'utf-8')
  .filter(file => file.endsWith('.md'))
  .sort()

describe('content/news', () => {
  // Senza questo controllo, una cartella spostata farebbe passare il test senza controllare nulla.
  it('contiene almeno un Articolo', () => {
    expect(articles).not.toEqual([])
  })

  it.each(articles)('%s ha titolo, descrizione, data e immagine', (file) => {
    const { data } = matter(readFileSync(join(NEWS, file), 'utf-8'))
    const errors = validateArticle(data, PUBLIC)
    // Il messaggio di errore porta il file e un problema per riga.
    expect(errors, `content/news/${file}\n  - ${errors.join('\n  - ')}`).toEqual([])
  })
})
