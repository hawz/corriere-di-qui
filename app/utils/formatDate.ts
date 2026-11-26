/**
 * Una data scritta in italiano, come «31 marzo 2026»; stringa vuota se manca.
 *
 * Una stringa `AAAA-MM-GG` è un giorno del calendario, quindi esce uguale in ogni fuso.
 * Un `Date` è un momento, e si scrive nel fuso di chi legge.
 */
export function formatDate(date: string | Date | null | undefined, options: { weekday?: 'long' } = {}): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('it-IT', {
    ...options,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: typeof date === 'string' ? 'UTC' : undefined,
  })
}
