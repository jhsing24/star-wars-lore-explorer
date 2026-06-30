export function nearestInteractable(pos, interactables, radius) {
  let best = null
  let bestDist = radius
  for (const it of interactables) {
    const d = Math.hypot(it.x - pos.x, it.y - pos.y)
    if (d <= bestDist) { bestDist = d; best = it }
  }
  return best
}
