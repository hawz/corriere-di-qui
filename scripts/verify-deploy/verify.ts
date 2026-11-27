// La verifica di un sito pubblicato. File e rete arrivano da fuori: così si prova senza rete (tests/unit/).
import { comparePages, ipxProblems } from './compare.ts'
import { type PageImages, readImages } from './html.ts'
import { type ExpectedImage, readImageFile, responseProblem } from './images.ts'

/** Indirizzi che il sito non ha: devono rispondere 404, anche tra gli Articoli. */
const MISSING_PAGES = ['/indirizzo-inesistente', '/news/articolo-inesistente']

// Le immagini delle pagine si chiedono anche con `Accept: */*`: senza `fm=webp` la CDN darebbe il PNG.
const ACCEPTS = [
  { label: 'con Accept */*', accept: '*/*' },
  { label: 'con l’Accept di un browser', accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' },
]
/** Gli User-Agent con cui Facebook e Twitter chiedono le immagini delle anteprime. */
const SOCIAL_AGENTS = ['facebookexternalhit/1.1', 'Twitterbot/1.0']
const SOCIAL_WIDTH = 1200

/** Quante immagini si controllano insieme. */
const CONCURRENCY = 6
const TIMEOUT_MS = 30_000

export interface Options {
  /** L’indirizzo del sito da verificare, senza percorso: un’anteprima di Netlify o la produzione. */
  siteUrl: string
  /** I percorsi delle pagine da verificare. */
  pages: string[]
  /** L’HTML di una pagina nella build locale, dello stesso commit del sito. */
  readBuildPage: (path: string) => string | undefined
  /** Un file di public/, dal percorso con cui il sito lo chiede, come /images/foto.webp. */
  readPublicFile: (path: string) => Uint8Array | undefined
  fetch: typeof fetch
}

export interface Problem {
  /** La pagina, o le pagine, in cui si presenta. */
  page: string
  message: string
}

export interface Result {
  problems: Problem[]
  /** Quanti indirizzi diversi della CDN hanno le immagini delle pagine. */
  imageAddresses: number
  /** Quante immagini diverse per i social indicano le pagine. */
  socialImages: number
}

type Answer = { response: Response, body: Uint8Array } | { failure: string }

export async function verifyDeploy({ siteUrl, pages, readBuildPage, readPublicFile, fetch }: Options): Promise<Result> {
  const origin = new URL(siteUrl).origin
  const problems: Problem[] = []

  /** La risposta con il suo corpo; se la richiesta fallisce, il motivo. */
  async function request(address: string | URL, headers: Record<string, string> = {}): Promise<Answer> {
    try {
      const response = await fetch(new URL(address, origin), { headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
      return { response, body: new Uint8Array(await response.arrayBuffer()) }
    }
    catch (error) {
      return { failure: `richiesta fallita: ${reason(error)}` }
    }
  }

  /** Le immagini di ogni pagina letta dal sito. */
  const published = new Map<string, PageImages>()

  async function checkPage(page: string): Promise<string[]> {
    const local = readBuildPage(page)
    const found = local === undefined ? ['manca nella build locale: esegui di nuovo npm run generate'] : []
    const result = await request(page)
    if ('failure' in result) return [...found, result.failure]
    const { response, body } = result
    // Netlify reindirizza /news a /news/: va bene. Un altro sito no: si verificherebbe quello.
    if (new URL(response.url).origin !== origin) return [...found, `porta su un altro sito: ${response.url}`]
    if (response.status !== 200) return [...found, `risponde con stato ${response.status}, atteso 200`]
    const html = new TextDecoder().decode(body)
    const images = readImages(html)
    published.set(page, images)
    return [...found, ...ipxProblems(html, images), ...(local === undefined ? [] : comparePages(readImages(local), images))]
  }

  async function checkMissingPage(page: string): Promise<string[]> {
    const result = await request(page)
    if ('failure' in result) return [result.failure]
    return result.response.status === 404 ? [] : [`risponde con stato ${result.response.status}, atteso 404`]
  }

  /** Chiede un'immagine con certe intestazioni e dice che cosa non va nella risposta. */
  async function imageProblem(address: string | URL, headers: Record<string, string>, expected: ExpectedImage) {
    const result = await request(address, headers)
    return 'failure' in result ? result.failure : responseProblem(result.response, result.body, expected)
  }

  /** La larghezza del file di public/ che un indirizzo della CDN chiede con `url`. */
  function originalWidth(source: string): number | undefined {
    const file = readPublicFile(source)
    return file && readImageFile(file)?.width
  }

  async function checkPageImage(address: string): Promise<string[]> {
    const query = new URL(address, origin).searchParams
    const source = query.get('url') ?? ''
    const available = originalWidth(source)
    if (!available) return [`${address}: il file public${source} non c’è`]
    // La CDN non ingrandisce.
    const width = Math.min(Number(query.get('w') ?? available), available)
    const found: string[] = []
    for (const { label, accept } of ACCEPTS) {
      const problem = await imageProblem(address, { Accept: accept }, { contentType: 'image/webp', format: 'webp', width })
      if (problem) found.push(`${address} ${label}: ${problem}`)
    }
    return found
  }

  async function checkSocialImage(address: string): Promise<string[]> {
    if (!/^https?:\/\//.test(address)) return [`l’immagine per i social non ha un indirizzo assoluto: ${address}`]
    const declared = new URL(address)
    // Sull'anteprima i meta indicano la produzione: l'immagine si chiede al sito che si verifica.
    const target = new URL(origin)
    target.pathname = declared.pathname
    target.search = declared.search
    const available = originalWidth(declared.searchParams.get('url') ?? '')
    const hint = available && available < SOCIAL_WIDTH
      ? ` (il file in public/ è largo ${available} px e la CDN non ingrandisce)`
      : ''
    const found: string[] = []
    for (const agent of SOCIAL_AGENTS) {
      const problem = await imageProblem(target, { 'User-Agent': agent, 'Accept': '*/*' },
        { contentType: 'image/jpeg', format: 'jpg', width: SOCIAL_WIDTH })
      if (problem) found.push(`${address} con User-Agent ${agent}: ${problem}${hint}`)
    }
    return found
  }

  /** Controlla gli elementi alcuni per volta; i problemi restano nell'ordine degli elementi. */
  async function checkAll<T>(items: T[], pageOf: (item: T) => string, check: (item: T) => Promise<string[]>) {
    const found = await mapInBatches(items, async item =>
      (await check(item)).map(message => ({ page: pageOf(item), message })))
    problems.push(...found.flat())
  }

  // Le pagine si leggono una per volta: così `published` e i problemi seguono il loro ordine.
  for (const page of pages) {
    problems.push(...(await checkPage(page)).map(message => ({ page, message })))
  }

  const read = [...published]
  const imageAddresses = groupByAddress(read.flatMap(([page, { images }]) => images
    .filter(({ address }) => isCdnAddress(address, origin))
    .map(({ address }) => ({ page, address }))))
  const socialImages = groupByAddress(read.flatMap(([page, { metas }]) =>
    Object.values(metas).flatMap(address => address ? [{ page, address }] : [])))

  // Un confronto tra due elenchi vuoti riesce sempre: così si nota se la lettura delle pagine non trova più niente.
  if (read.length && !imageAddresses.length) {
    problems.push({
      page: read.map(([page]) => page).join(', '),
      message: 'nessun indirizzo /.netlify/images nelle immagini delle pagine',
    })
  }

  await checkAll(MISSING_PAGES, page => page, checkMissingPage)
  await checkAll(imageAddresses, ([, pagesOfImage]) => pagesOfImage, ([address]) => checkPageImage(address))
  await checkAll(socialImages, ([, pagesOfImage]) => pagesOfImage, ([address]) => checkSocialImage(address))

  return { problems, imageAddresses: imageAddresses.length, socialImages: socialImages.length }
}

/** Ogni indirizzo una volta sola, con le pagine che lo usano. */
function groupByAddress(uses: { page: string, address: string }[]): [address: string, pages: string][] {
  const pagesOf = new Map<string, Set<string>>()
  for (const { page, address } of uses) pagesOf.set(address, (pagesOf.get(address) ?? new Set()).add(page))
  return [...pagesOf].map(([address, pages]) => [address, [...pages].join(', ')])
}

async function mapInBatches<T, R>(items: T[], map: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  for (let start = 0; start < items.length; start += CONCURRENCY) {
    results.push(...await Promise.all(items.slice(start, start + CONCURRENCY).map(map)))
  }
  return results
}

const isCdnAddress = (address: string, origin: string) => new URL(address, origin).pathname === '/.netlify/images'

// `fetch` dice solo "fetch failed": il motivo vero è nella causa.
function reason(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  return error.cause instanceof Error ? `${error.message} (${error.cause.message})` : error.message
}
