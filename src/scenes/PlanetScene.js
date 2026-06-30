import Phaser from 'phaser'
import { planetLayouts } from '../data/planetLayouts.js'

export default class PlanetScene extends Phaser.Scene {
  constructor() { super('PlanetScene') }

  init(data) {
    this.planetId = data.planetId
  }

  create() {
    const save = this.registry.get('save')
    const layout = planetLayouts[this.planetId]
    save.setCurrentPlanet(this.planetId)
    save.visitPlanet(this.planetId)

    this.cameras.main.setBackgroundColor(layout.bg)
    this.add.text(40, 30, layout.name.toUpperCase(),
      { fontFamily: 'monospace', fontSize: '26px', color: '#d7dde6' }).setScrollFactor(0)
    this.add.text(40, 64, 'Esc: return to galaxy',
      { fontFamily: 'monospace', fontSize: '13px', color: '#5b6472' }).setScrollFactor(0)

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('GalaxyMapScene'))
  }
}
