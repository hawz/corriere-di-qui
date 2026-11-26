/** Quanti Articoli diversi trovano posto sulla home. */
export const ARTICOLI_IN_HOME = 7

/**
 * Come si dispongono sulla home gli Articoli, ricevuti dal più recente:
 * uno in apertura, tre nella colonna a fianco e tre nella griglia.
 */
export function componiHome<T>(articoli: T[]) {
  const [lead = null, ...others] = articoli
  const sidebar = others.slice(0, 3)
  // La griglia mostra prima gli Articoli non ancora visti; se non bastano, si completa con quelli della colonna.
  const grid = [...others.slice(3), ...sidebar].slice(0, 3)
  return { lead, sidebar, grid }
}
