import Phaser from 'phaser'
import SaveService from '../services/SaveService.js'
import LoreService from '../services/LoreService.js'
import QuestService from '../quests/QuestService.js'
import { allLore, indexById } from '../data/loreData.js'
import { getQuests } from '../data/quests.js'

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  create() {
    const save = new SaveService()
    save.load()
    const lore = new LoreService({ entries: allLore })

    const byId = indexById(allLore)
    const holoById = new Map(
      allLore.filter(e => e.category === 'holocrons').map(e => [e.id, e])
    )
    const quests = new QuestService({ quests: getQuests(), save, holoById })

    this.registry.set('save', save)
    this.registry.set('lore', lore)
    this.registry.set('quests', quests)
    this.registry.set('uiOpen', false)

    this.scene.start('GalaxyMapScene')
  }
}
