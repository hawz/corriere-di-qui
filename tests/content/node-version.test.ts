import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf-8')

describe('versione di Node', () => {
  // La CI legge .nvmrc; su Netlify prevale NODE_VERSION di netlify.toml.
  it('è la stessa in .nvmrc e in netlify.toml', () => {
    expect(read('netlify.toml').match(/^\s*NODE_VERSION = "(.+)"$/m)?.[1]).toBe(read('.nvmrc').trim())
  })
})
