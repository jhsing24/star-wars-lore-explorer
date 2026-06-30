import Phaser from 'phaser'
import { planetLayouts } from '../data/planetLayouts.js'
import { factionColor } from '../ui/helpers.js'
import { createPlayer, updatePlayer } from '../objects/Player.js'
import { createInteractable } from '../objects/Interactable.js'

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
    this.add.text(40, 64, 'WASD/Arrows: move   E: interact   C: codex   Esc: galaxy',
      { fontFamily: 'monospace', fontSize: '13px', color: '#5b6472' }).setScrollFactor(0)

    this.input.keyboard.on('keydown-ESC', () => {
      if (this.registry.get('uiOpen')) return
      this.scene.start('GalaxyMapScene')
    })
  }

  update() {
    if (this.registry.get('uiOpen')) {
      this.player.body.setVelocity(0, 0)
      return
    }
    updatePlayer(this.player, this.cursors, this.wasd)
  }
}
