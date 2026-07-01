import { matchesObjective } from './objectives.js'

export default class QuestService {
  constructor({ quests, save, holoById }) {
    this.quests = quests
    this.byId = new Map(quests.map(q => [q.id, q]))
    this.save = save
    this.holoById = holoById
    this.trackedId = null
    // restore tracked: first active quest, if any
    const active = this.getActive()
    if (active.length) this.trackedId = active[0].id
  }

  _state(id) { return this.save.getQuestState(id) }

  getAvailable() {
    return this.quests.filter(q => {
      const s = this._state(q.id)
      return s === null
    })
  }
  getActive() {
    return this.quests.filter(q => this._state(q.id)?.status === 'active')
  }
  getCompleted() {
    return this.quests.filter(q => this._state(q.id)?.status === 'completed')
  }

  availableFrom(planet, npcLoreId) {
    return this.getAvailable().find(q =>
      q.giver.planet === planet && q.giver.npcLoreId === npcLoreId) || null
  }

  accept(id) {
    if (this._state(id) !== null) return
    this.save.setQuestState(id, { status: 'active', step: 0 })
    if (!this.trackedId) this.trackedId = id
    this._settle(id)
  }

  currentStepIndex(id) { return this._state(id)?.step ?? -1 }

  currentObjective(id) {
    const s = this._state(id)
    if (!s || s.status !== 'active') return null
    return this.byId.get(id).steps[s.step].objective
  }

  // auto-advance past stateful objectives the player already satisfied
  _settle(id) {
    let guard = 0
    while (guard++ < 50) {
      const obj = this.currentObjective(id)
      if (!obj) return
      const pre =
        (obj.type === 'discover' && this.save.isUnlocked(obj.loreId)) ||
        (obj.type === 'challenge' && this.save.isChallengeCleared(obj.planet, obj.challengeId))
      if (!pre) return
      this._step(id)
    }
  }

  // advance one step; returns { completed, reward? } or null if it completed already
  _step(id) {
    const q = this.byId.get(id)
    const s = this._state(id)
    const next = s.step + 1
    if (next >= q.steps.length) {
      this.save.setQuestState(id, { status: 'completed', step: s.step })
      const holo = this.holoById.get(q.reward.holocronLoreId)
      if (holo) this.save.unlockLore(holo)
      this.save.addMaxHealth(q.reward.maxHealthBonus)
      return { completed: true, reward: q.reward }
    }
    this.save.setQuestState(id, { status: 'active', step: next })
    return { completed: false }
  }

  advance(event) {
    const results = []
    for (const q of this.getActive()) {
      const obj = this.currentObjective(q.id)
      if (obj && matchesObjective(obj, event)) {
        const r = this._step(q.id)
        if (!r.completed) this._settle(q.id)
        results.push({ questId: q.id, completed: r.completed, ...(r.reward ? { reward: r.reward } : {}) })
      }
    }
    return results
  }

  track(id) { if (this.byId.has(id)) this.trackedId = id }
  getTrackedId() { return this.trackedId }
  trackedQuest() { return this.trackedId ? this.byId.get(this.trackedId) : null }
  trackedObjective() {
    return this.trackedId ? this.currentObjective(this.trackedId) : null
  }
  trackedHint() {
    if (!this.trackedId) return null
    const s = this._state(this.trackedId)
    if (!s || s.status !== 'active') return null
    return this.byId.get(this.trackedId).steps[s.step].hint
  }
}
