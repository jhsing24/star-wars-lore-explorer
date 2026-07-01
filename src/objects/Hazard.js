const DANGER = 0xff4400
const DANGER2 = 0xd9534a

// Triangle-wave offset: starts at 0, rises to +range, falls to -range, period derived from speed.
export function patrolOffset(elapsedMs, speed, range) {
  if (range <= 0) return 0
  const period = (4 * range) / speed   // seconds for a full cycle
  const t = (elapsedMs / 1000) % period
  const quarter = period / 4
  if (t < quarter) return speed * t
  if (t < 3 * quarter) return range - speed * (t - quarter)
  return -range + speed * (t - 3 * quarter)
}

export function createHazard(scene, def) {
  let sprite
  if (def.type === 'sweep') {
    sprite = scene.add.rectangle(def.x, def.y, def.length, 10, DANGER).setOrigin(0, 0.5)
  } else {
    sprite = scene.add.rectangle(def.x, def.y, def.w, def.h, def.type === 'static' ? DANGER2 : DANGER)
  }
  sprite.setDepth(20)
  const base = { x: def.x, y: def.y }

  const update = (elapsedMs) => {
    if (def.type === 'patrol') {
      const off = patrolOffset(elapsedMs, def.speed, def.range)
      if (def.axis === 'y') sprite.y = base.y + off
      else sprite.x = base.x + off
    } else if (def.type === 'sweep') {
      sprite.rotation = (elapsedMs / 1000) * (def.speed * Math.PI / 180)
    }
  }

  // axis-aligned bounding box for overlap tests (sweep approximated by its tip reach box)
  const bounds = () => {
    if (def.type === 'sweep') {
      const r = def.length
      return { x: sprite.x - r, y: sprite.y - r, w: r * 2, h: r * 2 }
    }
    return { x: sprite.x - sprite.width / 2, y: sprite.y - sprite.height / 2, w: sprite.width, h: sprite.height }
  }

  return { def, sprite, update, bounds }
}
