const API_BASE = 'https://starwars.fandom.com/api.php'
const CACHE_PREFIX = 'swle_lore_'

export function buildExtractUrl(slug) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    exintro: 'true',
    redirects: '1',
    titles: slug,
    format: 'json',
    origin: '*'
  })
  return `${API_BASE}?${params.toString().replace(/\+/g, '%20')}`
}

export function parseExtract(json) {
  const pages = json?.query?.pages
  if (!pages || typeof pages !== 'object') return null
  const first = Object.values(pages)[0]
  if (!first || typeof first.extract !== 'string' || first.extract.trim() === '') return null
  return first.extract
}

export function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim()
}

export default class LoreService {
  constructor({ entries, fetchFn = fetch, storage = localStorage, timeoutMs = 5000 }) {
    this.entries = entries
    this.byId = new Map(entries.map(e => [e.id, e]))
    this.fetchFn = fetchFn
    this.storage = storage
    this.timeoutMs = timeoutMs
  }

  getEntry(id) { return this.byId.get(id) }
  getAllEntries() { return this.entries }
  getByCategory(category) { return this.entries.filter(e => e.category === category) }
  getByPlanet(planetId) { return this.entries.filter(e => e.unlock_condition?.planet === planetId) }

  async enrich(id) {
    const entry = this.byId.get(id)
    if (!entry) return null
    const cacheKey = CACHE_PREFIX + entry.wookieepedia_slug
    const cached = this.storage.getItem(cacheKey)
    if (cached !== null) return cached

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      let res
      try {
        res = await this.fetchFn(buildExtractUrl(entry.wookieepedia_slug), { signal: controller.signal })
      } finally {
        clearTimeout(timer)
      }
      if (!res || !res.ok) return null
      const json = await res.json()
      const raw = parseExtract(json)
      if (raw === null) return null
      const text = stripHtml(raw)
      this.storage.setItem(cacheKey, text)
      return text
    } catch {
      return null
    }
  }
}
