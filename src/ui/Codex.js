import { openOverlay, closeOverlay } from './overlay.js'
import { groupByCategory } from './helpers.js'

const CATEGORY_LABELS = {
  planets: 'Planets', factions: 'Factions', characters: 'Characters',
  events: 'Events', species: 'Species'
}

export function openCodex(loreService, save, game) {
  const unlocked = loreService.getAllEntries().filter(e => save.isUnlocked(e.id))
  const panel = document.createElement('div')
  panel.className = 'panel codex'

  const total = loreService.getAllEntries().length
  panel.innerHTML = `
    <h2>Codex</h2>
    <div class="muted">${unlocked.length} / ${total} entries discovered</div>
    <div class="codex-body"></div>
    <div class="close-hint">Esc to close</div>`

  const body = panel.querySelector('.codex-body')

  if (unlocked.length === 0) {
    body.innerHTML = '<div class="muted" style="margin-top:16px">No lore discovered yet. Explore the galaxy.</div>'
  } else {
    const grouped = groupByCategory(unlocked)
    for (const [cat, entries] of Object.entries(grouped)) {
      const section = document.createElement('div')
      section.className = 'codex-section'
      section.innerHTML = `<h3>${CATEGORY_LABELS[cat]}</h3>`
      for (const entry of entries) {
        section.appendChild(buildEntry(entry, loreService))
      }
      body.appendChild(section)
    }
  }

  openOverlay(panel, { game, onClose: () => {} })
}

function buildEntry(entry, loreService) {
  const wrap = document.createElement('div')
  wrap.className = 'codex-entry'
  wrap.innerHTML = `
    <button class="codex-title">${entry.title} <span class="rarity ${entry.rarity}">${entry.rarity}</span></button>
    <div class="codex-detail" hidden>
      <div class="tabs">
        <button class="tab active" data-tab="summary">Summary</button>
        <button class="tab" data-tab="extended">Extended</button>
      </div>
      <div class="tab-panel" data-panel="summary">${entry.summary}</div>
      <div class="tab-panel" data-panel="extended" hidden>
        <span class="muted">Loading from Wookieepedia…</span>
      </div>
    </div>`

  const titleBtn = wrap.querySelector('.codex-title')
  const detail = wrap.querySelector('.codex-detail')
  titleBtn.addEventListener('click', () => { detail.hidden = !detail.hidden })

  const tabs = wrap.querySelectorAll('.tab')
  let enriched = false
  tabs.forEach(tab => tab.addEventListener('click', async () => {
    tabs.forEach(t => t.classList.toggle('active', t === tab))
    wrap.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.dataset.panel !== tab.dataset.tab })
    if (tab.dataset.tab === 'extended' && !enriched) {
      enriched = true
      const panel = wrap.querySelector('[data-panel="extended"]')
      const text = await loreService.enrich(entry.id)
      panel.innerHTML = text
        ? text
        : '<span class="muted">Extended lore unavailable offline. Reconnect and revisit.</span>'
    }
  }))
  return wrap
}
