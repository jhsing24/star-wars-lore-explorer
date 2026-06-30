let current = null
let currentGame = null

export function openOverlay(node, { game, onClose } = {}) {
  closeOverlay()
  const root = document.getElementById('overlay-root')
  const backdrop = document.createElement('div')
  backdrop.className = 'overlay-backdrop'
  backdrop.appendChild(node)
  root.appendChild(backdrop)
  current = backdrop
  currentGame = game
  current._onClose = onClose
  if (game) game.registry.set('uiOpen', true)

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      closeOverlay()
    }
  }
  backdrop._escHandler = escHandler
  document.addEventListener('keydown', escHandler)
  return node
}

export function closeOverlay() {
  if (!current) return
  document.removeEventListener('keydown', current._escHandler)
  const onClose = current._onClose
  current.remove()
  if (currentGame) currentGame.registry.set('uiOpen', false)
  current = null
  currentGame = null
  if (onClose) onClose()
}
