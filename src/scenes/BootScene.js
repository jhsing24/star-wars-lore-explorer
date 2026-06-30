import Phaser from 'phaser'
import SaveService from '../services/SaveService.js'
import LoreService from '../services/LoreService.js'
import { allLore } from '../data/loreData.js'

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  create() {
    const save = new SaveService()
    save.load()
    const lore = new LoreService({ entries: allLore })

    this.registry.set('save', save)
    this.registry.set('lore', lore)
    this.registry.set('uiOpen', false)

    this.scene.start('GalaxyMapScene')
  }
}
