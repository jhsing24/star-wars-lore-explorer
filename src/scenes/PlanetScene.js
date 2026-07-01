import Phaser from 'phaser'
import { planetLayouts } from '../data/planetLayouts.js'
import { factionColor } from '../ui/helpers.js'
import { createPlayer, updatePlayer } from '../objects/Player.js'
import { createInteractable } from '../objects/Interactable.js'
import { nearestInteractable } from '../game/interaction.js'
import Health from '../challenge/health.js'
import ChallengeController from '../challenge/ChallengeController.js'
import { createHealthBar } from '../ui/HealthBar.js'
import { createObjectiveTracker } from '../ui/ObjectiveTracker.js'

export default class PlanetScene extends Phaser.Scene {
  constructor() { super('PlanetScene') }

  init(data) { this.planetId = data.planetId }

  _factionTint(faction) { return factionColor(faction) }

  create() {
    const save = this.registry.get('save')
    const layout = planetLayouts[this.planetId]
    this.layout = layout
    save.setCurrentPlanet(this.planetId)
    save.visitPlanet(this.planetId)

    const { width, height } = layout.size
    this.cameras.main.setBackgroundColor(layout.bg)
    this.physics.world.setBounds(0, 0, width, height)
    this.cameras.main.setBounds(0, 0, width, height)

    // floor texture: scattered structure blocks for visual texture
    const g = this.add.graphics()
    g.fillStyle(layout.palette.floor, 1).fillRect(0, 0, width, height)
    g.fillStyle(layout.palette.structure, 0.4)
    for (let i = 0; i < 40; i++) {
      const bx = Phaser.Math.Between(0, width - 80)
      const by = Phaser.Math.Between(0, height - 80)
      g.fillRect(bx, by, Phaser.Math.Between(30, 90), Phaser.Math.Between(30, 90))
    }

    // landmark zones (rectangles)
    this.landmarkZones = layout.landmarks.map((lm) => {
      const rect = this.add.rectangle(lm.x + lm.w / 2, lm.y + lm.h / 2, lm.w, lm.h, layout.palette.accent, 0.18)
      rect.setStrokeStyle(2, layout.palette.accent, 0.6)
      this.add.text(lm.x + 6, lm.y + 6, lm.name, { fontFamily: 'monospace', fontSize: '13px', color: '#d7dde6' })
      return { def: lm, rect }
    })
    this._enteredLandmarks = new Set()

    // point interactables
    this.interactables = layout.interactables.map((def) => createInteractable(this, def))

    // player
    this.player = createPlayer(this, layout.spawn.x, layout.spawn.y)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    // input
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' })

    // HUD (fixed)
    this.add.text(40, 30, layout.name.toUpperCase(),
      { fontFamily: 'monospace', fontSize: '26px', color: '#d7dde6' }).setScrollFactor(0)
    this.add.text(40, 64, 'WASD/Arrows: move   E: interact   C: codex   J: quests   Esc: galaxy',
      { fontFamily: 'monospace', fontSize: '13px', color: '#5b6472' }).setScrollFactor(0)

    this.input.keyboard.on('keydown-ESC', () => {
      if (this.registry.get('uiOpen')) return
      this.scene.start('GalaxyMapScene')
    })

    this._interaction = { nearestInteractable }
    this.promptText = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '13px', color: '#c8a24a' })
      .setOrigin(0.5).setDepth(50)
    this.input.keyboard.on('keydown-E', () => this.tryInteract())
    this.input.keyboard.on('keydown-C', () => {
      if (this.registry.get('uiOpen')) return
      import('../ui/Codex.js').then(m =>
        m.openCodex(this.registry.get('lore'), this.registry.get('save'), this.game))
    })

    this._refreshProgress()

    // --- quests & challenges ---
    this.quests = this.registry.get('quests')
    this.health = new Health(this.registry.get('save').getMaxHealth())
    this.healthBar = createHealthBar(this)
    this.objectiveTracker = createObjectiveTracker(this)

    // build challenge controllers for this planet
    this.challengeZones = []
    const challenges = layout.challenges || {}
    for (const [cid, def] of Object.entries(challenges)) {
      def._id = cid
      // visual zone outline
      const r = this.add.rectangle(def.bounds.x + def.bounds.w / 2, def.bounds.y + def.bounds.h / 2,
        def.bounds.w, def.bounds.h, 0xd9534a, 0.06).setStrokeStyle(1, 0xd9534a, 0.4)
      this.add.text(def.bounds.x + 6, def.bounds.y + 6, def.name,
        { fontFamily: 'monospace', fontSize: '12px', color: '#d9534a' })
      const controller = new ChallengeController(this, this.planetId, def, {
        save: this.registry.get('save'),
        onClear: (clearedId) => this._reportEvent({ type: 'challenge', planet: this.planetId, challengeId: clearedId })
      })
      this.challengeZones.push({ cid, def, controller, rect: r })
    }

    // objective marker (pulsing ring) for an on-this-planet tracked target
    this.objectiveMarker = this.add.circle(0, 0, 22, 0xc8a24a, 0).setStrokeStyle(2, 0xc8a24a, 0.9).setDepth(40).setVisible(false)
    this.tweens.add({ targets: this.objectiveMarker, scale: 1.4, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 })

    this._updateObjectiveUI()

    this.input.keyboard.on('keydown-J', () => {
      if (this.registry.get('uiOpen')) return
      import('../ui/QuestLog.js').then(m => m.openQuestLog(this.quests, this.game))
    })
  }

  update(time) {
    if (this.registry.get('uiOpen')) {
      this.player.body.setVelocity(0, 0)
      return
    }
    updatePlayer(this.player, this.cursors, this.wasd)

    // challenge arm/disarm + update
    const px = this.player.x, py = this.player.y
    for (const z of this.challengeZones) {
      const b = z.def.bounds
      const inside = px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h
      const cleared = this.registry.get('save').isChallengeCleared(this.planetId, z.cid)
      if (inside && !z.controller.armed && !cleared) {
        z.controller.arm(this.player, this.health, this.healthBar)
      } else if (!inside && z.controller.armed) {
        z.controller.disarm()
      }
    }
    const active = this._activeChallenge()
    if (active) active.controller.update(time)

    // proximity prompt (skip while a challenge is armed to keep focus)
    const near = nearestInteractable({ x: px, y: py }, this.interactables, 70)
    if (near && !active) {
      this.promptText.setText('Press E').setPosition(near.x, near.y - 28).setVisible(true)
    } else {
      this.promptText.setVisible(false)
    }

    // landmark entry (auto-unlock + enter event)
    for (const zone of this.landmarkZones) {
      const lm = zone.def
      const inLm = px >= lm.x && px <= lm.x + lm.w && py >= lm.y && py <= lm.y + lm.h
      if (inLm && !this._enteredLandmarks.has(lm.id)) {
        this._enteredLandmarks.add(lm.id)
        const save = this.registry.get('save')
        const entry = this.registry.get('lore').getEntry(lm.loreId)
        if (save.unlockLore(entry)) {
          this._refreshProgress()
          import('../ui/DiscoveryToast.js').then(m => m.showToast(entry))
          this._reportEvent({ type: 'discover', loreId: entry.id })
        }
        this._reportEvent({ type: 'enter', planet: this.planetId, landmarkId: lm.id })
      }
    }
  }

  tryInteract() {
    if (this.registry.get('uiOpen')) return
    const { nearestInteractable } = this._interaction
    const near = nearestInteractable({ x: this.player.x, y: this.player.y }, this.interactables, 70)
    if (!near) return
    const save = this.registry.get('save')
    const lore = this.registry.get('lore')
    const entry = lore.getEntry(near.def.loreId)
    const isNew = save.unlockLore(entry)
    if (isNew) {
      this._refreshProgress()
      import('./../ui/DiscoveryToast.js').then(m => m.showToast(entry))
      this._reportEvent({ type: 'discover', loreId: entry.id })
    }
    if (near.def.type === 'npc') {
      this._reportEvent({ type: 'talk', planet: this.planetId, npcLoreId: near.def.loreId })
    }
    this.promptText.setVisible(false)
    this.dispatchInteraction(near, entry)
  }

  dispatchInteraction(near, entry) {
    const type = near.def.type
    if (type === 'artifact') {
      import('../ui/CardReveal.js').then(m => m.openCardReveal(entry, this.game))
    } else if (type === 'terminal') {
      import('../ui/Terminal.js').then(m => m.openTerminal(entry, this.registry.get('lore'), this.game))
    } else if (type === 'npc') {
      import('../ui/DialogueBox.js').then(m => m.openDialogue(near.def, entry, this.game,
        { questService: this.quests, planet: this.planetId }))
    }
  }

  _refreshProgress() {
    const save = this.registry.get('save')
    const total = this.layout.landmarks.length + this.layout.interactables.length
    const found = this._countFound()
    save.setPlanetProgress(this.planetId, found, total)
  }

  _countFound() {
    const save = this.registry.get('save')
    const ids = [
      ...this.layout.landmarks.map(l => l.loreId),
      ...this.layout.interactables.map(i => i.loreId)
    ]
    return ids.filter(id => save.isUnlocked(id)).length
  }

  _reportEvent(event) {
    const results = this.quests.advance(event)
    for (const res of results) {
      import('../ui/DiscoveryToast.js').then(m => m.showToast({ title: res.completed ? 'Quest complete' : 'Objective complete' }))
      if (res.completed && res.reward) {
        const holo = this.registry.get('lore').getEntry(res.reward.holocronLoreId)
        if (holo) import('../ui/CardReveal.js').then(m => m.openCardReveal(holo, this.game))
        // refresh local max health ceiling for any subsequent challenge
        this.health.setMax(this.registry.get('save').getMaxHealth())
      }
    }
    this._updateObjectiveUI()
  }

  _updateObjectiveUI() {
    const hint = this.quests.trackedHint()
    this.objectiveTracker.set(hint)
    // place the pulsing marker if the tracked objective targets something on THIS planet
    const obj = this.quests.trackedObjective()
    const pos = obj ? this._objectiveTargetPos(obj) : null
    if (pos) this.objectiveMarker.setPosition(pos.x, pos.y).setVisible(true)
    else this.objectiveMarker.setVisible(false)
  }

  _objectiveTargetPos(obj) {
    if (obj.type === 'talk' && obj.planet === this.planetId) {
      const it = this.layout.interactables.find(i => i.type === 'npc' && i.loreId === obj.npcLoreId)
      return it ? { x: it.x, y: it.y } : null
    }
    if (obj.type === 'enter' && obj.planet === this.planetId) {
      const lm = this.layout.landmarks.find(l => l.id === obj.landmarkId)
      return lm ? { x: lm.x + lm.w / 2, y: lm.y + lm.h / 2 } : null
    }
    if (obj.type === 'challenge' && obj.planet === this.planetId) {
      const c = (this.layout.challenges || {})[obj.challengeId]
      return c ? { x: c.bounds.x + c.bounds.w / 2, y: c.bounds.y + c.bounds.h / 2 } : null
    }
    return null
  }

  _activeChallenge() {
    return this.challengeZones.find(z => z.controller.armed) || null
  }
}
