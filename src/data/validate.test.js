import { describe, it, expect } from 'vitest'
import { validateLoreEntry, validateLore } from './validate.js'

const good = {
  id: 'char_palpatine',
  title: 'Sheev Palpatine',
  category: 'characters',
  summary: 'A Naboo senator who became Supreme Chancellor of the Galactic Republic.',
  wookieepedia_slug: 'Palpatine',
  rarity: 'legendary',
  unlock_condition: { planet: 'coruscant', trigger: 'npc_dialogue' }
}

describe('validateLoreEntry', () => {
  it('accepts a well-formed entry', () => {
    expect(validateLoreEntry(good)).toEqual([])
  })
  it('rejects an unknown category', () => {
    const errs = validateLoreEntry({ ...good, category: 'vehicles' })
    expect(errs.some(e => e.includes('category'))).toBe(true)
  })
  it('rejects an unknown rarity', () => {
    const errs = validateLoreEntry({ ...good, rarity: 'mythic' })
    expect(errs.some(e => e.includes('rarity'))).toBe(true)
  })
  it('rejects an unknown planet in unlock_condition', () => {
    const errs = validateLoreEntry({ ...good, unlock_condition: { planet: 'dagobah', trigger: 'terminal' } })
    expect(errs.some(e => e.includes('planet'))).toBe(true)
  })
  it('rejects an unknown trigger', () => {
    const errs = validateLoreEntry({ ...good, unlock_condition: { planet: 'coruscant', trigger: 'mind_trick' } })
    expect(errs.some(e => e.includes('trigger'))).toBe(true)
  })
  it('rejects a missing summary', () => {
    const e2 = { ...good }; delete e2.summary
    expect(validateLoreEntry(e2).some(e => e.includes('summary'))).toBe(true)
  })
})

describe('validateLore', () => {
  it('flags duplicate ids', () => {
    const errs = validateLore([good, good])
    expect(errs.some(e => e.includes('duplicate'))).toBe(true)
  })
})
