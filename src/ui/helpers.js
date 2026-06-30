import { CATEGORIES } from '../data/validate.js'

const FACTION_COLORS = {
  republic: 0x4a90d9,
  separatist: 0xd9534a,
  neutral: 0x9aa0a6
}

export function factionColor(faction) {
  return FACTION_COLORS[faction] ?? FACTION_COLORS.neutral
}

export function groupByCategory(entries) {
  const out = {}
  for (const cat of CATEGORIES) {
    const inCat = entries.filter(e => e.category === cat)
    if (inCat.length) out[cat] = inCat
  }
  return out
}

export function rarityClass(rarity) {
  const known = ['common', 'rare', 'legendary']
  return `card-${known.includes(rarity) ? rarity : 'common'}`
}
