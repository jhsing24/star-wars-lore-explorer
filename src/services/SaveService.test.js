import { describe, it, expect, beforeEach } from 'vitest'
import SaveService from './SaveService.js'
import { createMemoryStorage } from '../../test/helpers/memoryStorage.js'

const artifactEntry = {
  id: 'item_holocron', rarity: 'legendary',
  unlock_condition: { planet: 'coruscant', trigger: 'artifact' }
}
const npcEntry = {
  id: 'char_palpatine', rarity: 'legendary',
  unlock_condition: { planet: 'coruscant', trigger: 'npc_dialogue' }
}

describe('SaveService', () => {
  let storage, save
  beforeEach(() => { storage = createMemoryStorage(); save = new SaveService(storage); save.load() })

  it('starts from a fresh default state', () => {
    expect(save.state.unlockedLore).toEqual([])
    expect(save.state.cardCollection).toEqual([])
    expect(save.totalUnlocked()).toBe(0)
  })

  it('unlocks lore once and reports newness', () => {
    expect(save.unlockLore(npcEntry)).toBe(true)
    expect(save.unlockLore(npcEntry)).toBe(false)
    expect(save.isUnlocked('char_palpatine')).toBe(true)
    expect(save.totalUnlocked()).toBe(1)
  })

  it('adds a card only for artifact-trigger unlocks', () => {
    save.unlockLore(npcEntry)
    expect(save.state.cardCollection).toHaveLength(0)
    save.unlockLore(artifactEntry)
    expect(save.state.cardCollection).toHaveLength(1)
    expect(save.state.cardCollection[0].id).toBe('item_holocron')
    expect(save.state.cardCollection[0].rarity).toBe('legendary')
    expect(typeof save.state.cardCollection[0].unlockedAt).toBe('number')
  })

  it('tracks visited planets without duplicates', () => {
    save.visitPlanet('coruscant'); save.visitPlanet('coruscant'); save.visitPlanet('naboo')
    expect(save.state.visitedPlanets).toEqual(['coruscant', 'naboo'])
  })

  it('persists and reloads through storage', () => {
    save.setCurrentPlanet('naboo')
    save.unlockLore(npcEntry)
    const reloaded = new SaveService(storage)
    reloaded.load()
    expect(reloaded.state.currentPlanet).toBe('naboo')
    expect(reloaded.isUnlocked('char_palpatine')).toBe(true)
  })

  it('stores and reads planet progress', () => {
    save.setPlanetProgress('coruscant', 3, 7)
    expect(save.getPlanetProgress('coruscant')).toEqual({ found: 3, total: 7 })
    expect(save.getPlanetProgress('tatooine')).toEqual({ found: 0, total: 0 })
  })

  it('reset returns to defaults', () => {
    save.unlockLore(npcEntry); save.reset()
    expect(save.totalUnlocked()).toBe(0)
  })

  it('falls back to defaults when stored JSON is corrupt', () => {
    storage.setItem('swle_save', '{not valid json')
    const recovered = new SaveService(storage)
    recovered.load()
    expect(recovered.state.unlockedLore).toEqual([])
    expect(recovered.totalUnlocked()).toBe(0)
  })
})

describe('SaveService quests/health/challenges', () => {
  let storage, save
  beforeEach(() => { storage = createMemoryStorage(); save = new SaveService(storage); save.load() })

  it('defaults: no quests, maxHealth 100, no cleared challenges', () => {
    expect(save.allQuestStates()).toEqual({})
    expect(save.getQuestState('q1')).toBeNull()
    expect(save.getMaxHealth()).toBe(100)
    expect(save.isChallengeCleared('naboo', 'naboo_palace')).toBe(false)
  })

  it('stores and persists quest state', () => {
    save.setQuestState('q1', { status: 'active', step: 2 })
    expect(save.getQuestState('q1')).toEqual({ status: 'active', step: 2 })
    const reloaded = new SaveService(storage); reloaded.load()
    expect(reloaded.getQuestState('q1')).toEqual({ status: 'active', step: 2 })
  })

  it('raises and persists max health', () => {
    save.addMaxHealth(20)
    expect(save.getMaxHealth()).toBe(120)
    const reloaded = new SaveService(storage); reloaded.load()
    expect(reloaded.getMaxHealth()).toBe(120)
  })

  it('clears and persists challenges', () => {
    save.clearChallenge('naboo', 'naboo_palace')
    expect(save.isChallengeCleared('naboo', 'naboo_palace')).toBe(true)
    expect(save.isChallengeCleared('naboo', 'other')).toBe(false)
    const reloaded = new SaveService(storage); reloaded.load()
    expect(reloaded.isChallengeCleared('naboo', 'naboo_palace')).toBe(true)
  })

  it('loads a pre-expansion save shape with sane defaults (backward compatible)', () => {
    storage.setItem('swle_save', JSON.stringify({ currentPlanet: 'naboo', unlockedLore: ['x'] }))
    const s = new SaveService(storage); s.load()
    expect(s.getMaxHealth()).toBe(100)
    expect(s.allQuestStates()).toEqual({})
    expect(s.isChallengeCleared('naboo', 'naboo_palace')).toBe(false)
    expect(s.isUnlocked('x')).toBe(true)
  })
})
