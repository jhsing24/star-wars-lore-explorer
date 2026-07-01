import { openOverlay, closeOverlay } from './overlay.js'

export function openQuestLog(questService, game) {
  const panel = document.createElement('div')
  panel.className = 'panel questlog'

  const active = questService.getActive()
  const available = questService.getAvailable()
  const completed = questService.getCompleted()

  const stepList = (q) => {
    const cur = questService.currentStepIndex(q.id)
    return q.steps.map((s, i) => {
      const mark = i < cur ? '✓' : (i === cur ? '▸' : '·')
      const cls = i === cur ? 'step-current' : (i < cur ? 'step-done' : 'step-todo')
      return `<div class="${cls}">${mark} ${s.hint}</div>`
    }).join('')
  }

  panel.innerHTML = `
    <h2>Quest Log</h2>
    <div class="muted">${active.length} active · ${available.length} available · ${completed.length} complete</div>
    <div class="ql-body"></div>
    <div class="close-hint">J or Esc to close</div>`
  const body = panel.querySelector('.ql-body')

  if (active.length) {
    const sec = document.createElement('div')
    sec.innerHTML = `<h3>Active</h3>`
    for (const q of active) {
      const item = document.createElement('div')
      item.className = 'ql-quest'
      const tracked = questService.getTrackedId() === q.id
      item.innerHTML = `
        <div class="ql-title">${q.title} ${tracked ? '<span class="tracked">tracked</span>' : ''}</div>
        <div class="muted">${q.summary}</div>
        <div class="ql-steps">${stepList(q)}</div>
        ${tracked ? '' : '<button class="ql-track">Track this</button>'}`
      const btn = item.querySelector('.ql-track')
      if (btn) btn.addEventListener('click', () => { questService.track(q.id); closeOverlay(); openQuestLog(questService, game) })
      sec.appendChild(item)
    }
    body.appendChild(sec)
  }

  if (available.length) {
    const sec = document.createElement('div')
    sec.innerHTML = `<h3>Available</h3>`
    for (const q of available) {
      const item = document.createElement('div')
      item.className = 'ql-quest'
      item.innerHTML = `<div class="ql-title">${q.title}</div>
        <div class="muted">Offered by its giver on ${q.giver.planet}</div>`
      sec.appendChild(item)
    }
    body.appendChild(sec)
  }

  if (completed.length) {
    const sec = document.createElement('div')
    sec.innerHTML = `<h3>Completed</h3>`
    for (const q of completed) {
      const item = document.createElement('div')
      item.className = 'ql-quest'
      item.innerHTML = `<div class="ql-title">✓ ${q.title}</div>`
      sec.appendChild(item)
    }
    body.appendChild(sec)
  }

  if (!active.length && !available.length && !completed.length) {
    body.innerHTML = '<div class="muted" style="margin-top:16px">No quests yet. Talk to notable figures across the galaxy.</div>'
  }

  // J also closes
  const jHandler = (e) => { if (e.key === 'j' || e.key === 'J') { e.preventDefault(); e.stopPropagation(); document.removeEventListener('keydown', jHandler); closeOverlay() } }
  document.addEventListener('keydown', jHandler)

  openOverlay(panel, { game, onClose: () => document.removeEventListener('keydown', jHandler) })
}
