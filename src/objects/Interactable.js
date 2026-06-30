import Phaser from 'phaser'

const STYLE = {
  npc: { color: 0x6fcf97, build: (s, x, y, c) => s.add.circle(x, y, 12, c) },
  terminal: { color: 0x4a90d9, build: (s, x, y, c) => s.add.rectangle(x, y, 22, 28, c) },
  artifact: { color: 0xc8a24a, build: (s, x, y, c) => s.add.star(x, y, 5, 6, 12, c) }
}

export function createInteractable(scene, def) {
  const style = STYLE[def.type]
  const color = def.type === 'npc' ? scene._factionTint(def.faction) : style.color
  const sprite = style.build(scene, def.x, def.y, color)
  scene.tweens.add({ targets: sprite, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 })
  return { def, x: def.x, y: def.y, sprite }
}
