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
  it('returns the nearer item when multiple are within radius', () => {
    // probe at x=40: 'a' is dist 40, 'b' is dist 60 — both within radius 80, 'a' must win
    expect(nearestInteractable({ x: 40, y: 0 }, items, 80).def.loreId).toBe('a')
    // probe at x=70: 'a' is dist 70, 'b' is dist 30 — both within radius 80, 'b' must win
    expect(nearestInteractable({ x: 70, y: 0 }, items, 80).def.loreId).toBe('b')
  })
  it('includes an item exactly at the radius boundary', () => {
    // 'b' is exactly 100 away; radius 100 must include it (<= boundary)
    expect(nearestInteractable({ x: 0, y: 0 }, items, 100).def.loreId).toBe('a')
    // with only 'b' reachable at exactly its distance: probe next to 'b'
    expect(nearestInteractable({ x: 100, y: 100 }, [{ x: 100, y: 0, def: { loreId: 'b' } }], 100).def.loreId).toBe('b')
  })
})
