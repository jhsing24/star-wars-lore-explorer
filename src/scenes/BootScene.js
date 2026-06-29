import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }
  create() {
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Star Wars Lore Explorer', {
      fontFamily: 'monospace', fontSize: '24px', color: '#9aa0a6'
    }).setOrigin(0.5)
  }
}
