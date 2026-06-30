import Phaser from 'phaser'

export function createPlayer(scene, x, y) {
  const player = scene.add.triangle(x, y, 0, -12, -10, 10, 10, 10, 0xffffff)
  scene.physics.add.existing(player)
  player.body.setCollideWorldBounds(true)
  // glow ring
  const glow = scene.add.circle(x, y, 16, 0xffffff, 0.12)
  player.glow = glow
  return player
}

export function updatePlayer(player, cursors, wasd, speed = 220) {
  const body = player.body
  let vx = 0, vy = 0
  if (cursors.left.isDown || wasd.left.isDown) vx -= 1
  if (cursors.right.isDown || wasd.right.isDown) vx += 1
  if (cursors.up.isDown || wasd.up.isDown) vy -= 1
  if (cursors.down.isDown || wasd.down.isDown) vy += 1
  const len = Math.hypot(vx, vy) || 1
  body.setVelocity((vx / len) * speed, (vy / len) * speed)
  if (vx !== 0 || vy !== 0) player.rotation = Math.atan2(vy, vx) + Math.PI / 2
  player.glow.setPosition(player.x, player.y)
}
