import { describe, it, expect, beforeEach } from 'vitest'
import QuestService from './QuestService.js'
import SaveService from '../services/SaveService.js'
import { createMemoryStorage } from '../../test/helpers/memoryStorage.js'

const quests = [{
  id: 'q1', title: 'Q1',
  giver: { planet: 'naboo', npcLoreId: 'char_padme' },
  summary: 's',
  steps: [
    { id: 's1', hint: 'h1', objective: { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' } },
    { id: 's2', hint: 'h2', objective: { type: 'discover', loreId: 'lore_x' } },
    { id: 's3', hint: 'h3', objective: { type: 'enter', planet: 'naboo', landmarkId: 'lm_y' } }
  ],
  reward: { holocronLoreId: 'holo_q1', maxHealthBonus: 20 }
}]
const holoById = new Map([['holo_q1', { id: 'holo_q1', rarity: 'legendary', unlock_condition: { trigger: 'quest' } }]])

function make() {
  const save = new SaveService(createMemoryStorage()); save.load()
  return { save, qs: new QuestService({ quests, save, holoById }) }
}

describe('QuestService', () => {
  let save, qs
  beforeEach(() => { ({ save, qs } = make()) })

  it('lists the quest as available, offered by its giver', () => {
    expect(qs.getAvailable().map(q => q.id)).toEqual(['q1'])
    expect(qs.availableFrom('naboo', 'char_padme').id).toBe('q1')
    expect(qs.availableFrom('naboo', 'someone_else')).toBeNull()
  })

  it('accept makes it active at step 0 and tracked', () => {
    qs.accept('q1')
    expect(qs.getActive().map(q => q.id)).toEqual(['q1'])
    expect(qs.currentStepIndex('q1')).toBe(0)
    expect(qs.getTrackedId()).toBe('q1')
    expect(qs.trackedObjective()).toEqual(quests[0].steps[0].objective)
  })

  it('advance only progresses on the matching current objective', () => {
    qs.accept('q1')
    qs.advance({ type: 'discover', loreId: 'lore_x' })      // not current (current is talk)
    expect(qs.currentStepIndex('q1')).toBe(0)
    qs.advance({ type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' })
    expect(qs.currentStepIndex('q1')).toBe(1)
  })

  it('completes on the last step and grants reward once', () => {
    qs.accept('q1')
    qs.advance({ type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' }) // ->1
    qs.advance({ type: 'discover', loreId: 'lore_x' })                              // ->2
    const res = qs.advance({ type: 'enter', planet: 'naboo', landmarkId: 'lm_y' })  // ->complete
    expect(res).toEqual([{ questId: 'q1', completed: true, reward: quests[0].reward }])
    expect(qs.getCompleted().map(q => q.id)).toEqual(['q1'])
    expect(save.isUnlocked('holo_q1')).toBe(true)
    expect(save.getMaxHealth()).toBe(120)
    // re-emitting does not re-grant
    const again = qs.advance({ type: 'enter', planet: 'naboo', landmarkId: 'lm_y' })
    expect(again).toEqual([])
    expect(save.getMaxHealth()).toBe(120)
  })

  it('auto-advances past an already-satisfied discover step (no soft-lock)', () => {
    save.unlockLore({ id: 'lore_x', unlock_condition: { trigger: 'terminal' } }) // pre-discovered
    qs.accept('q1')
    qs.advance({ type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' }) // ->1, which is discover lore_x already done -> auto ->2
    expect(qs.currentStepIndex('q1')).toBe(2)
  })

  it('persists across reload', () => {
    qs.accept('q1')
    qs.advance({ type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' })
    const qs2 = new QuestService({ quests, save, holoById })
    expect(qs2.currentStepIndex('q1')).toBe(1)
    expect(qs2.getActive().map(q => q.id)).toEqual(['q1'])
  })
})
