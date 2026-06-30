export const CATEGORIES = ['planets', 'factions', 'characters', 'events', 'species', 'holocrons']
export const RARITIES = ['common', 'rare', 'legendary']
export const TRIGGERS = ['landmark', 'terminal', 'npc_dialogue', 'artifact', 'quest']
export const PLANET_IDS = [
  'coruscant', 'naboo', 'kamino', 'geonosis', 'kashyyyk', 'mustafar',
  'utapau', 'tatooine', 'mandalore', 'ryloth', 'christophsis', 'rodia'
]

export function validateLoreEntry(entry) {
  const errs = []
  const requireString = (field) => {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      errs.push(`${entry.id || '(no id)'}: ${field} must be a non-empty string`)
    }
  }
  requireString('id')
  requireString('title')
  requireString('summary')
  requireString('wookieepedia_slug')

  if (!CATEGORIES.includes(entry.category)) {
    errs.push(`${entry.id}: invalid category "${entry.category}"`)
  }
  if (!RARITIES.includes(entry.rarity)) {
    errs.push(`${entry.id}: invalid rarity "${entry.rarity}"`)
  }
  const uc = entry.unlock_condition
  if (!uc || typeof uc !== 'object') {
    errs.push(`${entry.id}: missing unlock_condition`)
  } else {
    if (!PLANET_IDS.includes(uc.planet)) {
      errs.push(`${entry.id}: invalid unlock_condition.planet "${uc.planet}"`)
    }
    if (!TRIGGERS.includes(uc.trigger)) {
      errs.push(`${entry.id}: invalid unlock_condition.trigger "${uc.trigger}"`)
    }
  }
  return errs
}

export function validateLore(entries) {
  const errs = []
  const seen = new Set()
  for (const entry of entries) {
    errs.push(...validateLoreEntry(entry))
    if (seen.has(entry.id)) errs.push(`duplicate id "${entry.id}"`)
    seen.add(entry.id)
  }
  return errs
}

const FACTIONS = ['republic', 'separatist', 'neutral']

const PLANET_FACTIONS = {
  coruscant: 'republic', kamino: 'republic', kashyyyk: 'republic', naboo: 'republic',
  geonosis: 'separatist', utapau: 'separatist', mustafar: 'separatist', rodia: 'separatist',
  tatooine: 'neutral', mandalore: 'neutral', christophsis: 'neutral', ryloth: 'neutral'
}

export function validateLayouts(layouts, byId) {
  const errs = []
  for (const [planetId, l] of Object.entries(layouts)) {
    if (!PLANET_IDS.includes(planetId)) errs.push(`layout "${planetId}": not a canonical planet id`)
    if (!FACTIONS.includes(l.faction)) errs.push(`${planetId}: invalid faction "${l.faction}"`)
    if (PLANET_FACTIONS[planetId] && l.faction !== PLANET_FACTIONS[planetId]) {
      errs.push(`${planetId}: faction must be "${PLANET_FACTIONS[planetId]}"`)
    }
    if (!l.galaxyPos || typeof l.galaxyPos.x !== 'number' || typeof l.galaxyPos.y !== 'number') {
      errs.push(`${planetId}: galaxyPos must have numeric x/y`)
    }
    if (!l.spawn || typeof l.spawn.x !== 'number' || typeof l.spawn.y !== 'number') errs.push(`${planetId}: spawn must have numeric x/y`)
    if (!l.size || l.size.width < 1280 || l.size.height < 720) {
      errs.push(`${planetId}: size must be at least 1280x720`)
    }
    const landmarks = l.landmarks || []
    const interactables = l.interactables || []
    const points = landmarks.length + interactables.length
    if (points < 4 || points > 8) errs.push(`${planetId}: must have 4..8 lore points (has ${points})`)

    for (const lm of landmarks) {
      if (!byId.has(lm.loreId)) errs.push(`${planetId} landmark "${lm.id}": unknown loreId "${lm.loreId}"`)
    }
    for (const it of interactables) {
      if (!['npc', 'terminal', 'artifact'].includes(it.type)) {
        errs.push(`${planetId}: invalid interactable type "${it.type}"`)
      }
      if (!byId.has(it.loreId)) errs.push(`${planetId} interactable: unknown loreId "${it.loreId}"`)
      if (it.type === 'npc' && (!Array.isArray(it.lines) || it.lines.length === 0)) {
        errs.push(`${planetId} npc "${it.name || '?'}": must have non-empty lines`)
      }
    }
  }
  return errs
}

const OBJECTIVE_TYPES = ['talk', 'discover', 'enter', 'challenge']

function npcLoreIdsOn(layout) {
  return (layout?.interactables || []).filter(i => i.type === 'npc').map(i => i.loreId)
}
function landmarkIdsOn(layout) {
  return (layout?.landmarks || []).map(l => l.id)
}

function validateChallengeGeometry(planetId, cid, c, layout, errs) {
  const within = (px, py) =>
    px >= c.bounds.x && px <= c.bounds.x + c.bounds.w &&
    py >= c.bounds.y && py <= c.bounds.y + c.bounds.h
  if (!c.bounds || !layout?.size) { errs.push(`${planetId}/${cid}: missing bounds/size`); return }
  if (c.bounds.x < 0 || c.bounds.y < 0 ||
      c.bounds.x + c.bounds.w > layout.size.width ||
      c.bounds.y + c.bounds.h > layout.size.height) {
    errs.push(`${planetId}/${cid}: bounds outside planet size`)
  }
  if (!c.checkpoint || !within(c.checkpoint.x, c.checkpoint.y)) {
    errs.push(`${planetId}/${cid}: checkpoint outside bounds`)
  }
  if (!c.goal || !within(c.goal.x, c.goal.y)) {
    errs.push(`${planetId}/${cid}: goal outside bounds`)
  }
  for (const h of (c.hazards || [])) {
    if (!['static', 'patrol', 'sweep'].includes(h.type)) {
      errs.push(`${planetId}/${cid}: invalid hazard type "${h.type}"`)
    }
  }
}

export function validateQuests(quests, byId, layouts) {
  const errs = []
  // every challenge zone referenced or present is geometry-checked
  for (const [planetId, layout] of Object.entries(layouts)) {
    for (const [cid, c] of Object.entries(layout.challenges || {})) {
      validateChallengeGeometry(planetId, cid, c, layout, errs)
    }
  }
  const seen = new Set()
  for (const q of quests) {
    if (typeof q.id !== 'string' || !q.id) errs.push('quest with missing id')
    if (seen.has(q.id)) errs.push(`duplicate quest id "${q.id}"`)
    seen.add(q.id)
    if (typeof q.title !== 'string' || !q.title) errs.push(`${q.id}: missing title`)
    // giver
    const g = q.giver || {}
    if (!PLANET_IDS.includes(g.planet)) errs.push(`${q.id}: giver.planet invalid`)
    else if (!npcLoreIdsOn(layouts[g.planet]).includes(g.npcLoreId)) {
      errs.push(`${q.id}: giver npc "${g.npcLoreId}" not an NPC on ${g.planet}`)
    }
    if (!Array.isArray(q.steps) || q.steps.length === 0) errs.push(`${q.id}: needs steps`)
    for (const step of (q.steps || [])) {
      const o = step.objective || {}
      if (!OBJECTIVE_TYPES.includes(o.type)) { errs.push(`${q.id}/${step.id}: invalid objective type "${o.type}"`); continue }
      if (o.type === 'talk') {
        if (!PLANET_IDS.includes(o.planet)) errs.push(`${q.id}/${step.id}: talk planet invalid`)
        else if (!npcLoreIdsOn(layouts[o.planet]).includes(o.npcLoreId)) errs.push(`${q.id}/${step.id}: talk npc "${o.npcLoreId}" not on ${o.planet}`)
      } else if (o.type === 'discover') {
        if (!byId.has(o.loreId)) errs.push(`${q.id}/${step.id}: discover unknown loreId "${o.loreId}"`)
      } else if (o.type === 'enter') {
        if (!PLANET_IDS.includes(o.planet)) errs.push(`${q.id}/${step.id}: enter planet invalid`)
        else if (!landmarkIdsOn(layouts[o.planet]).includes(o.landmarkId)) errs.push(`${q.id}/${step.id}: enter landmark "${o.landmarkId}" not on ${o.planet}`)
      } else if (o.type === 'challenge') {
        if (!PLANET_IDS.includes(o.planet)) errs.push(`${q.id}/${step.id}: challenge planet invalid`)
        else if (!(layouts[o.planet]?.challenges || {})[o.challengeId]) errs.push(`${q.id}/${step.id}: unknown challenge "${o.challengeId}" on ${o.planet}`)
      }
    }
    const r = q.reward || {}
    if (!byId.has(r.holocronLoreId)) errs.push(`${q.id}: reward holocron "${r.holocronLoreId}" not in lore`)
    if (typeof r.maxHealthBonus !== 'number') errs.push(`${q.id}: reward.maxHealthBonus must be a number`)
  }
  return errs
}
