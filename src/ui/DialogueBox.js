import { openOverlay, closeOverlay } from './overlay.js'
import { factionColor } from './helpers.js'

export function openDialogue(def, entry, game, opts = {}) {
  const { questService, planet } = opts
  const offered = (questService && planet)
    ? questService.availableFrom(planet, def.loreId)
    : null

  const panel = document.createElement('div')
  panel.className = 'panel dialogue'
  const hex = '#' + factionColor(def.faction).toString(16).padStart(6, '0')
  const lines = [...def.lines, `「 Lore unlocked: ${entry.title} 」\n${entry.summary}`]
  if (offered) lines.push(`「 New quest available 」\n${offered.title} — ${offered.summary}`)
  let idx = 0

  panel.innerHTML = `
    <h2 style="color:${hex}">${def.name || 'Unknown'}</h2>
    <div class="muted">${def.faction || 'unaligned'}</div>
    <div class="body dialogue-line"></div>
    <button class="dialogue-next">Next ▸</button>
    <div class="close-hint">Esc to close</div>`

  const lineEl = panel.querySelector('.dialogue-line')
  const nextBtn = panel.querySelector('.dialogue-next')
  const onLast = () => idx >= lines.length - 1

  const render = () => {
    lineEl.textContent = lines[idx]
    if (onLast()) nextBtn.textContent = offered ? 'Accept Quest ✦' : 'Close ✕'
    else nextBtn.textContent = 'Next ▸'
  }
  nextBtn.addEventListener('click', () => {
    if (onLast()) {
      if (offered) {
        questService.accept(offered.id)
        import('./DiscoveryToast.js').then(m => m.showToast({ title: `Quest accepted: ${offered.title}` }))
      }
      closeOverlay()
      return
    }
    idx++; render()
  })
  render()
  openOverlay(panel, { game })
}
