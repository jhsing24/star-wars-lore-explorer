import { openOverlay } from './overlay.js'

export function openTerminal(entry, loreService, game) {
  const panel = document.createElement('div')
  panel.className = 'panel terminal'
  panel.innerHTML = `
    <div class="scanlines"></div>
    <h2>// ${entry.title.toUpperCase()}</h2>
    <div class="muted">HOLONET ARCHIVE · ${entry.category.toUpperCase()}</div>
    <div class="body terminal-text"></div>
    <div class="close-hint">Esc to close</div>`
  openOverlay(panel, { game })

  const target = panel.querySelector('.terminal-text')
  typewriter(target, entry.summary, async () => {
    const extended = await loreService.enrich(entry.id)
    if (extended) {
      const more = document.createElement('div')
      more.style.marginTop = '12px'
      target.appendChild(more)
      typewriter(more, '\n> ARCHIVE EXPANDED:\n' + extended)
    }
  })
}

function typewriter(el, text, onDone, speed = 12) {
  let i = 0
  const span = document.createElement('span')
  el.appendChild(span)
  const timer = setInterval(() => {
    span.textContent += text[i] ?? ''
    i++
    if (i >= text.length) { clearInterval(timer); if (onDone) onDone() }
  }, speed)
}
