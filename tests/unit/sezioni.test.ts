import { describe, expect, it } from 'vitest'
import { sezioniConArticoli } from '../../app/utils/sezioni'

const slugs = (articoli: { sezione: string }[]) => sezioniConArticoli(articoli).map(sezione => sezione.slug)

describe('sezioniConArticoli', () => {
  it('tiene solo le Sezioni con almeno un Articolo, nell’ordine dell’elenco', () => {
    expect(slugs([{ sezione: 'tech' }, { sezione: 'attualita' }, { sezione: 'tech' }])).toEqual(['attualita', 'tech'])
  })

  it('fa comparire una Sezione con il suo primo Articolo', () => {
    expect(slugs([{ sezione: 'opinioni' }])).toEqual(['opinioni'])
  })

  it('senza Articoli non propone Sezioni', () => {
    expect(slugs([])).toEqual([])
  })
})
