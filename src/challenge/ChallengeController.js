import { createHazard } from '../objects/Hazard.js'

const IFRAME_MS = 1000

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
function pointBox(px, py, b, pad = 10) {
  return px >= b.x - pad && px <= b.x + b.w + pad && py >= b.y - pad && py <= b.y + b.h + pad
}

export default class ChallengeController {
  constructor(scene, planetId, def, { save, onClear }) {
    this.scene = scene
    this.planetId = planetId
    this.def = def
    this.save = save
    this.onClear = onClear
    this._armed = false
    this.hazards = []
    this.goalRect = null
    this.invulnUntil = 0
    this.elapsed = 0
  }

  get armed() { return this._armed }

  arm(player, health, healthBar) {
    if (this._armed) return
    this._armed = true
    this.player = player
    this.health = health
    this.healthBar = healthBar
    this.elapsed = 0
    this.invulnUntil = 0
    health.restore()
    // visual goal marker
    const g = this.def.goal
    this.goalRect = this.scene.add.rectangle(g.x + g.w / 2, g.y + g.h / 2, g.w, g.h, 0x6fcf97, 0.35)
      .setStrokeStyle(2, 0x6fcf97).setDepth(15)
    this.hazards = (this.def.hazards || []).map(h => createHazard(this.scene, h))
    healthBar.set(health.current, health.max)
    healthBar.show()
  }

  disarm() {
    if (!this._armed) return
    this._armed = false
    this.hazards.forEach(h => h.sprite.destroy())
    this.hazards = []
    if (this.goalRect) { this.goalRect.destroy(); this.goalRect = null }
    if (this.healthBar) this.healthBar.hide()
  }

  update(time) {
    if (!this._armed) return
    this.elapsed += this.scene.game.loop.delta
    this.hazards.forEach(h => h.update(this.elapsed))

    const pb = { x: this.player.x - 12, y: this.player.y - 12, w: 24, h: 24 }

    // hazard contact
    if (time >= this.invulnUntil) {
      for (const h of this.hazards) {
        if (aabb(pb, h.bounds())) {
          this.health.damage(h.def.damage)
          this.healthBar.set(this.health.current, this.health.max)
          this.invulnUntil = time + IFRAME_MS
          // knockback away from hazard centre
          const hb = h.bounds()
          const dx = this.player.x - (hb.x + hb.w / 2)
          const dy = this.player.y - (hb.y + hb.h / 2)
          const len = Math.hypot(dx, dy) || 1
          this.player.x += (dx / len) * 60
          this.player.y += (dy / len) * 60
          if (this.health.isDead()) this._respawn()
          break
        }
      }
    }

    // goal
    if (pointBox(this.player.x, this.player.y, this.def.goal, 0)) {
      this._clear()
    }
  }

  _respawn() {
    this.player.setPosition(this.def.checkpoint.x, this.def.checkpoint.y)
    this.player.body.setVelocity(0, 0)
    this.health.restore()
    this.healthBar.set(this.health.current, this.health.max)
    this.invulnUntil = this.scene.time.now + IFRAME_MS
  }

  _clear() {
    this.save.clearChallenge(this.planetId, this._challengeId())
    this.disarm()
    if (this.onClear) this.onClear(this._challengeId())
  }

  _challengeId() {
    // def is referenced by id in PlanetScene; store it on def for convenience
    return this.def._id
  }
}
