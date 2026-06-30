const SAVE_KEY = 'swle_save'

function freshState() {
  return {
    currentPlanet: null,
    visitedPlanets: [],
    unlockedLore: [],
    cardCollection: [],
    planetProgress: {},
    quests: {},
    maxHealth: 100,
    clearedChallenges: []
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

  getQuestState(id) {
    return this._state.quests[id] ?? null
  }

  setQuestState(id, state) {
    this._state.quests[id] = state
    this.persist()
  }

  allQuestStates() {
    return { ...this._state.quests }
  }

  getMaxHealth() {
    return this._state.maxHealth ?? 100
  }

  addMaxHealth(n) {
    this._state.maxHealth = this.getMaxHealth() + n
    this.persist()
  }

  _challengeKey(planetId, challengeId) {
    return `${planetId}:${challengeId}`
  }

  isChallengeCleared(planetId, challengeId) {
    return this._state.clearedChallenges.includes(this._challengeKey(planetId, challengeId))
  }

  clearChallenge(planetId, challengeId) {
    const key = this._challengeKey(planetId, challengeId)
    if (!this._state.clearedChallenges.includes(key)) {
      this._state.clearedChallenges.push(key)
      this.persist()
    }
  }
}
