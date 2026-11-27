import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { beforeAll, describe, expect, it } from 'vitest'
import { SEZIONI } from '../../app/utils/sezioni'

const NEWS = fileURLToPath(new URL('../../content/news', import.meta.url))
const NEWS_PAGE = fileURLToPath(new URL('../../content/pages/news.yml', import.meta.url))
const ABOUT_PAGE = fileURLToPath(new URL('../../content/pages/about.yml', import.meta.url))
const OUTPUT = fileURLToPath(new URL('../../.output/public', import.meta.url))
const STATIC_PAGES = ['/', '/news', '/about']
const DEFAULT_SOCIAL_IMAGE = '/images/og-default.png'

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
      image: data.image as string | undefined,
    }
  })

const ALL_PAGES = [...STATIC_PAGES, ...articles.map(a => a.path)]

// gray-matter legge solo il frontmatter: i delimitatori servono a fargli leggere il YAML intero.
const readYaml = (file: string) => matter(`---\n${readFileSync(file, 'utf-8')}\n---`).data
const newsPage = readYaml(NEWS_PAGE) as { title: string, hero: { subheading: string } }
const aboutPage = readYaml(ABOUT_PAGE) as { hero: { image: string } }

const read = (file: string) => readFileSync(join(OUTPUT, file), 'utf-8')
const pageFile = (path: string) => join(path, 'index.html')
const blockOf = (path: string, tag: 'header' | 'footer') =>
  read(pageFile(path)).match(new RegExp(`<${tag}\\b.*?</${tag}>`, 's'))?.[0] ?? ''
// Menu e footer ripetono i nomi delle Sezioni: `bodyOf` li toglie e lascia il corpo della pagina.
const bodyOf = (path: string) => read(pageFile(path)).replace(/<(header|footer)\b.*?<\/\1>/gs, '')

const imagesOf = (path: string) => read(pageFile(path)).match(/<img\b[^>]*>/g) ?? []
const attributeOf = (tag: string, name: string) =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]?.replaceAll('&amp;', '&') ?? ''
const candidatesOf = (tag: string) => attributeOf(tag, 'srcset').split(', ').map((candidate) => {
  const [address = '', descriptor] = candidate.split(' ')
  return { address, descriptor }
})
// Tutti gli indirizzi tra cui il browser può scegliere: `src` e ogni voce di `srcset`.
const addressesOf = (tag: string) =>
  [attributeOf(tag, 'src'), ...candidatesOf(tag).map(candidate => candidate.address)].filter(Boolean)
// Un indirizzo della Netlify Image CDN dice quale file serve, in che formato (`fm`) e a che larghezza (`w`).
const cdnRequest = (address: string) => {
  const [endpoint, query] = address.split('?')
  return { endpoint, ...Object.fromEntries(new URLSearchParams(query)) } as Record<string, string | undefined>
}
// I file originali che le immagini di una pagina chiedono alla CDN.
const originalsOf = (path: string) => [...new Set(imagesOf(path).map(tag => cdnRequest(attributeOf(tag, 'src')).url))]

const sezioniAttese = SEZIONI.filter(sezione => articles.some(article => article.sezione === sezione.label))

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
    const expected = ALL_PAGES.map(path => `${siteUrl}${path}`)
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
    expect(sezione, 'Sezione non in elenco').toBeDefined()
    expect(bodyOf(path)).toMatch(new RegExp(`>\\s*${sezione}\\s*<`))
  })

  // Un link attorno al testo prenderebbe l'aspetto dei link dell'Articolo: rosso e sottolineato.
  it('i sottotitoli degli Articoli hanno il loro id e non sono link a se stessi', () => {
    const headings = articles.flatMap(({ path }) =>
      [...bodyOf(path).matchAll(/<h[2-6]\b[^>]*>.*?<\/h[2-6]>/gs)].map(([html]) => ({ path, html })))
    expect(headings).not.toEqual([])
    for (const { path, html } of headings) {
      expect(html, path).toMatch(/^<h[2-6]\b[^>]*\sid="[^"]+"/)
      expect(html, path).not.toMatch(/<a\b[^>]*\shref="#/)
    }
  })

  it('la testata di /news mostra titolo e sottotitolo di news.yml', () => {
    const html = read(pageFile('/news'))
    expect(html).toMatch(new RegExp(`<h2\\b[^>]*>\\s*${newsPage.title}\\s*</h2>`))
    expect(html).toMatch(new RegExp(`<p\\b[^>]*>\\s*${newsPage.hero.subheading}\\s*</p>`))
  })

  it('la description di /news è il sottotitolo di news.yml', () => {
    expect(read(pageFile('/news'))).toContain(`<meta name="description" content="${newsPage.hero.subheading}">`)
  })

  // Il menu da telefono compare solo al tocco, quindi nelle pagine generate non c'è.
  it.each(STATIC_PAGES)('menu e footer di %s propongono solo le Sezioni con almeno un Articolo', (path) => {
    for (const tag of ['header', 'footer'] as const) {
      const links = [...blockOf(path, tag).matchAll(/href="\/news\?sezione=([^"]+)"/g)].map(([, slug]) => slug)
      expect(links, tag).toEqual(sezioniAttese.map(sezione => sezione.slug))
    }
  })

  it('il filtro di /news propone solo le Sezioni con almeno un Articolo', () => {
    const buttons = [...bodyOf('/news').matchAll(/<button\b[^>]*>(.*?)<\/button>/gs)]
      .map(([, text]) => text?.replace(/<!--.*?-->/g, '').trim())
    expect(buttons).toEqual(['Tutti', ...sezioniAttese.map(sezione => sezione.label)])
  })

  // La home ha posto per 7 Articoli diversi: apertura, tre nella colonna e tre nella griglia.
  it('la home porta a tutti gli Articoli più recenti', () => {
    const newest = [...articles].sort((a, b) => b.date.localeCompare(a.date))
    // Se l'ottavo ha la stessa data di quelli prima, quali entrano non è stabilito: si controllano solo i certi.
    const mustAppear = newest.filter(article => article.date > (newest[7]?.date ?? ''))
    expect(mustAppear).not.toEqual([])
    expect(mustAppear.map(a => a.path).filter(path => !bodyOf('/').includes(`href="${path}"`))).toEqual([])
  })

  // La 404 statica è un guscio vuoto: il footer lo disegna il browser, e va controllato lì.
  it.each(ALL_PAGES)('il footer di %s avverte che è tutto inventato', (path) => {
    expect(blockOf(path, 'footer')).toContain('Giornale satirico: fatti, nomi e firme sono inventati')
  })

  it.each(ALL_PAGES)('%s non cita registrazioni in tribunale', (path) => {
    expect(read(pageFile(path))).not.toContain('Reg. Trib.')
  })

  it('in /about la Redazione ha un "Direttore", non un "Direttore responsabile"', () => {
    expect(bodyOf('/about')).toMatch(/>\s*Direttore\b/)
    expect(read(pageFile('/about'))).not.toContain('Direttore responsabile')
  })

  // Il dominio del giornale non riceve posta: la pagina non deve invitare a scrivere.
  it('/about non ha il blocco "Scrivici" né un indirizzo email', () => {
    expect(read(pageFile('/about'))).not.toMatch(/Scrivici|mailto:|redazione@/)
    expect(bodyOf('/about')).not.toMatch(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)
  })

  it('le immagini di tutte le pagine passano dalla Netlify Image CDN in WebP', () => {
    const addresses = ALL_PAGES.flatMap(path =>
      imagesOf(path).flatMap(addressesOf).map(address => ({ path, address })))
    expect(addresses).not.toEqual([])
    for (const { path, address } of addresses) {
      expect(cdnRequest(address), `${path}: ${address}`).toMatchObject({ endpoint: '/.netlify/images', fm: 'webp' })
    }
  })

  it.each(articles)('$path mostra l’immagine del suo Articolo', ({ path, image }) => {
    if (image) expect(originalsOf(path)).toContain(image)
  })

  it('/about mostra l’immagine di about.yml, /news quelle di tutti gli Articoli', () => {
    expect(originalsOf('/about')).toEqual([aboutPage.hero.image])
    expect(originalsOf('/news').sort()).toEqual(articles.flatMap(a => a.image ?? []).sort())
  })

  it('la home mostra le immagini degli Articoli', () => {
    expect(originalsOf('/')).not.toEqual([])
    for (const original of originalsOf('/')) expect(articles.map(a => a.image)).toContain(original)
  })

  // Con `sizes` il browser sceglie tra più larghezze. Una forma come `100vw md:304px` ne genera anche di 1 e 2 px.
  it('ogni immagine ha un sizes e offre solo larghezze vere', () => {
    const images = ALL_PAGES.flatMap(path => imagesOf(path).map(tag => ({ path, tag })))
    expect(images).not.toEqual([])
    for (const { path, tag } of images) {
      expect(attributeOf(tag, 'sizes'), `${path}: ${tag}`).not.toBe('')
      for (const { address, descriptor } of candidatesOf(tag)) {
        const width = Number(cdnRequest(address).w)
        expect(descriptor, `${path}: ${address}`).toBe(`${width}w`)
        expect(width, `${path}: ${address}`).toBeGreaterThan(2)
      }
    }
  })

  const immaginiSocial = [
    // Le pagine senza un'immagine propria usano quella predefinita.
    { path: '/', image: DEFAULT_SOCIAL_IMAGE },
    { path: '/news', image: DEFAULT_SOCIAL_IMAGE },
    { path: '/about', image: aboutPage.hero.image },
    ...articles.map(({ path, image }) => ({ path, image: image ?? DEFAULT_SOCIAL_IMAGE })),
  ]

  // I social non garantiscono il WebP: per loro la CDN genera un JPEG.
  it.each(immaginiSocial)('$path offre ai social un JPEG largo 1200 px, con un indirizzo assoluto', ({ path, image }) => {
    const html = read(pageFile(path))
    for (const meta of ['property="og:image"', 'name="twitter:image"']) {
      const address = attributeOf(html.match(new RegExp(`<meta ${meta}[^>]*>`))?.[0] ?? '', 'content')
      expect(address.startsWith(`${siteUrl}/`), `${meta}: ${address}`).toBe(true)
      expect(cdnRequest(address.slice(siteUrl.length)), meta)
        .toEqual({ endpoint: '/.netlify/images', fm: 'jpg', w: '1200', url: image })
    }
  })

  // ipx è il ripiego di @nuxt/image fuori da Netlify: sul sito pubblicato quegli indirizzi non esistono.
  it('nel sito generato non restano indirizzi _ipx', () => {
    const files = readdirSync(OUTPUT, { recursive: true, encoding: 'utf-8' })
    expect(files.filter(file => file.includes('_ipx'))).toEqual([])
    const pages = files.filter(file => /\.(html|json)$/.test(file))
    expect(pages).not.toEqual([])
    expect(pages.filter(file => read(file).includes('/_ipx/'))).toEqual([])
  })

  it('esiste la pagina 404', () => {
    expect(existsSync(join(OUTPUT, '404.html'))).toBe(true)
  })
})
