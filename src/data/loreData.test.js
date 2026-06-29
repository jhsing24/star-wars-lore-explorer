import { describe, it, expect } from 'vitest'
import { allLore, indexById } from './loreData.js'
import { validateLore, CATEGORIES, PLANET_IDS } from './validate.js'

describe('seed lore data', () => {
  it('passes schema validation with no errors', () => {
    expect(validateLore(allLore)).toEqual([])
  })

  it('meets minimum counts per category', () => {
    const count = (c) => allLore.filter(e => e.category === c).length
    expect(count('planets')).toBe(12)
    expect(count('factions')).toBeGreaterThanOrEqual(10)
    expect(count('characters')).toBeGreaterThanOrEqual(25)
    expect(count('events')).toBeGreaterThanOrEqual(15)
    expect(count('species')).toBeGreaterThanOrEqual(18)
  })

  it('has at least 80 total entries', () => {
    expect(allLore.length).toBeGreaterThanOrEqual(80)
  })

  it('has one planets entry per canonical planet id', () => {
    const planetEntryIds = allLore.filter(e => e.category === 'planets')
      .map(e => e.unlock_condition.planet).sort()
    expect(planetEntryIds).toEqual([...PLANET_IDS].sort())
  })

  it('indexById returns a Map keyed by id', () => {
    const idx = indexById(allLore)
    expect(idx.get('char_palpatine')?.title).toBe('Sheev Palpatine')
    expect(idx.size).toBe(allLore.length)
  })

  it('only uses known categories', () => {
    expect(allLore.every(e => CATEGORIES.includes(e.category))).toBe(true)
  })

  it('distributes 4..8 entries to every canonical planet', () => {
    const counts = Object.fromEntries(PLANET_IDS.map(p => [p, 0]))
    for (const e of allLore) counts[e.unlock_condition.planet]++
    for (const p of PLANET_IDS) {
      expect(counts[p], `${p} entry count`).toBeGreaterThanOrEqual(4)
      expect(counts[p], `${p} entry count`).toBeLessThanOrEqual(8)
    }
  })
})
