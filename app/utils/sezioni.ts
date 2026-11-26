/**
 * Le Sezioni del giornale, nell'ordine in cui compaiono in menu, footer e filtro.
 * Lì si vedono solo quelle con almeno un Articolo.
 * Le classi del colore sono scritte per intero: Tailwind genera solo quelle che trova nei file.
 */
export const SEZIONI = [
  { slug: 'attualita', label: 'Attualità', textClass: 'text-newsred', borderClass: 'border-newsred' },
  { slug: 'tech', label: 'Tech', textClass: 'text-newsblue', borderClass: 'border-newsblue' },
  { slug: 'opinioni', label: 'Opinioni', textClass: 'text-newsgreen', borderClass: 'border-newsgreen' },
]

/** Le Sezioni che hanno almeno un Articolo, nell'ordine dell'elenco. */
export function sezioniConArticoli(articoli: { sezione?: string }[]) {
  return SEZIONI.filter(sezione => articoli.some(articolo => articolo.sezione === sezione.slug))
}

/** Il nome di una Sezione per chi legge; vuoto se non è nell'elenco. */
export function sezioneLabel(slug: string | undefined): string {
  return SEZIONI.find(sezione => sezione.slug === slug)?.label ?? ''
}

/** La classe del colore di una Sezione; grigio se non è nell'elenco. */
export function sezioneTextClass(slug: string | undefined): string {
  return SEZIONI.find(sezione => sezione.slug === slug)?.textClass ?? 'text-muted'
}
