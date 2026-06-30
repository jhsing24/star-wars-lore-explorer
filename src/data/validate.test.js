import { describe, it, expect } from 'vitest'
import { validateLoreEntry, validateLore, validateLayouts } from './validate.js'
import { validateQuests } from './validate.js'

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
  it('flags a size below the 1280x720 floor', () => {
    const bad = structuredClone(base)
    bad.coruscant.size = { width: 100, height: 100 }
    expect(validateLayouts(bad, byId).some(e => e.includes('size'))).toBe(true)
  })
  it('flags an invalid interactable type', () => {
    const bad = structuredClone(base)
    bad.coruscant.interactables[1].type = 'spaceship'
    expect(validateLayouts(bad, byId).some(e => e.includes('type'))).toBe(true)
  })
  it('flags a faction that does not match the planet', () => {
    const bad = structuredClone(base)
    bad.coruscant.faction = 'separatist'
    expect(validateLayouts(bad, byId).some(e => e.includes('faction'))).toBe(true)
  })
})

describe('validateQuests', () => {
  const byId = new Map([
    ['char_padme_amidala', { id: 'char_padme_amidala' }],
    ['char_palpatine', { id: 'char_palpatine' }],
    ['event_invasion_naboo', { id: 'event_invasion_naboo' }],
    ['holo_naboo', { id: 'holo_naboo' }]
  ])
  const layouts = {
    naboo: {
      size: { width: 1600, height: 1200 },
      landmarks: [{ id: 'lm_battle_naboo' }],
      interactables: [{ type: 'npc', loreId: 'char_padme_amidala' }],
      challenges: {
        naboo_palace: {
          bounds: { x: 100, y: 100, w: 400, h: 400 },
          checkpoint: { x: 150, y: 150 },
          goal: { x: 400, y: 400, w: 60, h: 60 },
          hazards: [{ type: 'patrol', x: 200, y: 200, w: 30, h: 30, damage: 20, speed: 100, axis: 'x', range: 200 }]
        }
      }
    },
    coruscant: {
      size: { width: 1600, height: 1200 }, landmarks: [],
      interactables: [{ type: 'npc', loreId: 'char_palpatine' }], challenges: {}
    }
  }
  const good = [{
    id: 'q_naboo', title: 'Shadows over Naboo',
    giver: { planet: 'naboo', npcLoreId: 'char_padme_amidala' },
    summary: 's',
    steps: [
      { id: 's1', hint: 'h', objective: { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' } },
      { id: 's2', hint: 'h', objective: { type: 'discover', loreId: 'event_invasion_naboo' } },
      { id: 's3', hint: 'h', objective: { type: 'challenge', planet: 'naboo', challengeId: 'naboo_palace' } },
      { id: 's4', hint: 'h', objective: { type: 'enter', planet: 'naboo', landmarkId: 'lm_battle_naboo' } }
    ],
    reward: { holocronLoreId: 'holo_naboo', maxHealthBonus: 20 }
  }]

  it('accepts a well-formed quest', () => {
    expect(validateQuests(good, byId, layouts)).toEqual([])
  })
  it('flags a giver NPC not present on its planet', () => {
    const bad = structuredClone(good); bad[0].giver.npcLoreId = 'char_palpatine' // not on naboo
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('giver'))).toBe(true)
  })
  it('flags an unknown objective type', () => {
    const bad = structuredClone(good); bad[0].steps[0].objective.type = 'fly'
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('type'))).toBe(true)
  })
  it('flags a talk NPC not on the named planet', () => {
    const bad = structuredClone(good); bad[0].steps[0].objective.npcLoreId = 'char_padme_amidala' // on naboo not coruscant
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('npc'))).toBe(true)
  })
  it('flags an unknown challenge id', () => {
    const bad = structuredClone(good); bad[0].steps[2].objective.challengeId = 'ghost'
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('challenge'))).toBe(true)
  })
  it('flags a checkpoint outside challenge bounds', () => {
    const bad = structuredClone(layouts); bad.naboo.challenges.naboo_palace.checkpoint = { x: 9000, y: 9000 }
    expect(validateQuests(good, byId, bad).some(e => e.includes('checkpoint'))).toBe(true)
  })
  it('flags a missing reward holocron', () => {
    const bad = structuredClone(good); bad[0].reward.holocronLoreId = 'ghost'
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('holocron'))).toBe(true)
  })
  it('flags a goal rectangle whose far corner is outside bounds', () => {
    const bad = structuredClone(layouts)
    bad.naboo.challenges.naboo_palace.goal = { x: 480, y: 480, w: 60, h: 60 }
    expect(validateQuests(good, byId, bad).some(e => e.includes('goal'))).toBe(true)
  })
  it('flags an enter landmark not on the named planet', () => {
    const bad = structuredClone(good)
    bad[0].steps[3].objective.landmarkId = 'lm_not_real'
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('landmark'))).toBe(true)
  })
  it('flags a non-numeric maxHealthBonus', () => {
    const bad = structuredClone(good)
    bad[0].reward.maxHealthBonus = 'twenty'
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('maxHealthBonus'))).toBe(true)
  })
  it('returns an error (not a throw) for a null challenge value', () => {
    const bad = structuredClone(layouts)
    bad.naboo.challenges.zombie = null
    expect(() => validateQuests(good, byId, bad)).not.toThrow()
    expect(validateQuests(good, byId, bad).some(e => e.includes('zombie'))).toBe(true)
  })
})
