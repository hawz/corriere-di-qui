import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatDate } from '../../app/utils/formatDate'

describe('formatDate', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('scrive in italiano una data valida', () => {
    expect(formatDate('2026-03-31')).toBe('31 marzo 2026')
  })

  it.each([undefined, null, ''])('non scrive nulla se la data manca (%j)', (missing) => {
    expect(formatDate(missing)).toBe('')
  })

  // La data di un Articolo è un giorno del calendario: non deve cambiare con il fuso di chi legge.
  it.each(['America/New_York', 'Pacific/Auckland'])('scrive lo stesso giorno con il fuso %s', (zone) => {
    vi.stubEnv('TZ', zone)
    expect(formatDate('2026-03-31')).toBe('31 marzo 2026')
  })

  // La testata mostra l'oggi di chi legge, quindi un momento (Date) si scrive nel suo fuso.
  it('scrive anche il giorno della settimana, nel fuso di chi legge', () => {
    vi.stubEnv('TZ', 'Pacific/Auckland')
    // In Nuova Zelanda è già il 26 quando in UTC è ancora il 25.
    expect(formatDate(new Date('2026-11-25T20:00:00Z'), { weekday: 'long' })).toBe('giovedì 26 novembre 2026')
  })
})
