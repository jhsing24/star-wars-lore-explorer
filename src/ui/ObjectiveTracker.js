export function createObjectiveTracker(scene) {
  const text = scene.add.text(scene.scale.width - 40, 30, '', {
    fontFamily: 'monospace', fontSize: '13px', color: '#c8a24a', align: 'right',
    wordWrap: { width: 360 }
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(100)

  return {
    set(hint) { text.setText(hint ? `▸ ${hint}` : '').setVisible(!!hint) },
    hide() { text.setVisible(false) }
  }
}
