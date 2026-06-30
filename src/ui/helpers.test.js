import { describe, it, expect } from 'vitest'
import { factionColor } from './helpers.js'

describe('factionColor', () => {
  it('maps known factions to distinct hex ints', () => {
    expect(factionColor('republic')).toBe(0x4a90d9)
    expect(factionColor('separatist')).toBe(0xd9534a)
    expect(factionColor('neutral')).toBe(0x9aa0a6)
  })
  it('falls back to neutral gray for unknown factions', () => {
    expect(factionColor('sith')).toBe(0x9aa0a6)
  })
})
