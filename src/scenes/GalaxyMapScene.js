import Phaser from 'phaser'
import { planetLayouts } from '../data/planetLayouts.js'
import { factionColor } from '../ui/helpers.js'

export default class GalaxyMapScene extends Phaser.Scene {
  constructor() { super('GalaxyMapScene') }

  create() {
    const save = this.registry.get('save')
    this.add.text(40, 30, 'GALAXY MAP', { fontFamily: 'monospace', fontSize: '28px', color: '#c8a24a' })
    this.add.text(40, 66, 'Arrow keys: select system   Enter: travel   C: codex',
      { fontFamily: 'monospace', fontSize: '14px', color: '#5b6472' })

    const lore = this.registry.get('lore')
    const totalLore = lore.getAllEntries().length
    const found = save.totalUnlocked()
    const pct = totalLore ? Math.round((found / totalLore) * 100) : 0

    const barX = 40, barY = 100, barW = 320, barH = 10
    this.add.rectangle(barX, barY, barW, barH, 0x1b2230).setOrigin(0, 0.5)
    this.add.rectangle(barX, barY, barW * (found / Math.max(totalLore, 1)), barH, 0xc8a24a).setOrigin(0, 0.5)
    this.add.text(barX + barW + 12, barY, `${found}/${totalLore} lore (${pct}%)`,
      { fontFamily: 'monospace', fontSize: '12px', color: '#c8a24a' }).setOrigin(0, 0.5)

    const ids = Object.keys(planetLayouts)

    // faint hyperspace lanes between same-faction neighbours
    const laneGfx = this.add.graphics({ lineStyle: { width: 1, color: 0x223044, alpha: 0.5 } })
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = planetLayouts[ids[i]], b = planetLayouts[ids[j]]
        if (a.faction === b.faction) {
          laneGfx.lineBetween(a.galaxyPos.x, a.galaxyPos.y, b.galaxyPos.x, b.galaxyPos.y)
        }
      }
    }

    this.nodes = ids.map((id) => {
      const l = planetLayouts[id]
      const color = factionColor(l.faction)
      const glow = this.add.circle(l.galaxyPos.x, l.galaxyPos.y, 16, color, 0.18)
      const dot = this.add.circle(l.galaxyPos.x, l.galaxyPos.y, 7, color)
      const label = this.add.text(l.galaxyPos.x + 14, l.galaxyPos.y - 8, l.name,
        { fontFamily: 'monospace', fontSize: '13px', color: '#d7dde6' })
      const prog = save.getPlanetProgress(id)
      const progLabel = this.add.text(l.galaxyPos.x + 14, l.galaxyPos.y + 8,
        `${prog.found}/${prog.total || 0}`, { fontFamily: 'monospace', fontSize: '11px', color: '#5b6472' })
      return { id, glow, dot, label, progLabel }
    })

    this.selected = 0
    this.ship = this.add.triangle(0, 0, 0, -10, -7, 8, 7, 8, 0xffffff)
    this.tweens.add({ targets: this.nodes.map(n => n.glow), alpha: 0.4, duration: 1200, yoyo: true, repeat: -1 })
    this.updateSelection()

    this.input.keyboard.on('keydown-RIGHT', () => this.cycle(1))
    this.input.keyboard.on('keydown-LEFT', () => this.cycle(-1))
    this.input.keyboard.on('keydown-DOWN', () => this.cycle(1))
    this.input.keyboard.on('keydown-UP', () => this.cycle(-1))
    this.input.keyboard.on('keydown-ENTER', () => this.travel())
    this.input.keyboard.on('keydown-SPACE', () => this.travel())
    this.input.keyboard.on('keydown-C', () => {
      if (this.registry.get('uiOpen')) return
      import('../ui/Codex.js').then(m =>
        m.openCodex(this.registry.get('lore'), this.registry.get('save'), this.game))
    })
  }

  cycle(dir) {
    if (this.registry.get('uiOpen')) return
    this.selected = (this.selected + dir + this.nodes.length) % this.nodes.length
    this.updateSelection()
  }

  updateSelection() {
    const node = this.nodes[this.selected]
    const l = planetLayouts[node.id]
    this.ship.setPosition(l.galaxyPos.x, l.galaxyPos.y - 24)
  }

  travel() {
    if (this.registry.get('uiOpen')) return
    if (this.traveling) return
    this.traveling = true
    const node = this.nodes[this.selected]
    const l = planetLayouts[node.id]
    this.tweens.add({
      targets: this.ship,
      x: l.galaxyPos.x,
      y: l.galaxyPos.y,
      duration: 500,
      onComplete: () => {
        this.traveling = false
        this.scene.start('PlanetScene', { planetId: node.id })
      }
    })
  }
}
