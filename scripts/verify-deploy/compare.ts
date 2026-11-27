// Il confronto tra una pagina del sito e la stessa pagina della build locale.
import { type PageImage, type PageImages, SOCIAL_METAS } from './html.ts'

/** Quanti indirizzi diversi si elencano, per non riempire lo schermo quando è diversa tutta la pagina. */
const MAX_LISTED = 3

const line = ({ attribute, address, descriptor }: PageImage) =>
  [attribute, address, descriptor].filter(Boolean).join(' ')

/** Le differenze e i meta mancanti, un messaggio per elemento. */
export function comparePages(local: PageImages, remote: PageImages): string[] {
  const problems: string[] = []
  const expected = local.images.map(line)
  const actual = remote.images.map(line)
  if (expected.join('\n') !== actual.join('\n')) {
    const differences = [
      ...list('solo nella build', without(expected, actual)),
      ...list('solo sul sito', without(actual, expected)),
    ]
    problems.push(differences.length
      ? ['le immagini non coincidono con la build locale', ...differences].join('\n')
      : 'le immagini non coincidono con la build locale: stessi indirizzi, in un ordine diverso')
  }
  for (const meta of SOCIAL_METAS) {
    const [built, published] = [local.metas[meta], remote.metas[meta]]
    if (!built && !published) problems.push(`manca il meta ${meta}`)
    else if (built !== published) {
      problems.push([
        `${meta} non coincide con la build locale`,
        `  nella build: ${built ?? 'manca'}`,
        `  sul sito: ${published ?? 'manca'}`,
      ].join('\n'))
    }
  }
  return problems
}

/** Gli indirizzi con /_ipx/, il ripiego di @nuxt/image che sul sito pubblicato non esiste. */
export function ipxProblems(html: string, { images, metas }: PageImages): string[] {
  const addresses = [...images.map(image => image.address), ...Object.values(metas)]
  const found = [...new Set(addresses.filter(address => address?.includes('/_ipx/')))]
  if (found.length) return found.map(address => `indirizzo con /_ipx/: ${address}`)
  return html.includes('/_ipx/') ? ['l’HTML contiene /_ipx/'] : []
}

/** Gli elementi di `lines` che non hanno un corrispondente in `others`, contando i doppioni. */
function without(lines: string[], others: string[]): string[] {
  const left = [...others]
  return lines.filter((item) => {
    const index = left.indexOf(item)
    if (index === -1) return true
    left.splice(index, 1)
    return false
  })
}

function list(title: string, lines: string[]): string[] {
  const listed = lines.slice(0, MAX_LISTED).map(item => `  ${title}: ${item}`)
  const others = lines.length - MAX_LISTED
  return others > 0 ? [...listed, `  ${title}: altri ${others}`] : listed
}
