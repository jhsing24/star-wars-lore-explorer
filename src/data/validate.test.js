import { describe, it, expect } from 'vitest'
import { validateLoreEntry, validateLore, validateLayouts } from './validate.js'

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

describe('validateLayouts', () => {
  const byId = new Map([
    ['planet_coruscant', { id: 'planet_coruscant' }],
    ['char_x', { id: 'char_x' }]
  ])
  const base = {
    coruscant: {
      name: 'Coruscant', faction: 'republic', galaxyPos: { x: 100, y: 100 },
      bg: 0x10131a, palette: { floor: 1, accent: 2, structure: 3 },
      size: { width: 1600, height: 1200 }, spawn: { x: 800, y: 600 },
      landmarks: [{ id: 'lm1', name: 'Temple', x: 1, y: 1, w: 10, h: 10, loreId: 'planet_coruscant' }],
      interactables: [
        { type: 'npc', x: 1, y: 1, loreId: 'char_x', name: 'C', lines: ['hi'] },
        { type: 'terminal', x: 2, y: 2, loreId: 'char_x' },
        { type: 'artifact', x: 3, y: 3, loreId: 'char_x' }
      ]
    }
  }
  it('accepts a valid single-planet layout subset', () => {
    expect(validateLayouts(base, byId)).toEqual([])
  })
  it('flags a loreId missing from lore data', () => {
    const bad = structuredClone(base)
    bad.coruscant.interactables[0].loreId = 'ghost'
    expect(validateLayouts(bad, byId).some(e => e.includes('ghost'))).toBe(true)
  })
  it('flags an npc with no lines', () => {
    const bad = structuredClone(base)
    delete bad.coruscant.interactables[0].lines
    expect(validateLayouts(bad, byId).some(e => e.includes('lines'))).toBe(true)
  })
})
