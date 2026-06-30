import { describe, it, expect } from 'vitest'
import { nearestInteractable } from './interaction.js'

const items = [
  { x: 0, y: 0, def: { loreId: 'a' } },
  { x: 100, y: 0, def: { loreId: 'b' } },
  { x: 300, y: 300, def: { loreId: 'c' } }
]

describe('nearestInteractable', () => {
  it('returns the closest item within radius', () => {
    expect(nearestInteractable({ x: 10, y: 0 }, items, 60).def.loreId).toBe('a')
    expect(nearestInteractable({ x: 90, y: 0 }, items, 60).def.loreId).toBe('b')
  })
  it('returns null when nothing is within radius', () => {
    expect(nearestInteractable({ x: 1000, y: 1000 }, items, 60)).toBeNull()
  })
  it('returns null for an empty list', () => {
    expect(nearestInteractable({ x: 0, y: 0 }, [], 60)).toBeNull()
  })
})
