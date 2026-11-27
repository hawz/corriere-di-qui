// Che cosa deve arrivare quando si chiede un'immagine al sito.
import { imageMeta } from 'image-meta'

export interface ExpectedImage {
  contentType: string
  /** Il formato che si legge nel file, come lo chiama image-meta. */
  format: string
  width: number
}

/** Formato e larghezza dal contenuto del file; `undefined` se non è un'immagine riconosciuta. */
export function readImageFile(file: Uint8Array): { format?: string, width: number } | undefined {
  try {
    const { type, width = 0, height = 0, orientation = 1 } = imageMeta(file)
    // Con l'orientamento EXIF da 5 a 8 la foto si vede ruotata di 90°.
    return { format: type, width: orientation >= 5 ? height : width }
  }
  catch {
    return undefined
  }
}

/** Il primo problema di una risposta, se ce n'è uno. */
export function responseProblem(response: Response, body: Uint8Array, expected: ExpectedImage): string | undefined {
  if (response.status !== 200) return `risponde con stato ${response.status}, atteso 200`
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim()
  if (contentType !== expected.contentType) {
    return `risponde ${contentType ?? 'senza Content-Type'}, atteso ${expected.contentType}`
  }
  const image = readImageFile(body)
  if (!image) return 'la risposta non è un’immagine riconosciuta'
  if (image.format !== expected.format) return `il file ricevuto è ${image.format}, atteso ${expected.format}`
  if (image.width !== expected.width) return `è larga ${image.width} px, attesi ${expected.width}`
  return undefined
}
