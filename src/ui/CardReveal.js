import { openOverlay } from './overlay.js'
import { rarityClass } from './helpers.js'

export function openCardReveal(entry, game) {
  const panel = document.createElement('div')
  panel.className = 'card-stage'
  panel.innerHTML = `
    <div class="card ${rarityClass(entry.rarity)}">
      <div class="card-inner">
        <div class="card-face card-back">★</div>
        <div class="card-face card-front">
          <div class="card-rarity">${entry.rarity}</div>
          <div class="card-title">${entry.title}</div>
          <div class="card-summary">${entry.summary}</div>
          <div class="card-cat">${entry.category}</div>
        </div>
      </div>
    </div>
    <div class="close-hint">Esc to close</div>`
  openOverlay(panel, { game })
  requestAnimationFrame(() => panel.querySelector('.card').classList.add('flipped'))
}
