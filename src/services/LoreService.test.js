import { describe, it, expect, beforeEach } from 'vitest'
import LoreService, { buildExtractUrl, parseExtract, stripHtml } from './LoreService.js'
import { createMemoryStorage } from '../../test/helpers/memoryStorage.js'

const entries = [
  { id: 'planet_coruscant', title: 'Coruscant', category: 'planets', wookieepedia_slug: 'Coruscant',
    rarity: 'legendary', unlock_condition: { planet: 'coruscant', trigger: 'landmark' } },
  { id: 'char_palpatine', title: 'Sheev Palpatine', category: 'characters', wookieepedia_slug: 'Palpatine',
    rarity: 'legendary', unlock_condition: { planet: 'coruscant', trigger: 'npc_dialogue' } },
  { id: 'planet_naboo', title: 'Naboo', category: 'planets', wookieepedia_slug: 'Naboo',
    rarity: 'rare', unlock_condition: { planet: 'naboo', trigger: 'landmark' } }
]

describe('pure helpers', () => {
  it('buildExtractUrl encodes the slug and requests intro extracts', () => {
    const url = buildExtractUrl('Sheev Palpatine')
    expect(url).toContain('Sheev%20Palpatine')
    expect(url).toContain('prop=extracts')
    expect(url).toContain('exintro')
    expect(url).toContain('origin=*')
  })
  it('parseExtract pulls the extract from a MediaWiki response', () => {
    const json = { query: { pages: { '123': { extract: '<p>Hello.</p>' } } } }
    expect(parseExtract(json)).toBe('<p>Hello.</p>')
  })
  it('parseExtract returns null when no page/extract', () => {
    expect(parseExtract({ query: { pages: {} } })).toBeNull()
    expect(parseExtract({})).toBeNull()
  })
  it('stripHtml removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello <b>there</b>.</p>\n<p>General Kenobi.</p>'))
      .toBe('Hello there. General Kenobi.')
  })
})

describe('LoreService lookups', () => {
  let svc
  beforeEach(() => { svc = new LoreService({ entries, storage: createMemoryStorage() }) })
  it('gets an entry by id', () => { expect(svc.getEntry('char_palpatine').title).toBe('Sheev Palpatine') })
  it('filters by category', () => { expect(svc.getByCategory('planets')).toHaveLength(2) })
  it('filters by planet', () => {
    expect(svc.getByPlanet('coruscant').map(e => e.id).sort())
      .toEqual(['char_palpatine', 'planet_coruscant'])
  })
})

describe('LoreService.enrich', () => {
  it('fetches, strips, and caches extended lore', async () => {
    let calls = 0
    const fetchFn = async () => {
      calls++
      return { ok: true, json: async () => ({ query: { pages: { '1': { extract: '<p>Capital <i>world</i>.</p>' } } } }) }
    }
    const storage = createMemoryStorage()
    const svc = new LoreService({ entries, fetchFn, storage })
    const text = await svc.enrich('planet_coruscant')
    expect(text).toBe('Capital world.')
    // second call served from cache, no extra fetch
    const again = await svc.enrich('planet_coruscant')
    expect(again).toBe('Capital world.')
    expect(calls).toBe(1)
    expect(storage.getItem('swle_lore_Coruscant')).toBe('Capital world.')
  })

  it('returns null on fetch failure without throwing', async () => {
    const fetchFn = async () => { throw new Error('network down') }
    const svc = new LoreService({ entries, fetchFn, storage: createMemoryStorage() })
    await expect(svc.enrich('planet_naboo')).resolves.toBeNull()
  })

  it('returns null for an unknown id', async () => {
    const svc = new LoreService({ entries, fetchFn: async () => ({}), storage: createMemoryStorage() })
    await expect(svc.enrich('nope')).resolves.toBeNull()
  })
})
