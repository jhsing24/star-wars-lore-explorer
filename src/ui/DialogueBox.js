import { openOverlay, closeOverlay } from './overlay.js'
import { factionColor } from './helpers.js'

export function openDialogue(def, entry, game) {
  const panel = document.createElement('div')
  panel.className = 'panel dialogue'
  const hex = '#' + factionColor(def.faction).toString(16).padStart(6, '0')
  const lines = [...def.lines, `「 Lore unlocked: ${entry.title} 」\n${entry.summary}`]
  let idx = 0

  panel.innerHTML = `
    <h2 style="color:${hex}">${def.name || 'Unknown'}</h2>
    <div class="muted">${def.faction || 'unaligned'}</div>
    <div class="body dialogue-line"></div>
    <button class="dialogue-next">Next ▸</button>
    <div class="close-hint">Esc to close</div>`

  const lineEl = panel.querySelector('.dialogue-line')
  const nextBtn = panel.querySelector('.dialogue-next')

  const render = () => {
    lineEl.textContent = lines[idx]
    nextBtn.textContent = idx >= lines.length - 1 ? 'Close ✕' : 'Next ▸'
  }
  nextBtn.addEventListener('click', () => {
    if (idx >= lines.length - 1) { closeOverlay(); return }
    idx++; render()
  })
  render()
  openOverlay(panel, { game })
}
