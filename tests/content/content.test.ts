import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { SEZIONI } from '../../app/utils/sezioni'
import { validateArticle } from './validators'

const NEWS = fileURLToPath(new URL('../../content/news', import.meta.url))
const PUBLIC = fileURLToPath(new URL('../../public', import.meta.url))
const ABOUT = fileURLToPath(new URL('../../content/pages/about.yml', import.meta.url))

// gray-matter legge solo lo YAML tra i `---`: così basta per un file .yml, senza un'altra libreria.
const about = matter(`---\n${readFileSync(ABOUT, 'utf-8')}\n---`).data
const redazione: { name: string }[] = about.team?.items ?? []

const riferimenti = {
  publicDir: PUBLIC,
  sezioni: SEZIONI.map(sezione => sezione.slug),
  firme: redazione.map(firma => firma.name),
}

const articles = readdirSync(NEWS, 'utf-8')
  .filter(file => file.endsWith('.md'))
  .sort()

describe('content/pages/about.yml', () => {
  // Il dominio del giornale non ha record DNS, quindi nessun indirizzo su quel dominio riceve posta.
  it('non ha il blocco dei contatti né un indirizzo email', () => {
    expect(about).not.toHaveProperty('contact')
    expect(readFileSync(ABOUT, 'utf-8')).not.toMatch(/[\w.+-]+@[\w-]+\.\w+/)
  })
})

describe('content/news', () => {
  // Senza questo controllo, una cartella spostata farebbe passare il test senza controllare nulla.
  it('contiene almeno un Articolo', () => {
    expect(articles).not.toEqual([])
  })

  it('legge la Redazione da "Chi siamo"', () => {
    expect(riferimenti.firme).not.toEqual([])
  })

  it.each(articles)('%s ha tutti i campi, con Sezione e Firma del giornale', (file) => {
    const { data } = matter(readFileSync(join(NEWS, file), 'utf-8'))
    const errors = validateArticle(data, riferimenti)
    // Il messaggio di errore porta il file e un problema per riga.
    expect(errors, `content/news/${file}\n  - ${errors.join('\n  - ')}`).toEqual([])
  })
})
