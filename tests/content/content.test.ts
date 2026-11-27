import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { IMMAGINE_SOCIAL_PREDEFINITA } from '../../app/utils/immagini'
import { SEZIONI } from '../../app/utils/sezioni'
import { imageProblems, validateArticle, validateBodyImages } from './validators'

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

// Il messaggio di errore porta il file e un problema per riga.
const expectNoProblems = (file: string, problems: string[]) =>
  expect(problems, `${file}\n  - ${problems.join('\n  - ')}`).toEqual([])

const articles = readdirSync(NEWS, 'utf-8')
  .filter(file => file.endsWith('.md'))
  .sort()

describe('content/pages/about.yml', () => {
  // Il dominio del giornale non ha record DNS, quindi nessun indirizzo su quel dominio riceve posta.
  it('non ha il blocco dei contatti né un indirizzo email', () => {
    expect(about).not.toHaveProperty('contact')
    expect(readFileSync(ABOUT, 'utf-8')).not.toMatch(/[\w.+-]+@[\w-]+\.\w+/)
  })

  it('ha un’immagine entro i limiti', () => {
    const problems = imageProblems(String(about.hero?.image ?? ''), PUBLIC)
    expectNoProblems('content/pages/about.yml', problems.map(problem => `hero.image: ${problem}`))
  })
})

describe('immagine predefinita per i social', () => {
  it('è entro i limiti', () => {
    expectNoProblems('app/utils/immagini.ts', imageProblems(IMMAGINE_SOCIAL_PREDEFINITA, PUBLIC))
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

  it.each(articles)('%s ha tutti i campi, con Sezione e Firma del giornale, e immagini entro i limiti', async (file) => {
    const { data, content } = matter(readFileSync(join(NEWS, file), 'utf-8'))
    expectNoProblems(`content/news/${file}`,
      [...validateArticle(data, riferimenti), ...await validateBodyImages(content, PUBLIC)])
  })
})
