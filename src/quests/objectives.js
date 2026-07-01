export function matchesObjective(objective, event) {
  if (!objective || !event || objective.type !== event.type) return false
  switch (objective.type) {
    case 'talk':
      return objective.planet === event.planet && objective.npcLoreId === event.npcLoreId
    case 'discover':
      return objective.loreId === event.loreId
    case 'enter':
      return objective.planet === event.planet && objective.landmarkId === event.landmarkId
    case 'challenge':
      return objective.planet === event.planet && objective.challengeId === event.challengeId
    default:
      return false
  }
}
