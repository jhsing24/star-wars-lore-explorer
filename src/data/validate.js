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
