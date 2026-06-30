export const CATEGORIES = ['planets', 'factions', 'characters', 'events', 'species']
export const RARITIES = ['common', 'rare', 'legendary']
export const TRIGGERS = ['landmark', 'terminal', 'npc_dialogue', 'artifact']
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

export function validateLayouts(layouts, byId) {
  const errs = []
  for (const [planetId, l] of Object.entries(layouts)) {
    if (!PLANET_IDS.includes(planetId)) errs.push(`layout "${planetId}": not a canonical planet id`)
    if (!FACTIONS.includes(l.faction)) errs.push(`${planetId}: invalid faction "${l.faction}"`)
    if (!l.galaxyPos || typeof l.galaxyPos.x !== 'number' || typeof l.galaxyPos.y !== 'number') {
      errs.push(`${planetId}: galaxyPos must have numeric x/y`)
    }
    if (!l.spawn || typeof l.spawn.x !== 'number') errs.push(`${planetId}: spawn must have numeric x/y`)
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
