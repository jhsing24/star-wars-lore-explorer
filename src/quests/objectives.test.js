import { describe, it, expect } from 'vitest'
import { matchesObjective } from './objectives.js'

describe('matchesObjective', () => {
  it('talk matches same planet + npc only', () => {
    const o = { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' }
    expect(matchesObjective(o, { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' })).toBe(true)
    expect(matchesObjective(o, { type: 'talk', planet: 'naboo', npcLoreId: 'char_palpatine' })).toBe(false)
    expect(matchesObjective(o, { type: 'talk', planet: 'coruscant', npcLoreId: 'char_mace_windu' })).toBe(false)
  })
  it('discover matches loreId only', () => {
    const o = { type: 'discover', loreId: 'event_invasion_naboo' }
    expect(matchesObjective(o, { type: 'discover', loreId: 'event_invasion_naboo' })).toBe(true)
    expect(matchesObjective(o, { type: 'discover', loreId: 'other' })).toBe(false)
  })
  it('enter matches planet + landmark', () => {
    const o = { type: 'enter', planet: 'naboo', landmarkId: 'lm_battle_naboo' }
    expect(matchesObjective(o, { type: 'enter', planet: 'naboo', landmarkId: 'lm_battle_naboo' })).toBe(true)
    expect(matchesObjective(o, { type: 'enter', planet: 'naboo', landmarkId: 'lm_other' })).toBe(false)
  })
  it('challenge matches planet + challengeId', () => {
    const o = { type: 'challenge', planet: 'naboo', challengeId: 'naboo_palace' }
    expect(matchesObjective(o, { type: 'challenge', planet: 'naboo', challengeId: 'naboo_palace' })).toBe(true)
    expect(matchesObjective(o, { type: 'challenge', planet: 'mustafar', challengeId: 'naboo_palace' })).toBe(false)
  })
  it('different types never match', () => {
    expect(matchesObjective({ type: 'talk', planet: 'a', npcLoreId: 'b' }, { type: 'discover', loreId: 'b' })).toBe(false)
  })
})
