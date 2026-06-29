import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#05070c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene]
}

// eslint-disable-next-line no-new
new Phaser.Game(config)
