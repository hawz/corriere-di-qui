import { describe, expect, it } from 'vitest'
import { componiHome } from '../../app/utils/home'

// Gli Articoli arrivano dal più recente: qui bastano le loro iniziali.
describe('componiHome', () => {
  it('quando ce ne sono abbastanza non ripete nessun Articolo', () => {
    expect(componiHome(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']))
      .toEqual({ lead: 'a', sidebar: ['b', 'c', 'd'], grid: ['e', 'f', 'g'] })
  })

  it('tiene piena la griglia, prima con gli Articoli non ancora mostrati', () => {
    expect(componiHome(['a', 'b', 'c', 'd', 'e', 'f']))
      .toEqual({ lead: 'a', sidebar: ['b', 'c', 'd'], grid: ['e', 'f', 'b'] })
  })

  it('funziona anche senza Articoli', () => {
    expect(componiHome([])).toEqual({ lead: null, sidebar: [], grid: [] })
  })
})
