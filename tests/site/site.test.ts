import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { beforeAll, describe, expect, it } from 'vitest'
import { SEZIONI } from '../../app/utils/sezioni'

const NEWS = fileURLToPath(new URL('../../content/news', import.meta.url))
const OUTPUT = fileURLToPath(new URL('../../.output/public', import.meta.url))
const STATIC_PAGES = ['/', '/news', '/about']

const articles = readdirSync(NEWS, 'utf-8')
  .filter(file => file.endsWith('.md'))
  .sort()
  .map((file) => {
    const { data } = matter(readFileSync(join(NEWS, file), 'utf-8'))
    return {
      path: `/news/${file.slice(0, -'.md'.length)}`,
      date: String(data.date),
      firma: String(data.firma),
      sezione: SEZIONI.find(sezione => sezione.slug === data.sezione)?.label,
    }
  })

const read = (file: string) => readFileSync(join(OUTPUT, file), 'utf-8')
const pageFile = (path: string) => join(path, 'index.html')

describe('sito generato', () => {
  // L'indirizzo del sito si ricava da robots.txt: il test controlla che il resto usi lo stesso, senza ripeterlo.
  let siteUrl: string
  let entries: { loc: string, lastmod?: string }[]

  beforeAll(() => {
    expect(existsSync(OUTPUT), 'manca .output/public: esegui prima npm run generate').toBe(true)
    siteUrl = read('robots.txt').match(/^Sitemap: (https:\/\/\S+)\/sitemap\.xml$/m)?.[1] ?? ''
    entries = [...read('sitemap.xml').matchAll(/<url>(.*?)<\/url>/gs)].map(([, block]) => ({
      loc: block?.match(/<loc>(.*?)<\/loc>/)?.[1] ?? '',
      lastmod: block?.match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
    }))
  })

  it('robots.txt punta alla sitemap con un indirizzo assoluto', () => {
    expect(siteUrl).not.toBe('')
  })

  it('la sitemap elenca le pagine statiche e ogni Articolo, e nient’altro', () => {
    const expected = [...STATIC_PAGES, ...articles.map(a => a.path)].map(path => `${siteUrl}${path}`)
    expect(entries.map(e => e.loc).sort()).toEqual(expected.sort())
  })

  it('ogni indirizzo della sitemap ha una pagina generata', () => {
    expect(entries).not.toEqual([])
    const missing = entries.map(e => e.loc.replace(siteUrl, '')).filter(path => !existsSync(join(OUTPUT, pageFile(path))))
    expect(missing).toEqual([])
  })

  it('la data di ogni Articolo è il suo lastmod', () => {
    const lastmod = Object.fromEntries(entries.map(e => [e.loc, e.lastmod]))
    expect(articles).not.toEqual([])
    for (const { path, date } of articles) expect(lastmod[`${siteUrl}${path}`], path).toBe(date)
  })

  it.each(articles)('$path ha la sua pagina, con l’indirizzo canonico del sito', ({ path }) => {
    expect(read(pageFile(path))).toContain(`<link rel="canonical" href="${siteUrl}${path}">`)
  })

  it.each(articles)('$path indica la Firma nei metadati', ({ path, firma }) => {
    expect(read(pageFile(path))).toContain(`<meta property="article:author" content="${firma}">`)
  })

  it.each(articles)('$path mostra il nome della sua Sezione', ({ path, sezione }) => {
    // Menu e footer elencano tutte le Sezioni: qui conta solo il corpo della pagina.
    const body = read(pageFile(path)).replace(/<(header|footer)\b.*?<\/\1>/gs, '')
    expect(sezione, 'Sezione non in elenco').toBeDefined()
    expect(body).toMatch(new RegExp(`>\\s*${sezione}\\s*<`))
  })

  it('esiste la pagina 404', () => {
    expect(existsSync(join(OUTPUT, '404.html'))).toBe(true)
  })
})
