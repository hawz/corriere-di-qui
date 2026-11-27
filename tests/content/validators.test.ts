import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { imageProblems, validateArticle, validateBodyImages } from './validators'

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

describe('imageProblems', () => {
  const { publicDir } = riferimenti
  const AMMESSI = 'sono ammessi JPEG, PNG e WebP'

  it.each(['foto.jpg', 'foto.png', 'foto.webp', 'larga-2000.png', 'ruotata-larga-8.jpg'])('accetta %s', (file) => {
    expect(imageProblems(`/images/${file}`, publicDir)).toEqual([])
  })

  // Il formato si legge dal contenuto: il nome del file non conta.
  it.each([
    ['heic-rinominato.jpg', 'è un file HEIC'],
    ['foto.gif', 'è un file GIF'],
    ['non-una-foto.jpg', 'non è un’immagine riconosciuta'],
  ])('non accetta %s', (file, problema) => {
    expect(imageProblems(`/images/${file}`, publicDir))
      .toEqual([`il file public/images/${file} ${problema}: ${AMMESSI}`])
  })

  // In una foto ruotata dall’orientamento EXIF conta la larghezza che si vede.
  it.each(['larga-2001.png', 'ruotata-larga-2001.jpg'])('non accetta %s, più larga di 2000 px', (file) => {
    expect(imageProblems(`/images/${file}`, publicDir))
      .toEqual([`il file public/images/${file} è largo 2001 px: il massimo è 2000 px`])
  })

  describe('con il peso', () => {
    let cartella: string

    // I file pesanti si creano qui, per non tenerli nel repo: un’immagine vera seguita da zeri.
    const scrivi = (file: string, fixture: string, bytes: number) => {
      const immagine = readFileSync(join(publicDir, 'images', fixture))
      writeFileSync(join(cartella, 'images', file), Buffer.concat([immagine, Buffer.alloc(bytes - immagine.length)]))
    }

    beforeAll(() => {
      cartella = mkdtempSync(join(tmpdir(), 'immagini-'))
      mkdirSync(join(cartella, 'images'))
      scrivi('al-limite.png', 'foto.png', 1_000_000)
      scrivi('pesante.png', 'foto.png', 1_000_001)
      scrivi('larga-e-pesante.png', 'larga-2001.png', 2_500_000)
    })

    afterAll(() => rmSync(cartella, { recursive: true, force: true }))

    it('accetta un file di 1 MB esatto', () => {
      expect(imageProblems('/images/al-limite.png', cartella)).toEqual([])
    })

    it('non accetta un byte in più', () => {
      expect(imageProblems('/images/pesante.png', cartella))
        .toEqual(['il file public/images/pesante.png pesa 1001 KB: il massimo è 1000 KB'])
    })

    it('elenca insieme tutti i problemi di un’immagine', () => {
      expect(imageProblems('/images/larga-e-pesante.png', cartella)).toEqual([
        'il file public/images/larga-e-pesante.png pesa 2500 KB: il massimo è 1000 KB',
        'il file public/images/larga-e-pesante.png è largo 2001 px: il massimo è 2000 px',
      ])
    })
  })

  it('arriva nei problemi dell’Articolo', () => {
    expect(validateArticle({ ...complete, image: '/images/foto.gif' }, riferimenti))
      .toEqual([`image: il file public/images/foto.gif è un file GIF: ${AMMESSI}`])
  })
})

describe('validateBodyImages', () => {
  const { publicDir } = riferimenti
  const problemi = (testo: string) => validateBodyImages(testo, publicDir)
  const largaDi = (indirizzo: string) =>
    `testo, immagine ${indirizzo}: il file public${indirizzo} è largo 2001 px: il massimo è 2000 px`

  it('accetta un testo senza immagini o con immagini entro i limiti', async () => {
    expect(await problemi('Solo parole, e un [link](https://example.com/foto.png).')).toEqual([])
    expect(await problemi('![Una foto](/images/foto.jpg "Titolo")')).toEqual([])
  })

  // Ogni forma che il sito trasforma in un’immagine va controllata.
  it.each([
    ['in Markdown', 'Prima. ![Una foto](/images/larga-2001.png) Dopo.'],
    ['per riferimento', '![Una foto][foto]\n\n[foto]: /images/larga-2001.png'],
    ['in una nota a piè di pagina', 'Testo[^1]\n\n[^1]: ![Una foto](/images/larga-2001.png)'],
    ['in un elenco, dentro un link', '- [![Una foto](/images/larga-2001.png)](/news)'],
    ['in HTML', '<img alt="Una foto" src="/images/larga-2001.png">'],
    ['in HTML, con un > in un attributo', '<img alt="a > b" src="/images/larga-2001.png">'],
    ['in una srcset', '<img src="/images/foto.jpg" srcset="/images/larga-2001.png 2x">'],
    ['in un <picture>', '<picture><source srcset="/images/larga-2001.png"><img src="/images/foto.jpg"></picture>'],
    ['con la sintassi MDC in una riga', 'Ecco :img{src="/images/larga-2001.png"} qui.'],
    ['con un blocco MDC', '::prose-img\n---\nsrc: /images/larga-2001.png\n---\n::'],
    ['con <NuxtImg>', '<NuxtImg src="/images/larga-2001.png"></NuxtImg>'],
  ])('controlla un’immagine %s', async (_forma, testo) => {
    expect(await problemi(testo)).toEqual([largaDi('/images/larga-2001.png')])
  })

  // La CDN di Netlify rifiuta un indirizzo esterno: sul sito l’immagine non si vedrebbe.
  it('non accetta un’immagine con un indirizzo esterno', async () => {
    expect(await problemi('![Una foto](https://example.com/foto.png)')).toEqual([
      'testo, immagine https://example.com/foto.png: deve essere un percorso che inizia con /, come /images/foto.png',
    ])
  })

  it('elenca i problemi di tutte le immagini', async () => {
    expect(await problemi('![a](/images/larga-2001.png)\n\n![b](/images/non-esiste.png)')).toEqual([
      largaDi('/images/larga-2001.png'),
      'testo, immagine /images/non-esiste.png: il file public/images/non-esiste.png non esiste',
    ])
  })

  it.each([
    ['mostrata come codice', '```md\n![a](https://example.com/a.png)\n```\n\nOppure `<img src="/x.png">`.'],
    ['dentro un commento', '<!-- <img src="https://example.com/a.png"> -->'],
  ])('ignora un’immagine %s', async (_forma, testo) => {
    expect(await problemi(testo)).toEqual([])
  })

  it('non scambia per un’immagine la sorgente di un video', async () => {
    expect(await problemi('<video controls><source src="/video/prova.mp4"></video>')).toEqual([])
  })
})
