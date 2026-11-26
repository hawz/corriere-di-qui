import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateArticle } from './validators'

// Una public/ e due elenchi finti: i test non dipendono da immagini, Sezioni e Firme vere del giornale.
const riferimenti = {
  publicDir: fileURLToPath(new URL('./fixtures/public', import.meta.url)),
  sezioni: ['cronaca', 'tech'],
  firme: ['Ada Prova', 'Ugo Esempio'],
}

const complete = {
  title: 'Titolo',
  description: 'Descrizione',
  date: '2026-03-20',
  image: '/images/foto.png',
  sezione: 'tech',
  firma: 'Ada Prova',
}

describe('validateArticle', () => {
  it('accetta un Articolo con tutti i campi richiesti', () => {
    expect(validateArticle(complete, riferimenti)).toEqual([])
  })

  it('segnala ogni campo obbligatorio che manca', () => {
    expect(validateArticle({}, riferimenti)).toEqual([
      'title: campo mancante',
      'description: campo mancante',
      'date: campo mancante',
      'image: campo mancante',
      'sezione: campo mancante',
      'firma: campo mancante',
    ])
  })

  it.each(['20/03/2026', '2026-3-20', '2026-02-30', '2026-13-01', '2026-03-20T10:00:00Z'])('non accetta la data %s', (date) => {
    expect(validateArticle({ ...complete, date }, riferimenti))
      .toEqual([`date: "${date}" non è una data nel formato AAAA-MM-GG`])
  })

  // Senza virgolette lo YAML legge un momento nel tempo, non il testo scritto.
  it('vuole la data tra virgolette', () => {
    expect(validateArticle({ ...complete, date: new Date('2026-03-20') }, riferimenti))
      .toEqual(['date: va scritta tra virgolette, come "2026-03-20"'])
  })

  it('non accetta una Sezione fuori dall’elenco', () => {
    expect(validateArticle({ ...complete, sezione: 'tecnologia' }, riferimenti))
      .toEqual(['sezione: "tecnologia" non è nell’elenco delle Sezioni (cronaca, tech)'])
  })

  it('non accetta una Firma fuori dalla Redazione', () => {
    expect(validateArticle({ ...complete, firma: 'Ada Provetta' }, riferimenti))
      .toEqual(['firma: "Ada Provetta" non fa parte della Redazione in content/pages/about.yml (Ada Prova, Ugo Esempio)'])
  })

  // Un Articolo ha una sola Sezione e una sola Firma: una lista di un elemento non vale come testo.
  it.each(['title', 'description', 'image', 'sezione', 'firma'] as const)('vuole un testo nel campo %s', (field) => {
    expect(validateArticle({ ...complete, [field]: [complete[field]] }, riferimenti))
      .toEqual([`${field}: deve essere un testo`])
  })

  it('non accetta una lista al posto della data', () => {
    expect(validateArticle({ ...complete, date: ['2026-03-20'] }, riferimenti))
      .toEqual(['date: "["2026-03-20"]" non è una data nel formato AAAA-MM-GG'])
  })

  it('elenca insieme tutti i problemi di un Articolo', () => {
    expect(validateArticle({ ...complete, title: '', sezione: 'sport', firma: 'Nessuno' }, riferimenti))
      .toHaveLength(3)
  })

  it('segnala un Articolo senza immagine', () => {
    expect(validateArticle({ ...complete, image: undefined }, riferimenti)).toEqual(['image: campo mancante'])
  })

  it('segnala un Articolo con un’immagine inesistente', () => {
    expect(validateArticle({ ...complete, image: '/images/non-esiste.png' }, riferimenti))
      .toEqual(['image: il file public/images/non-esiste.png non esiste'])
  })

  it('non accetta una cartella al posto dell’immagine', () => {
    expect(validateArticle({ ...complete, image: '/images' }, riferimenti))
      .toEqual(['image: il file public/images non esiste'])
  })

  it('vuole un percorso dentro public/ che inizi con /', () => {
    expect(validateArticle({ ...complete, image: 'images/foto.png' }, riferimenti))
      .toEqual(['image: deve essere un percorso che inizia con /, come /images/foto.png'])
  })

  it('non accetta un file fuori da public/', () => {
    expect(validateArticle({ ...complete, image: '/../fuori.png' }, riferimenti))
      .toEqual(['image: il percorso /../fuori.png esce da public/'])
  })
})
