import { describe, it, expect } from 'vitest'
import { getQuests } from './quests.js'
import { validateQuests } from './validate.js'
import { planetLayouts } from './planetLayouts.js'
import { allLore, indexById } from './loreData.js'

describe('quest chains', () => {
  it('defines exactly 3 chains', () => {
    expect(getQuests().map(q => q.id).sort())
      .toEqual(['quest_cloners_secret', 'quest_naboo_invasion', 'quest_sith_trail'])
  })
  it('passes validateQuests against real lore + layouts', () => {
    expect(validateQuests(getQuests(), indexById(allLore), planetLayouts)).toEqual([])
  })
  it('each chain has 4..5 steps and a reward', () => {
    for (const q of getQuests()) {
      expect(q.steps.length).toBeGreaterThanOrEqual(4)
      expect(q.steps.length).toBeLessThanOrEqual(5)
      expect(typeof q.reward.holocronLoreId).toBe('string')
      expect(q.reward.maxHealthBonus).toBe(20)
    }
  })
})
