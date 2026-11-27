import { readFileSync } from 'node:fs'
import { imageMeta } from 'image-meta'
import { describe, expect, it } from 'vitest'
import { verifyDeploy } from '../../scripts/verify-deploy/verify'

// Un'anteprima: le sue pagine, come la build locale, indicano per i social l'indirizzo della produzione.
const SITE = 'https://deploy-preview-1--giornale.netlify.app'
const PAGES = ['/', '/news/uno']

const PRODUCTION = 'https://giornale.netlify.app'

// Gli indirizzi come li scrive Nuxt: nelle immagini `&` diventa `&amp;`, nei meta resta com'è.
const cdn = (width: number, file: string) => `/.netlify/images?fm=webp&w=${width}&url=%2Fimages%2F${file}`
const social = (file: string) => `${PRODUCTION}/.netlify/images?fm=jpg&w=1200&url=%2Fimages%2F${file}`
const escape = (text: string) => text.replaceAll('&', '&amp;')
const image = (file: string, widths: number[]) => {
  const srcset = widths.map(width => `${cdn(width, file)} ${width}w`).join(', ')
  // Il `>` in `alt` e l'apostrofo in `onerror` sono lì per mettere alla prova la lettura dei tag.
  return `<img sizes="100vw" srcset="${escape(srcset)}" onerror="this.setAttribute(&#39;data-error&#39;, 1)" alt="Prima > dopo" src="${escape(cdn(widths.at(-1)!, file))}">`
}
const html = (file: string) => `<!DOCTYPE html><html><head>
<meta property="og:image" content="${social(file)}">
<meta name="twitter:image" content="${social(file)}">
</head><body>${image(file, [400, 1600])}</body></html>`

// Bastano le intestazioni dei file: da lì si leggono il formato e la larghezza.
const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(parts.flatMap(part => typeof part === 'string' ? [...Buffer.from(part)] : part))
const webp = (width: number) => bytes('RIFF', [22, 0, 0, 0], 'WEBPVP8X', [10, 0, 0, 0, 0, 0, 0, 0],
  [(width - 1) & 255, (width - 1) >> 8, 0], [99, 0, 0])
const jpeg = (width: number) => bytes([0xFF, 0xD8, 0xFF, 0xE0, 0, 4, 0, 0, 0xFF, 0xC0, 0, 17, 8, 0, 100, width >> 8, width & 255],
  new Array<number>(10).fill(0))

interface Reply {
  status?: number
  type?: string
  body?: string | Uint8Array<ArrayBuffer>
  /** Dove si arriva dopo i reindirizzamenti. */
  url?: string
}

interface SentRequest {
  address: string
  accept: string | null
  userAgent: string | null
}

/** Un sito finto, in cui tutto è a posto: ogni test ne guasta una parte. */
function fakeSite() {
  const build: Record<string, string> = { '/': html('prima.webp'), '/news/uno': html('uno.webp') }
  const remote: Record<string, Reply> = Object.fromEntries(
    Object.entries(build).map(([path, body]) => [path, { body }]))
  // Le pagine chiedono anche 1600 px, più di quanto sono larghi i file.
  const publicFiles: Record<string, Uint8Array> = { '/images/prima.webp': webp(1400), '/images/uno.webp': webp(1300) }
  const requests: SentRequest[] = []
  /** Con `cdn` un test cambia le risposte della Netlify Image CDN a certe richieste. */
  const faults: { cdn?: (request: SentRequest & { url: URL }) => Reply | undefined } = {}

  /** Come la CDN: converte nel formato `fm` e non ingrandisce. */
  const transform = (url: URL): Reply => {
    const original = publicFiles[url.searchParams.get('url')!]
    if (!original) return { status: 404 }
    const width = Math.min(Number(url.searchParams.get('w')), imageMeta(original).width!)
    return url.searchParams.get('fm') === 'jpg'
      ? { type: 'image/jpeg', body: jpeg(width) }
      : { type: 'image/webp', body: webp(width) }
  }

  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const target = new URL(String(input))
    const headers = new Headers(init?.headers)
    const request = { address: target.href, accept: headers.get('accept'), userAgent: headers.get('user-agent') }
    requests.push(request)
    const reply = target.pathname === '/.netlify/images'
      ? faults.cdn?.({ ...request, url: target }) ?? transform(target)
      : remote[target.pathname] ?? { status: 404 }
    const { status = 200, type = 'text/html; charset=UTF-8', body = '', url = target.href } = reply
    // Una Response creata a mano non ha un indirizzo: `fetch` metterebbe quello di arrivo.
    return Object.defineProperty(new Response(body, { status, headers: { 'content-type': type } }), 'url', { value: url })
  }

  const verify = () => verifyDeploy({
    siteUrl: SITE,
    pages: PAGES,
    readBuildPage: path => build[path],
    readPublicFile: path => publicFiles[path],
    fetch,
  })

  /** Mette la stessa pagina nella build e sul sito. */
  const writePage = (path: string, content: string) => {
    build[path] = content
    remote[path] = { body: content }
  }

  return { build, remote, publicFiles, requests, faults, writePage, verify }
}

describe('verifyDeploy: pagine', () => {
  it('non segnala niente se le pagine rispondono e il resto è 404', async () => {
    const { verify } = fakeSite()
    expect((await verify()).problems).toEqual([])
  })

  it('segnala una pagina che non risponde', async () => {
    const { remote, verify } = fakeSite()
    delete remote['/news/uno']
    expect((await verify()).problems).toEqual([{ page: '/news/uno', message: 'risponde con stato 404, atteso 200' }])
  })

  it('segnala un indirizzo inesistente che non risponde 404', async () => {
    const { remote, verify } = fakeSite()
    remote['/news/articolo-inesistente'] = { status: 200, body: html('prima.webp') }
    expect((await verify()).problems).toEqual([
      { page: '/news/articolo-inesistente', message: 'risponde con stato 200, atteso 404' },
    ])
  })

  it('segnala una richiesta che fallisce, con il motivo', async () => {
    const result = await verifyDeploy({
      siteUrl: SITE,
      pages: ['/'],
      readBuildPage: () => html('prima.webp'),
      readPublicFile: () => undefined,
      fetch: async () => {
        throw new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND') })
      },
    })
    expect(result.problems).toContainEqual({ page: '/', message: 'richiesta fallita: fetch failed (getaddrinfo ENOTFOUND)' })
  })

  it('segnala una pagina che manca nella build locale', async () => {
    const { build, verify } = fakeSite()
    delete build['/news/uno']
    expect((await verify()).problems).toEqual([
      { page: '/news/uno', message: 'manca nella build locale: esegui di nuovo npm run generate' },
    ])
  })
})

describe('verifyDeploy: pagine che reindirizzano', () => {
  // Netlify reindirizza /news a /news/: va bene finché resta sullo stesso sito.
  it('accetta una pagina che reindirizza allo stesso sito', async () => {
    const { remote, verify } = fakeSite()
    remote['/news/uno']!.url = `${SITE}/news/uno/`
    expect((await verify()).problems).toEqual([])
  })

  it('segnala una pagina che porta su un altro sito', async () => {
    const { remote, verify } = fakeSite()
    remote['/news/uno']!.url = `${PRODUCTION}/news/uno/`
    expect((await verify()).problems).toEqual([
      { page: '/news/uno', message: `porta su un altro sito: ${PRODUCTION}/news/uno/` },
    ])
  })
})

describe('verifyDeploy: confronto con la build locale', () => {
  /** Cambia la pagina di /news/uno sul sito, non nella build. */
  const publish = async (change: (page: string) => string) => {
    const { remote, verify } = fakeSite()
    remote['/news/uno']!.body = change(remote['/news/uno']!.body!)
    return (await verify()).problems
  }

  it('segnala gli indirizzi di src e srcset diversi, con la pagina', async () => {
    const problems = await publish(page => page.replace('w=400', 'w=500').replace(' 400w', ' 500w'))
    expect(problems).toEqual([{
      page: '/news/uno',
      message: [
        'le immagini non coincidono con la build locale',
        `  solo nella build: srcset ${cdn(400, 'uno.webp')} 400w`,
        `  solo sul sito: srcset ${cdn(500, 'uno.webp')} 500w`,
      ].join('\n'),
    }])
  })

  it('segnala un’immagine in meno', async () => {
    const problems = await publish(page => page.replace(/<img .*?">(?=<\/body>)/, ''))
    expect(problems).toHaveLength(1)
    expect(problems[0]?.message).toContain(`solo nella build: src ${cdn(1600, 'uno.webp')}`)
  })

  it('segnala le stesse immagini in un ordine diverso', async () => {
    const { build, remote, verify } = fakeSite()
    const [first, second] = [image('uno.webp', [400]), image('prima.webp', [400])]
    build['/news/uno'] = build['/news/uno']!.replace('</body>', `${first}${second}</body>`)
    remote['/news/uno']!.body = remote['/news/uno']!.body!.replace('</body>', `${second}${first}</body>`)
    expect((await verify()).problems).toEqual([
      { page: '/news/uno', message: 'le immagini non coincidono con la build locale: stessi indirizzi, in un ordine diverso' },
    ])
  })

  it.each(['og:image', 'twitter:image'])('segnala un %s diverso', async (meta) => {
    const problems = await publish(page => page.replace(
      new RegExp(`("${meta}" content=")[^"]*`), `$1${social('prima.webp')}`))
    expect(problems).toEqual([{
      page: '/news/uno',
      message: [
        `${meta} non coincide con la build locale`,
        `  nella build: ${social('uno.webp')}`,
        `  sul sito: ${social('prima.webp')}`,
      ].join('\n'),
    }])
  })

  // Se mancasse in entrambe, le due pagine coinciderebbero.
  it('segnala un meta che manca, anche se manca pure nella build', async () => {
    const { build, remote, verify } = fakeSite()
    const without = (page: string) => page.replace(/<meta name="twitter:image"[^>]*>/, '')
    build['/news/uno'] = without(build['/news/uno']!)
    remote['/news/uno']!.body = without(remote['/news/uno']!.body!)
    expect((await verify()).problems).toEqual([{ page: '/news/uno', message: 'manca il meta twitter:image' }])
  })

  it('segnala un indirizzo con /_ipx/, anche se è così pure nella build', async () => {
    const { build, remote, verify } = fakeSite()
    const withIpx = (page: string) => page.replace('<body>', '<body><img src="/_ipx/f_webp/images/uno.webp">')
    build['/news/uno'] = withIpx(build['/news/uno']!)
    remote['/news/uno']!.body = withIpx(remote['/news/uno']!.body!)
    expect((await verify()).problems).toEqual([
      { page: '/news/uno', message: 'indirizzo con /_ipx/: /_ipx/f_webp/images/uno.webp' },
    ])
  })

  it('segnala /_ipx/ anche fuori dalle immagini, per esempio nei dati della pagina', async () => {
    const problems = await publish(page => page.replace('</body>', '<script>["/_ipx/_/a.png"]</script></body>'))
    expect(problems).toEqual([{ page: '/news/uno', message: 'l’HTML contiene /_ipx/' }])
  })

  // Netlify aggiunge i suoi script alle anteprime; un tag dentro uno script o un commento non è un’immagine.
  it('ignora ciò che è dentro script e commenti', async () => {
    expect(await publish(page => page.replace('</body>', '<!-- <img src="/a.png"> --><script>\'<img src="/b.png">\'</script></body>'))).toEqual([])
  })

  // Un confronto tra due elenchi vuoti riesce sempre.
  it('segnala che nelle pagine non ha trovato nessuna immagine della CDN', async () => {
    const { build, remote, verify } = fakeSite()
    for (const path of PAGES) {
      build[path] = build[path]!.replace(/<img .*?">(?=<\/body>)/, '')
      remote[path]!.body = build[path]
    }
    expect((await verify()).problems).toEqual([
      { page: PAGES.join(', '), message: 'nessun indirizzo /.netlify/images nelle immagini delle pagine' },
    ])
  })
})

const BROWSER_ACCEPT = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'

describe('verifyDeploy: immagini della CDN', () => {
  const address = (width: number, file: string) => `${SITE}${cdn(width, file)}`

  it('chiede ogni indirizzo una volta con Accept */* e una con quello di un browser', async () => {
    const { requests, verify } = fakeSite()
    const result = await verify()
    const asked = requests.filter(request => request.address.includes('fm=webp'))
      .map(request => `${request.accept} ${request.address}`)
    expect(asked.sort()).toEqual([address(400, 'prima.webp'), address(1600, 'prima.webp'),
      address(400, 'uno.webp'), address(1600, 'uno.webp')]
      .flatMap(url => [`*/* ${url}`, `${BROWSER_ACCEPT} ${url}`]).sort())
    expect(result).toMatchObject({ imageAddresses: 4, problems: [] })
  })

  it('segnala una risposta che non è WebP, con l’indirizzo e l’Accept', async () => {
    const { faults, verify } = fakeSite()
    faults.cdn = ({ url, accept }) => accept === '*/*' && url.search.includes('w=400&url=%2Fimages%2Funo')
      ? { type: 'image/png', body: webp(400) }
      : undefined
    expect((await verify()).problems).toEqual([
      { page: '/news/uno', message: `${cdn(400, 'uno.webp')} con Accept */*: risponde image/png, atteso image/webp` },
    ])
  })

  it('non si fida del tipo dichiarato: legge il formato del file', async () => {
    const { faults, verify } = fakeSite()
    faults.cdn = ({ url }) => url.search.includes('w=400&url=%2Fimages%2Funo')
      ? { type: 'image/webp', body: jpeg(400) }
      : undefined
    expect((await verify()).problems[0]?.message).toContain('il file ricevuto è jpg, atteso webp')
  })

  it.each([
    { caso: 'ingrandita oltre il file', requested: 1600, received: 1600, expected: 1300 },
    { caso: 'non ridimensionata', requested: 400, received: 1300, expected: 400 },
  ])('segnala un’immagine $caso', async ({ requested, received, expected }) => {
    const { faults, verify } = fakeSite()
    faults.cdn = ({ url, accept }) => accept === '*/*' && url.search.includes(`w=${requested}&url=%2Fimages%2Funo`)
      ? { type: 'image/webp', body: webp(received) }
      : undefined
    expect((await verify()).problems).toEqual([{
      page: '/news/uno',
      message: `${cdn(requested, 'uno.webp')} con Accept */*: è larga ${received} px, attesi ${expected}`,
    }])
  })

  it('segnala un errore della CDN con tutte le pagine che usano l’immagine', async () => {
    const { faults, writePage, verify } = fakeSite()
    writePage('/news/uno', html('uno.webp').replace('</body>', `${image('prima.webp', [400])}</body>`))
    faults.cdn = ({ url, accept }) => accept === '*/*' && url.search.includes('w=400&url=%2Fimages%2Fprima')
      ? { status: 500 }
      : undefined
    expect((await verify()).problems).toEqual([{
      page: '/, /news/uno',
      message: `${cdn(400, 'prima.webp')} con Accept */*: risponde con stato 500, atteso 200`,
    }])
  })

  it('segnala una risposta che non è un’immagine', async () => {
    const { faults, verify } = fakeSite()
    faults.cdn = ({ url }) => url.search.includes('w=400&url=%2Fimages%2Funo')
      ? { type: 'image/webp', body: 'errore' }
      : undefined
    expect((await verify()).problems[0]?.message).toContain('la risposta non è un’immagine riconosciuta')
  })

  it('segnala un’immagine il cui file non è in public/', async () => {
    const { publicFiles, faults, verify } = fakeSite()
    delete publicFiles['/images/uno.webp']
    faults.cdn = ({ url }) => url.search.includes('uno.webp')
      ? { type: url.search.includes('fm=jpg') ? 'image/jpeg' : 'image/webp', body: url.search.includes('fm=jpg') ? jpeg(1200) : webp(400) }
      : undefined
    // In ogni tag `src` (1600) viene prima delle voci di `srcset`.
    expect((await verify()).problems).toEqual([1600, 400].map(width => ({
      page: '/news/uno',
      message: `${cdn(width, 'uno.webp')}: il file public/images/uno.webp non c’è`,
    })))
  })

  // Il file è una foto salvata di lato, con l'orientamento EXIF: si vede larga 8 px.
  it('di una foto ruotata conta la larghezza che si vede', async () => {
    const { publicFiles, faults, verify } = fakeSite()
    publicFiles['/images/uno.webp'] = readFileSync(new URL('../content/fixtures/public/images/ruotata-larga-8.jpg', import.meta.url))
    faults.cdn = ({ url }) => url.search.includes('uno.webp') && url.search.includes('fm=webp')
      ? { type: 'image/webp', body: webp(8) }
      : undefined
    const messages = (await verify()).problems.map(problem => problem.message)
    expect(messages.filter(message => message.includes('fm=webp'))).toEqual([])
  })
})

describe('verifyDeploy: immagini per i social', () => {
  const rewritten = (file: string) => social(file).replace(PRODUCTION, SITE)

  // Sull'anteprima i meta indicano la produzione, che ha il sito di un altro commit.
  it('le chiede al sito verificato, con lo User-Agent di Facebook e di Twitter', async () => {
    const { requests, verify } = fakeSite()
    const result = await verify()
    const asked = requests.filter(request => request.address.includes('fm=jpg'))
      .map(request => `${request.userAgent} ${request.address}`)
    expect(asked.sort()).toEqual(['prima.webp', 'uno.webp']
      .flatMap(file => [`facebookexternalhit/1.1 ${rewritten(file)}`, `Twitterbot/1.0 ${rewritten(file)}`]).sort())
    expect(requests.every(request => request.address.startsWith(SITE))).toBe(true)
    expect(result).toMatchObject({ socialImages: 2, problems: [] })
  })

  it('segnala un’immagine che non è JPEG, con lo User-Agent', async () => {
    const { faults, verify } = fakeSite()
    faults.cdn = ({ url, userAgent }) => userAgent === 'Twitterbot/1.0' && url.search.includes('fm=jpg') && url.search.includes('uno')
      ? { type: 'image/webp', body: webp(1200) }
      : undefined
    expect((await verify()).problems).toEqual([
      { page: '/news/uno', message: `${social('uno.webp')} con User-Agent Twitterbot/1.0: risponde image/webp, atteso image/jpeg` },
    ])
  })

  it('segnala un JPEG non largo 1200 px, e dice se è il file a essere più stretto', async () => {
    const { publicFiles, verify } = fakeSite()
    publicFiles['/images/uno.webp'] = webp(800)
    const messages = (await verify()).problems.map(problem => problem.message)
    expect(messages).toContain(`${social('uno.webp')} con User-Agent facebookexternalhit/1.1: è larga 800 px, attesi 1200`
      + ' (il file in public/ è largo 800 px e la CDN non ingrandisce)')
  })

  it('segnala un indirizzo per i social che non è assoluto', async () => {
    const { writePage, verify } = fakeSite()
    const relative = cdn(1200, 'uno.webp').replace('fm=webp', 'fm=jpg')
    writePage('/news/uno', html('uno.webp').replaceAll(social('uno.webp'), relative))
    expect((await verify()).problems).toEqual([
      { page: '/news/uno', message: `l’immagine per i social non ha un indirizzo assoluto: ${relative}` },
    ])
  })
})
