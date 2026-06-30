import { describe, it, expect } from 'vitest'
import { planetLayouts } from './planetLayouts.js'
import { validateLayouts, PLANET_IDS } from './validate.js'
import { allLore, indexById } from './loreData.js'

describe('planetLayouts', () => {
  it('defines a layout for every canonical planet', () => {
    expect(Object.keys(planetLayouts).sort()).toEqual([...PLANET_IDS].sort())
  })
  it('passes cross-reference validation against lore data', () => {
    expect(validateLayouts(planetLayouts, indexById(allLore))).toEqual([])
  })
  it('every planet has 4..8 lore points', () => {
    for (const id of PLANET_IDS) {
      const l = planetLayouts[id]
      const points = l.landmarks.length + l.interactables.length
      expect(points, `${id} point count`).toBeGreaterThanOrEqual(4)
      expect(points, `${id} point count`).toBeLessThanOrEqual(8)
    }
  })
})
