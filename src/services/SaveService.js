const SAVE_KEY = 'swle_save'

function freshState() {
  return {
    currentPlanet: null,
    visitedPlanets: [],
    unlockedLore: [],
    cardCollection: [],
    planetProgress: {}
  }
}

export default class SaveService {
  constructor(storage = localStorage, key = SAVE_KEY) {
    this.storage = storage
    this.key = key
    this._state = freshState()
  }

  get state() { return structuredClone(this._state) }

  load() {
    const raw = this.storage.getItem(this.key)
    if (raw) {
      try {
        this._state = { ...freshState(), ...JSON.parse(raw) }
      } catch {
        this._state = freshState()
      }
    } else {
      this._state = freshState()
    }
    return this._state
  }

  persist() {
    this.storage.setItem(this.key, JSON.stringify(this._state))
  }

  reset() {
    this._state = freshState()
    this.persist()
  }

  isUnlocked(id) {
    return this._state.unlockedLore.includes(id)
  }

  unlockLore(entry) {
    if (this.isUnlocked(entry.id)) return false
    this._state.unlockedLore.push(entry.id)
    if (entry.unlock_condition?.trigger === 'artifact') {
      this._state.cardCollection.push({
        id: entry.id,
        rarity: entry.rarity,
        unlockedAt: Date.now()
      })
    }
    this.persist()
    return true
  }

  setCurrentPlanet(planetId) {
    this._state.currentPlanet = planetId
    this.persist()
  }

  visitPlanet(planetId) {
    if (!this._state.visitedPlanets.includes(planetId)) {
      this._state.visitedPlanets.push(planetId)
      this.persist()
    }
  }

  setPlanetProgress(planetId, found, total) {
    this._state.planetProgress[planetId] = { found, total }
    this.persist()
  }

  getPlanetProgress(planetId) {
    return { ...(this._state.planetProgress[planetId] ?? { found: 0, total: 0 }) }
  }

  totalUnlocked() {
    return this._state.unlockedLore.length
  }
}
