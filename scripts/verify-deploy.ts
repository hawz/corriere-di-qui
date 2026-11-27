// npm run verify:deploy -- <url>
// Verifica un sito pubblicato (un'anteprima di Netlify o la produzione) confrontandolo con la build locale:
// prima va eseguito `npm run generate` sullo stesso commit del sito. La resa delle immagini si guarda a occhio.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyDeploy } from './verify-deploy/verify.ts'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const BUILD = join(ROOT, '.output/public')
const PUBLIC = join(ROOT, 'public')

/** Si ferma subito, con un messaggio: manca qualcosa per cominciare. */
function stop(message: string): never {
  console.error(message)
  process.exit(2)
}

/** L'indirizzo del sito da verificare. Un percorso verrebbe ignorato, quindi si rifiuta. */
function readSiteUrl(argument = ''): string {
  const url = URL.canParse(argument) ? new URL(argument) : undefined
  if (!url || !/^https?:$/.test(url.protocol) || url.pathname !== '/' || url.search || url.hash) {
    stop('Uso: npm run verify:deploy -- <url>, per esempio https://corriere-di-qui.netlify.app (senza percorso)')
  }
  return url.origin
}

/** Il contenuto di un file dentro `directory`, se c'è. */
function readInside(directory: string, path: string): Buffer | undefined {
  const file = join(directory, path)
  if (relative(directory, file).split(sep)[0] === '..') return undefined
  return statSync(file, { throwIfNoEntry: false })?.isFile() ? readFileSync(file) : undefined
}

const siteUrl = readSiteUrl(process.argv[2])
if (!existsSync(join(BUILD, 'index.html'))) stop('Manca la build locale in .output/public: esegui prima npm run generate')

const articles = readdirSync(join(ROOT, 'content/news'))
  .filter(file => file.endsWith('.md'))
  .sort()
  .map(file => `/news/${file.slice(0, -'.md'.length)}`)
const pages = ['/', '/news', '/about', ...articles]

console.log(`Verifico ${siteUrl} con la build locale in .output/public\n`)

const { problems, imageAddresses, socialImages } = await verifyDeploy({
  siteUrl,
  pages,
  readBuildPage: path => readInside(BUILD, join(path, 'index.html'))?.toString('utf-8'),
  readPublicFile: path => readInside(PUBLIC, path),
  fetch,
})

for (const { page, message } of problems) console.error(`✗ ${page}: ${message}`)

console.log(`${problems.length ? '\n' : ''}Controllate ${pages.length} pagine, ${imageAddresses} indirizzi di immagini e ${socialImages} immagini per i social.`)
if (problems.length) {
  console.error(`Problemi: ${problems.length}.`)
  // Senza `process.exit`: l'output ancora in coda verrebbe tagliato.
  process.exitCode = 1
}
else {
  console.log('Nessun problema. La resa delle immagini va comunque guardata a occhio.')
}
