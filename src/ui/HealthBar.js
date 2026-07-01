export function createHealthBar(scene) {
  const x = 40, y = 690, w = 240, h = 14
  const bg = scene.add.rectangle(x, y, w, h, 0x1b2230).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100).setVisible(false)
  const fill = scene.add.rectangle(x, y, w, h, 0xd9534a).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101).setVisible(false)
  const label = scene.add.text(x, y - 22, 'HEALTH', { fontFamily: 'monospace', fontSize: '11px', color: '#d9534a' })
    .setScrollFactor(0).setDepth(101).setVisible(false)

  return {
    set(cur, max) { fill.width = w * Math.max(0, Math.min(1, cur / max)) },
    show() { bg.setVisible(true); fill.setVisible(true); label.setVisible(true) },
    hide() { bg.setVisible(false); fill.setVisible(false); label.setVisible(false) },
    destroy() { bg.destroy(); fill.destroy(); label.destroy() }
  }
}
