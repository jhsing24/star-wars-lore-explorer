import planets from './planets.json'
import factions from './factions.json'
import characters from './characters.json'
import events from './events.json'
import species from './species.json'

export const allLore = [...planets, ...factions, ...characters, ...events, ...species]

export function indexById(entries) {
  const map = new Map()
  for (const e of entries) map.set(e.id, e)
  return map
}
