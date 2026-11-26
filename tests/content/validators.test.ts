import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateArticle } from './validators'

// Una public/ finta: i test non dipendono dalle immagini vere del giornale.
const PUBLIC = fileURLToPath(new URL('./fixtures/public', import.meta.url))

const complete = {
  title: 'Titolo',
  description: 'Descrizione',
  date: '2026-03-20',
  image: '/images/foto.png',
}

describe('validateArticle', () => {
  it('accetta un Articolo con tutti i campi richiesti', () => {
    expect(validateArticle(complete, PUBLIC)).toEqual([])
  })

  it('segnala un Articolo senza immagine', () => {
    expect(validateArticle({ ...complete, image: undefined }, PUBLIC)).toEqual(['image: campo mancante'])
  })

  it('segnala un Articolo con un’immagine inesistente', () => {
    expect(validateArticle({ ...complete, image: '/images/non-esiste.png' }, PUBLIC))
      .toEqual(['image: il file public/images/non-esiste.png non esiste'])
  })

  it('non accetta una cartella al posto dell’immagine', () => {
    expect(validateArticle({ ...complete, image: '/images' }, PUBLIC))
      .toEqual(['image: il file public/images non esiste'])
  })

  it('vuole un percorso dentro public/ che inizi con /', () => {
    expect(validateArticle({ ...complete, image: 'images/foto.png' }, PUBLIC))
      .toEqual(['image: deve essere un percorso che inizia con /, come /images/foto.png'])
  })

  it('non accetta un file fuori da public/', () => {
    expect(validateArticle({ ...complete, image: '/../fuori.png' }, PUBLIC))
      .toEqual(['image: il percorso /../fuori.png esce da public/'])
  })
})
