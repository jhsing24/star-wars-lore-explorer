export function showToast(entry, ms = 2200) {
  const root = document.getElementById('overlay-root')
  const el = document.createElement('div')
  el.className = 'toast'
  el.textContent = `Lore discovered — ${entry.title}`
  root.appendChild(el)
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s'
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 400)
  }, ms)
}
