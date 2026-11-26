/**
 * Le Sezioni del giornale, nell'ordine in cui compaiono in menu, footer e filtro.
 * Le classi del colore sono scritte per intero: Tailwind genera solo quelle che trova nei file.
 */
export const SEZIONI = [
  { slug: 'attualita', label: 'Attualità', textClass: 'text-newsred', borderClass: 'border-newsred' },
  { slug: 'tech', label: 'Tech', textClass: 'text-newsblue', borderClass: 'border-newsblue' },
  { slug: 'satira', label: 'Satira', textClass: 'text-newsamber', borderClass: 'border-newsamber' },
  { slug: 'opinioni', label: 'Opinioni', textClass: 'text-newsgreen', borderClass: 'border-newsgreen' },
]

/** La classe del colore di una Sezione; grigio se non è nell'elenco. */
export function sezioneTextClass(slug: string | undefined): string {
  return SEZIONI.find(sezione => sezione.slug === slug)?.textClass ?? 'text-muted'
}
