# Quests & Traversal Challenges — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add NPC-given investigation-chain quests, advanced by existing interactions plus on-planet traversal challenges with a shared health bar, to the completed Star Wars Lore Explorer.

**Architecture:** New focused modules layer onto the base game. Pure logic (quest state machine, objective matching, health, validation) is unit-tested; Phaser/DOM runtime (challenge controller, hazards, HUD, quest log) is verified by `npm run build` + a Playwright smoke test. `PlanetScene` composes the new systems but stays a coordinator. Quest state, max-health, and cleared-challenges persist through the existing `SaveService`.

**Tech Stack:** JavaScript ES modules, Phaser.js 3, Vite, Vitest + jsdom, Playwright (smoke).

## Global Constraints

- **Language:** JavaScript ES modules only. No TypeScript.
- **Node:** not on the default PATH. Before any npm command run (PowerShell) `$env:Path = "C:\Program Files\nodejs;" + $env:Path`, or (Git Bash) `export PATH="/c/Program Files/nodejs:$PATH"`. Node is 24.18.0. Work from `C:\Users\jyamada\claude_code`.
- **Headless:** subagents cannot open a browser. For runtime tasks, verify with `npm run build` (must succeed; a Phaser ">500 kB chunk" warning is expected and fine) and report that visual verification is deferred. Do NOT block on the dev server.
- **Art:** minimalist geometric only — Phaser shapes + CSS. Hazards are danger-colored (red-orange family, e.g. `0xff4400`, `0xd9534a`).
- **Quests are optional/parallel:** never gate the existing free exploration.
- **Objective types (4):** `talk`, `discover`, `enter`, `challenge`.
- **New trigger value:** `'quest'` (added to `TRIGGERS`). **New lore category:** `'holocrons'` (added to `CATEGORIES`).
- **Default max health:** 100. **Per-chain reward:** holocron lore + `maxHealthBonus` 20.
- **Cleared-challenge key format:** `` `${planetId}:${challengeId}` ``.
- **Backward compatibility:** pre-expansion saves (no `quests`/`maxHealth`/`clearedChallenges`) must load with defaults.
- **Registry keys:** existing `save`/`lore`/`uiOpen`; new `quests` → QuestService.
- **Commit** after every task with Conventional Commit messages.

---

## File Structure

```
src/
  challenge/
    health.js                 # Health model (pure)         [Task 2]
    ChallengeController.js     # Runs a challenge in PlanetScene [Task 10]
  quests/
    QuestService.js           # Quest state machine          [Task 7]
    objectives.js             # Pure objective matching      [Task 6]
  data/
    quests.js                 # 3 chains + getQuests()       [Task 5]
    holocrons.json            # 3 reward lore entries        [Task 4]
    validate.js               # +'quest','holocrons', validateQuests  [Task 3]
    loreData.js               # + holocrons in allLore       [Task 4]
    planetLayouts.js          # + challenges{} on 3 planets  [Task 5]
  objects/
    Hazard.js                 # Hazard factory               [Task 9]
  ui/
    QuestLog.js               # Journal overlay (J)          [Task 13]
    HealthBar.js              # HUD health bar               [Task 11]
    ObjectiveTracker.js       # HUD objective line           [Task 11]
    DialogueBox.js            # + accept-quest beat          [Task 14]
  services/
    SaveService.js            # + quests/maxHealth/clearedChallenges [Task 1]
  scenes/
    BootScene.js              # + QuestService into registry [Task 8]
    PlanetScene.js            # challenge zones, events, markers [Task 12]
    GalaxyMapScene.js         # galaxy markers, J key        [Task 15]
```

---

## Interface Summary (names locked across tasks)

```
// services/SaveService.js  (additions; freshState gains quests:{}, maxHealth:100, clearedChallenges:[])
getQuestState(id): {status, step} | null      // null = never accepted (available)
setQuestState(id, {status, step}): void        // persists
allQuestStates(): { [id]: {status, step} }
getMaxHealth(): number                          // default 100
addMaxHealth(n): void                           // persists
isChallengeCleared(planetId, challengeId): boolean
clearChallenge(planetId, challengeId): void     // persists

// challenge/health.js  (default export)
class Health { constructor(max=100); current; max;
  damage(n); heal(n); setMax(n); restore(); isDead(): boolean; isFull(): boolean }

// data/validate.js
TRIGGERS includes 'quest'; CATEGORIES includes 'holocrons'
validateQuests(quests, byId, layouts): string[]   // [] = valid

// data/quests.js
getQuests(): QuestChain[]     // the 3 chains

// quests/objectives.js
matchesObjective(objective, event): boolean

// quests/QuestService.js
class QuestService {
  constructor({ quests, save, holoById })   // holoById: Map<id, holocronEntry>
  getAvailable(): QuestChain[]
  getActive(): QuestChain[]
  getCompleted(): QuestChain[]
  availableFrom(planet, npcLoreId): QuestChain | null
  accept(id): void
  currentObjective(id): Objective | null     // null if completed
  currentStepIndex(id): number
  track(id): void; getTrackedId(): string|null; trackedQuest(): QuestChain|null
  trackedObjective(): Objective|null; trackedHint(): string|null
  advance(event): Array<{ questId, completed, reward? }>   // matched advances only
}

// objects/Hazard.js
createHazard(scene, def): { def, sprite, update(time), bounds(): {x,y,w,h} }
patrolOffset(elapsedMs, speed, range): number   // pure, exported for test

// challenge/ChallengeController.js
class ChallengeController {
  constructor(scene, planetId, def, { save, onClear })
  arm(player, health, healthBar): void
  update(time): void
  disarm(): void
  get armed(): boolean
}

// ui/HealthBar.js     createHealthBar(scene): { set(cur,max), show(), hide(), destroy() }
// ui/ObjectiveTracker.js  createObjectiveTracker(scene): { set(text), hide() }
// ui/QuestLog.js      openQuestLog(questService, game): void
// ui/DialogueBox.js   openDialogue(def, entry, game, opts?): void   // opts = { questService, planet }
```

---

### Task 1: SaveService — quests, max-health, cleared-challenges

**Files:**
- Modify: `src/services/SaveService.js`
- Test: `src/services/SaveService.test.js` (append)

**Interfaces:**
- Consumes: existing SaveService.
- Produces: the quest/health/challenge persistence methods in the Interface Summary; `freshState` gains `quests:{}`, `maxHealth:100`, `clearedChallenges:[]`.

- [ ] **Step 1: Append failing tests** to `src/services/SaveService.test.js`

```js
describe('SaveService quests/health/challenges', () => {
  let storage, save
  beforeEach(() => { storage = createMemoryStorage(); save = new SaveService(storage); save.load() })

  it('defaults: no quests, maxHealth 100, no cleared challenges', () => {
    expect(save.allQuestStates()).toEqual({})
    expect(save.getQuestState('q1')).toBeNull()
    expect(save.getMaxHealth()).toBe(100)
    expect(save.isChallengeCleared('naboo', 'naboo_palace')).toBe(false)
  })

  it('stores and persists quest state', () => {
    save.setQuestState('q1', { status: 'active', step: 2 })
    expect(save.getQuestState('q1')).toEqual({ status: 'active', step: 2 })
    const reloaded = new SaveService(storage); reloaded.load()
    expect(reloaded.getQuestState('q1')).toEqual({ status: 'active', step: 2 })
  })

  it('raises and persists max health', () => {
    save.addMaxHealth(20)
    expect(save.getMaxHealth()).toBe(120)
    const reloaded = new SaveService(storage); reloaded.load()
    expect(reloaded.getMaxHealth()).toBe(120)
  })

  it('clears and persists challenges', () => {
    save.clearChallenge('naboo', 'naboo_palace')
    expect(save.isChallengeCleared('naboo', 'naboo_palace')).toBe(true)
    expect(save.isChallengeCleared('naboo', 'other')).toBe(false)
    const reloaded = new SaveService(storage); reloaded.load()
    expect(reloaded.isChallengeCleared('naboo', 'naboo_palace')).toBe(true)
  })

  it('loads a pre-expansion save shape with sane defaults (backward compatible)', () => {
    storage.setItem('swle_save', JSON.stringify({ currentPlanet: 'naboo', unlockedLore: ['x'] }))
    const s = new SaveService(storage); s.load()
    expect(s.getMaxHealth()).toBe(100)
    expect(s.allQuestStates()).toEqual({})
    expect(s.isChallengeCleared('naboo', 'naboo_palace')).toBe(false)
    expect(s.isUnlocked('x')).toBe(true)
  })
})
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- SaveService`
Expected: FAIL (`allQuestStates is not a function`).

- [ ] **Step 3: Edit `src/services/SaveService.js`** — update `freshState` and add methods.

Replace `freshState`:
```js
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
```

Add these methods inside the class (e.g. after `totalUnlocked()`):
```js
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
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- SaveService`
Expected: PASS. Then `npm test` — full suite green (was 52; now 52 + 5 = 57... count may differ, confirm all green).

- [ ] **Step 5: Commit**
```bash
git add src/services/SaveService.js src/services/SaveService.test.js
git commit -m "feat: persist quests, max-health, and cleared challenges in SaveService"
```

---

### Task 2: Health model

**Files:**
- Create: `src/challenge/health.js`
- Test: `src/challenge/health.test.js`

**Interfaces:**
- Produces: `Health` (default export) per the Interface Summary. Used by ChallengeController (Task 10) and combat later.

- [ ] **Step 1: Write failing test** — `src/challenge/health.test.js`
```js
import { describe, it, expect } from 'vitest'
import Health from './health.js'

describe('Health', () => {
  it('starts full at the given max (default 100)', () => {
    expect(new Health().current).toBe(100)
    expect(new Health().max).toBe(100)
    expect(new Health(140).current).toBe(140)
  })
  it('damage clamps at 0 and reports death', () => {
    const h = new Health(100)
    h.damage(30); expect(h.current).toBe(70); expect(h.isDead()).toBe(false)
    h.damage(999); expect(h.current).toBe(0); expect(h.isDead()).toBe(true)
  })
  it('heal clamps at max', () => {
    const h = new Health(100); h.damage(50); h.heal(80)
    expect(h.current).toBe(100); expect(h.isFull()).toBe(true)
  })
  it('restore refills to max', () => {
    const h = new Health(100); h.damage(60); h.restore()
    expect(h.current).toBe(100)
  })
  it('setMax raises the ceiling without lowering current', () => {
    const h = new Health(100); h.damage(40) // current 60
    h.setMax(140)
    expect(h.max).toBe(140); expect(h.current).toBe(60)
  })
})
```

- [ ] **Step 2: Run, verify fail** — `npm test -- health` → FAIL (module missing).

- [ ] **Step 3: Write `src/challenge/health.js`**
```js
export default class Health {
  constructor(max = 100) {
    this.max = max
    this.current = max
  }
  damage(n) { this.current = Math.max(0, this.current - n); return this.current }
  heal(n) { this.current = Math.min(this.max, this.current + n); return this.current }
  setMax(n) { this.max = n; if (this.current > n) this.current = n }
  restore() { this.current = this.max }
  isDead() { return this.current <= 0 }
  isFull() { return this.current >= this.max }
}
```

- [ ] **Step 4: Run, verify pass** — `npm test -- health` → PASS (5). Then `npm test` full green.

- [ ] **Step 5: Commit**
```bash
git add src/challenge/health.js src/challenge/health.test.js
git commit -m "feat: add shared Health model"
```

---

### Task 3: validate.js — quest trigger/category + validateQuests

**Files:**
- Modify: `src/data/validate.js`
- Test: `src/data/validate.test.js` (append)

**Interfaces:**
- Consumes: `PLANET_IDS`.
- Produces: `'quest'` in `TRIGGERS`; `'holocrons'` in `CATEGORIES`; `validateQuests(quests, byId, layouts) -> string[]`. Used by Task 4 (holocron schema), Task 5 (content gate).

- [ ] **Step 1: Append failing tests** — `src/data/validate.test.js`
```js
import { validateQuests } from './validate.js'

describe('validateQuests', () => {
  const byId = new Map([
    ['char_padme_amidala', { id: 'char_padme_amidala' }],
    ['char_palpatine', { id: 'char_palpatine' }],
    ['event_invasion_naboo', { id: 'event_invasion_naboo' }],
    ['holo_naboo', { id: 'holo_naboo' }]
  ])
  const layouts = {
    naboo: {
      size: { width: 1600, height: 1200 },
      landmarks: [{ id: 'lm_battle_naboo' }],
      interactables: [{ type: 'npc', loreId: 'char_padme_amidala' }],
      challenges: {
        naboo_palace: {
          bounds: { x: 100, y: 100, w: 400, h: 400 },
          checkpoint: { x: 150, y: 150 },
          goal: { x: 400, y: 400, w: 60, h: 60 },
          hazards: [{ type: 'patrol', x: 200, y: 200, w: 30, h: 30, damage: 20, speed: 100, axis: 'x', range: 200 }]
        }
      }
    },
    coruscant: {
      size: { width: 1600, height: 1200 }, landmarks: [],
      interactables: [{ type: 'npc', loreId: 'char_palpatine' }], challenges: {}
    }
  }
  const good = [{
    id: 'q_naboo', title: 'Shadows over Naboo',
    giver: { planet: 'naboo', npcLoreId: 'char_padme_amidala' },
    summary: 's',
    steps: [
      { id: 's1', hint: 'h', objective: { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' } },
      { id: 's2', hint: 'h', objective: { type: 'discover', loreId: 'event_invasion_naboo' } },
      { id: 's3', hint: 'h', objective: { type: 'challenge', planet: 'naboo', challengeId: 'naboo_palace' } },
      { id: 's4', hint: 'h', objective: { type: 'enter', planet: 'naboo', landmarkId: 'lm_battle_naboo' } }
    ],
    reward: { holocronLoreId: 'holo_naboo', maxHealthBonus: 20 }
  }]

  it('accepts a well-formed quest', () => {
    expect(validateQuests(good, byId, layouts)).toEqual([])
  })
  it('flags a giver NPC not present on its planet', () => {
    const bad = structuredClone(good); bad[0].giver.npcLoreId = 'char_palpatine' // not on naboo
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('giver'))).toBe(true)
  })
  it('flags an unknown objective type', () => {
    const bad = structuredClone(good); bad[0].steps[0].objective.type = 'fly'
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('type'))).toBe(true)
  })
  it('flags a talk NPC not on the named planet', () => {
    const bad = structuredClone(good); bad[0].steps[0].objective.npcLoreId = 'char_padme_amidala' // on naboo not coruscant
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('npc'))).toBe(true)
  })
  it('flags an unknown challenge id', () => {
    const bad = structuredClone(good); bad[0].steps[2].objective.challengeId = 'ghost'
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('challenge'))).toBe(true)
  })
  it('flags a checkpoint outside challenge bounds', () => {
    const bad = structuredClone(layouts); bad.naboo.challenges.naboo_palace.checkpoint = { x: 9000, y: 9000 }
    expect(validateQuests(good, byId, bad).some(e => e.includes('checkpoint'))).toBe(true)
  })
  it('flags a missing reward holocron', () => {
    const bad = structuredClone(good); bad[0].reward.holocronLoreId = 'ghost'
    expect(validateQuests(bad, byId, layouts).some(e => e.includes('holocron'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run, verify fail** — `npm test -- validate` → FAIL.

- [ ] **Step 3: Edit `src/data/validate.js`**

Change the `TRIGGERS` and `CATEGORIES` lines:
```js
export const CATEGORIES = ['planets', 'factions', 'characters', 'events', 'species', 'holocrons']
export const RARITIES = ['common', 'rare', 'legendary']
export const TRIGGERS = ['landmark', 'terminal', 'npc_dialogue', 'artifact', 'quest']
```

Append at end of file:
```js
const OBJECTIVE_TYPES = ['talk', 'discover', 'enter', 'challenge']

function npcLoreIdsOn(layout) {
  return (layout?.interactables || []).filter(i => i.type === 'npc').map(i => i.loreId)
}
function landmarkIdsOn(layout) {
  return (layout?.landmarks || []).map(l => l.id)
}

function validateChallengeGeometry(planetId, cid, c, layout, errs) {
  const within = (px, py) =>
    px >= c.bounds.x && px <= c.bounds.x + c.bounds.w &&
    py >= c.bounds.y && py <= c.bounds.y + c.bounds.h
  if (!c.bounds || !layout?.size) { errs.push(`${planetId}/${cid}: missing bounds/size`); return }
  if (c.bounds.x < 0 || c.bounds.y < 0 ||
      c.bounds.x + c.bounds.w > layout.size.width ||
      c.bounds.y + c.bounds.h > layout.size.height) {
    errs.push(`${planetId}/${cid}: bounds outside planet size`)
  }
  if (!c.checkpoint || !within(c.checkpoint.x, c.checkpoint.y)) {
    errs.push(`${planetId}/${cid}: checkpoint outside bounds`)
  }
  if (!c.goal || !within(c.goal.x, c.goal.y)) {
    errs.push(`${planetId}/${cid}: goal outside bounds`)
  }
  for (const h of (c.hazards || [])) {
    if (!['static', 'patrol', 'sweep'].includes(h.type)) {
      errs.push(`${planetId}/${cid}: invalid hazard type "${h.type}"`)
    }
  }
}

export function validateQuests(quests, byId, layouts) {
  const errs = []
  // every challenge zone referenced or present is geometry-checked
  for (const [planetId, layout] of Object.entries(layouts)) {
    for (const [cid, c] of Object.entries(layout.challenges || {})) {
      validateChallengeGeometry(planetId, cid, c, layout, errs)
    }
  }
  const seen = new Set()
  for (const q of quests) {
    if (typeof q.id !== 'string' || !q.id) errs.push('quest with missing id')
    if (seen.has(q.id)) errs.push(`duplicate quest id "${q.id}"`)
    seen.add(q.id)
    if (typeof q.title !== 'string' || !q.title) errs.push(`${q.id}: missing title`)
    // giver
    const g = q.giver || {}
    if (!PLANET_IDS.includes(g.planet)) errs.push(`${q.id}: giver.planet invalid`)
    else if (!npcLoreIdsOn(layouts[g.planet]).includes(g.npcLoreId)) {
      errs.push(`${q.id}: giver npc "${g.npcLoreId}" not an NPC on ${g.planet}`)
    }
    if (!Array.isArray(q.steps) || q.steps.length === 0) errs.push(`${q.id}: needs steps`)
    for (const step of (q.steps || [])) {
      const o = step.objective || {}
      if (!OBJECTIVE_TYPES.includes(o.type)) { errs.push(`${q.id}/${step.id}: invalid objective type "${o.type}"`); continue }
      if (o.type === 'talk') {
        if (!PLANET_IDS.includes(o.planet)) errs.push(`${q.id}/${step.id}: talk planet invalid`)
        else if (!npcLoreIdsOn(layouts[o.planet]).includes(o.npcLoreId)) errs.push(`${q.id}/${step.id}: talk npc "${o.npcLoreId}" not on ${o.planet}`)
      } else if (o.type === 'discover') {
        if (!byId.has(o.loreId)) errs.push(`${q.id}/${step.id}: discover unknown loreId "${o.loreId}"`)
      } else if (o.type === 'enter') {
        if (!PLANET_IDS.includes(o.planet)) errs.push(`${q.id}/${step.id}: enter planet invalid`)
        else if (!landmarkIdsOn(layouts[o.planet]).includes(o.landmarkId)) errs.push(`${q.id}/${step.id}: enter landmark "${o.landmarkId}" not on ${o.planet}`)
      } else if (o.type === 'challenge') {
        if (!PLANET_IDS.includes(o.planet)) errs.push(`${q.id}/${step.id}: challenge planet invalid`)
        else if (!(layouts[o.planet]?.challenges || {})[o.challengeId]) errs.push(`${q.id}/${step.id}: unknown challenge "${o.challengeId}" on ${o.planet}`)
      }
    }
    const r = q.reward || {}
    if (!byId.has(r.holocronLoreId)) errs.push(`${q.id}: reward holocron "${r.holocronLoreId}" not in lore`)
    if (typeof r.maxHealthBonus !== 'number') errs.push(`${q.id}: reward.maxHealthBonus must be a number`)
  }
  return errs
}
```

- [ ] **Step 4: Run, verify pass** — `npm test -- validate` → PASS. Full `npm test` green.

- [ ] **Step 5: Commit**
```bash
git add src/data/validate.js src/data/validate.test.js
git commit -m "feat: add quest trigger/category and validateQuests"
```

---

### Task 4: Holocrons (reward lore) + loreData wiring

**Files:**
- Create: `src/data/holocrons.json`
- Modify: `src/data/loreData.js`, `src/data/loreData.test.js`, `src/ui/Codex.js` (category label)
- Test: existing `loreData.test.js` (adjust distribution assertion)

**Interfaces:**
- Consumes: `CATEGORIES` (now includes `'holocrons'`).
- Produces: 3 holocron entries in `allLore`; codex shows a "Holocrons" group. Used by Task 5 (reward refs) and Task 7 (reward grant).

- [ ] **Step 1: Create `src/data/holocrons.json`** (real prequel facts; `trigger:'quest'`)
```json
[
  {
    "id": "holo_naboo",
    "title": "The Sith Gambit of Naboo",
    "category": "holocrons",
    "summary": "The Trade Federation's blockade of Naboo was secretly engineered by Darth Sidious to manufacture a crisis. The resulting no-confidence vote toppled Chancellor Valorum and swept Sidious's public persona, Senator Palpatine, into the office of Supreme Chancellor.",
    "wookieepedia_slug": "Darth_Sidious",
    "rarity": "legendary",
    "unlock_condition": { "planet": "naboo", "trigger": "quest" }
  },
  {
    "id": "holo_clones",
    "title": "The Sifo-Dyas Deception",
    "category": "holocrons",
    "summary": "The Grand Army of the Republic was secretly commissioned on Kamino in the name of the Jedi Master Sifo-Dyas, years before the Senate authorized any army. The plot was orchestrated by Darth Tyranus—Count Dooku—on behalf of the Sith.",
    "wookieepedia_slug": "Sifo-Dyas",
    "rarity": "legendary",
    "unlock_condition": { "planet": "kamino", "trigger": "quest" }
  },
  {
    "id": "holo_sith",
    "title": "The Grand Plan of the Sith",
    "category": "holocrons",
    "summary": "A millennium before the Clone Wars, Darth Bane reformed the Sith under the Rule of Two—one master, one apprentice—to work in secret toward revenge against the Jedi. Darth Sidious was the culmination of that long, hidden plan.",
    "wookieepedia_slug": "Rule_of_Two",
    "rarity": "legendary",
    "unlock_condition": { "planet": "mustafar", "trigger": "quest" }
  }
]
```

- [ ] **Step 2: Edit `src/data/loreData.js`** — include holocrons.
```js
import planets from './planets.json'
import factions from './factions.json'
import characters from './characters.json'
import events from './events.json'
import species from './species.json'
import holocrons from './holocrons.json'

export const allLore = [...planets, ...factions, ...characters, ...events, ...species, ...holocrons]

export function indexById(entries) {
  const map = new Map()
  for (const e of entries) map.set(e.id, e)
  return map
}
```

- [ ] **Step 3: Adjust the per-planet distribution test** in `src/data/loreData.test.js` so holocrons (rewards, not placed points) are excluded. Find the test titled `distributes 4..8 entries to every canonical planet` and change its counting loop to skip holocrons:
```js
  it('distributes 4..8 entries to every canonical planet', () => {
    const counts = Object.fromEntries(PLANET_IDS.map(p => [p, 0]))
    for (const e of allLore) {
      if (e.category === 'holocrons') continue
      counts[e.unlock_condition.planet]++
    }
    for (const p of PLANET_IDS) {
      expect(counts[p], `${p} entry count`).toBeGreaterThanOrEqual(4)
      expect(counts[p], `${p} entry count`).toBeLessThanOrEqual(8)
    }
  })
```
Also add a holocron presence test:
```js
  it('includes 3 holocron reward entries', () => {
    expect(allLore.filter(e => e.category === 'holocrons').map(e => e.id).sort())
      .toEqual(['holo_clones', 'holo_naboo', 'holo_sith'])
  })
```

- [ ] **Step 4: Edit `src/ui/Codex.js`** — add the holocrons label so the codex groups them. Find the `CATEGORY_LABELS` object and add the entry:
```js
const CATEGORY_LABELS = {
  planets: 'Planets', factions: 'Factions', characters: 'Characters',
  events: 'Events', species: 'Species', holocrons: 'Holocrons'
}
```

- [ ] **Step 5: Run, verify** — `npm test` (loreData + validate use allLore). Expected: all green; the existing `validateLore(allLore)` test still passes (holocrons are schema-valid: category & trigger now allowed). Then `npm run build` → succeeds.

- [ ] **Step 6: Commit**
```bash
git add src/data/holocrons.json src/data/loreData.js src/data/loreData.test.js src/ui/Codex.js
git commit -m "feat: add holocron reward lore and codex category"
```

---

### Task 5: Quest chains + challenge zones (content gate)

**Files:**
- Create: `src/data/quests.js`
- Modify: `src/data/planetLayouts.js` (add `challenges` to naboo, geonosis, mustafar)
- Test: `src/data/quests.test.js`

**Interfaces:**
- Consumes: `validateQuests`, `allLore`/`indexById`, `planetLayouts`.
- Produces: `getQuests()` (3 chains); `challenges` objects on 3 planets. All references resolve (the test is the gate).

- [ ] **Step 1: Write the gate test** — `src/data/quests.test.js`
```js
import { describe, it, expect } from 'vitest'
import { getQuests } from './quests.js'
import { validateQuests } from './validate.js'
import { planetLayouts } from './planetLayouts.js'
import { allLore, indexById } from './loreData.js'

describe('quest chains', () => {
  it('defines exactly 3 chains', () => {
    expect(getQuests().map(q => q.id).sort())
      .toEqual(['quest_cloners_secret', 'quest_naboo_invasion', 'quest_sith_trail'])
  })
  it('passes validateQuests against real lore + layouts', () => {
    expect(validateQuests(getQuests(), indexById(allLore), planetLayouts)).toEqual([])
  })
  it('each chain has 4..5 steps and a reward', () => {
    for (const q of getQuests()) {
      expect(q.steps.length).toBeGreaterThanOrEqual(4)
      expect(q.steps.length).toBeLessThanOrEqual(5)
      expect(typeof q.reward.holocronLoreId).toBe('string')
      expect(q.reward.maxHealthBonus).toBe(20)
    }
  })
})
```

- [ ] **Step 2: Run, verify fail** — `npm test -- quests` → FAIL.

- [ ] **Step 3: Add `challenges` to three planets in `src/data/planetLayouts.js`.** Inside each planet object (after its `interactables` array, as a sibling key), add:

For `naboo`:
```js
    challenges: {
      naboo_palace: {
        name: 'Royal Palace (Occupied)',
        bounds: { x: 560, y: 420, w: 520, h: 380 },
        checkpoint: { x: 600, y: 760 },
        goal: { x: 980, y: 460, w: 70, h: 70 },
        hazards: [
          { type: 'patrol', x: 700, y: 500, w: 34, h: 34, damage: 18, speed: 130, axis: 'y', range: 240 },
          { type: 'patrol', x: 880, y: 700, w: 34, h: 34, damage: 18, speed: 110, axis: 'x', range: 260 },
          { type: 'sweep',  x: 800, y: 600, length: 220, damage: 30, speed: 70 },
          { type: 'static', x: 760, y: 440, w: 60, h: 60, damage: 10 }
        ]
      }
    }
```

For `geonosis`:
```js
    challenges: {
      geonosis_foundry: {
        name: 'Droid Foundry Line',
        bounds: { x: 540, y: 440, w: 540, h: 360 },
        checkpoint: { x: 580, y: 760 },
        goal: { x: 1000, y: 480, w: 70, h: 70 },
        hazards: [
          { type: 'patrol', x: 720, y: 520, w: 44, h: 44, damage: 22, speed: 160, axis: 'x', range: 300 },
          { type: 'patrol', x: 900, y: 700, w: 44, h: 44, damage: 22, speed: 140, axis: 'y', range: 220 },
          { type: 'static', x: 660, y: 660, w: 80, h: 40, damage: 16 },
          { type: 'static', x: 860, y: 500, w: 40, h: 80, damage: 16 }
        ]
      }
    }
```

For `mustafar`:
```js
    challenges: {
      mustafar_lava: {
        name: 'Lava Field Crossing',
        bounds: { x: 540, y: 440, w: 560, h: 360 },
        checkpoint: { x: 580, y: 760 },
        goal: { x: 1020, y: 480, w: 70, h: 70 },
        hazards: [
          { type: 'static', x: 680, y: 560, w: 90, h: 90, damage: 14 },
          { type: 'static', x: 860, y: 660, w: 90, h: 90, damage: 14 },
          { type: 'sweep',  x: 800, y: 560, length: 260, damage: 34, speed: 60 },
          { type: 'patrol', x: 940, y: 720, w: 34, h: 34, damage: 20, speed: 150, axis: 'y', range: 200 }
        ]
      }
    }
```
(Each `bounds` is within the planet's 1600×1200 size; `checkpoint`/`goal` are inside `bounds`.)

- [ ] **Step 4: Create `src/data/quests.js`** — 3 chains using only existing NPC/lore/landmark ids (verified against `planetLayouts.js`).
```js
const QUESTS = [
  {
    id: 'quest_naboo_invasion',
    title: 'Shadows over Naboo',
    giver: { planet: 'naboo', npcLoreId: 'char_padme_amidala' },
    summary: 'Queen Amidala asks you to uncover who is truly behind the blockade of Naboo.',
    steps: [
      { id: 's1', hint: 'Seek counsel from Chancellor Palpatine on Coruscant',
        objective: { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' } },
      { id: 's2', hint: 'Find evidence of the plot against the Queen on Coruscant',
        objective: { type: 'discover', loreId: 'event_assassination_padme' } },
      { id: 's3', hint: 'Slip through the occupied Royal Palace on Naboo',
        objective: { type: 'challenge', planet: 'naboo', challengeId: 'naboo_palace' } },
      { id: 's4', hint: 'Confront the threat at the Generator Core',
        objective: { type: 'enter', planet: 'naboo', landmarkId: 'lm_battle_naboo' } }
    ],
    reward: { holocronLoreId: 'holo_naboo', maxHealthBonus: 20 }
  },
  {
    id: 'quest_cloners_secret',
    title: "The Cloners' Secret",
    giver: { planet: 'kamino', npcLoreId: 'char_kit_fisto' },
    summary: 'Master Fisto suspects the clone army was not commissioned by the Jedi Council at all.',
    steps: [
      { id: 's1', hint: 'Question Jango Fett, the clone template, on Kamino',
        objective: { type: 'talk', planet: 'kamino', npcLoreId: 'char_jango_fett' } },
      { id: 's2', hint: 'Review the Grand Army records on Kamino',
        objective: { type: 'discover', loreId: 'faction_grand_army_republic' } },
      { id: 's3', hint: 'Cross the Geonosian droid foundry',
        objective: { type: 'challenge', planet: 'geonosis', challengeId: 'geonosis_foundry' } },
      { id: 's4', hint: 'Confront Count Dooku in the Petranaki Arena',
        objective: { type: 'talk', planet: 'geonosis', npcLoreId: 'char_count_dooku' } }
    ],
    reward: { holocronLoreId: 'holo_clones', maxHealthBonus: 20 }
  },
  {
    id: 'quest_sith_trail',
    title: 'The Sith Trail',
    giver: { planet: 'coruscant', npcLoreId: 'char_mace_windu' },
    summary: 'Master Windu senses a Sith hand behind the war and asks you to follow the trail.',
    steps: [
      { id: 's1', hint: 'Press the Chancellor about the Sith threat on Coruscant',
        objective: { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' } },
      { id: 's2', hint: 'Search the Jedi Temple archives',
        objective: { type: 'enter', planet: 'coruscant', landmarkId: 'lm_jedi_order' } },
      { id: 's3', hint: 'Cross the lava fields of Mustafar',
        objective: { type: 'challenge', planet: 'mustafar', challengeId: 'mustafar_lava' } },
      { id: 's4', hint: 'Reach the lava riverside platform',
        objective: { type: 'enter', planet: 'mustafar', landmarkId: 'lm_duel_mustafar' } }
    ],
    reward: { holocronLoreId: 'holo_sith', maxHealthBonus: 20 }
  }
]

export function getQuests() {
  return QUESTS
}
```

- [ ] **Step 5: Run the gate** — `npm test -- quests`. Expected: PASS (3 tests). If `validateQuests` reports an unresolved ref, fix the id against `planetLayouts.js`. Full `npm test` green; `npm run build` succeeds.

- [ ] **Step 6: Commit**
```bash
git add src/data/quests.js src/data/planetLayouts.js src/data/quests.test.js
git commit -m "feat: add 3 investigation chains and challenge zones"
```

---

### Task 6: Objective matching

**Files:**
- Create: `src/quests/objectives.js`
- Test: `src/quests/objectives.test.js`

**Interfaces:**
- Produces: `matchesObjective(objective, event) -> boolean`. Used by QuestService (Task 7).

- [ ] **Step 1: Write failing test** — `src/quests/objectives.test.js`
```js
import { describe, it, expect } from 'vitest'
import { matchesObjective } from './objectives.js'

describe('matchesObjective', () => {
  it('talk matches same planet + npc only', () => {
    const o = { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' }
    expect(matchesObjective(o, { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' })).toBe(true)
    expect(matchesObjective(o, { type: 'talk', planet: 'naboo', npcLoreId: 'char_palpatine' })).toBe(false)
    expect(matchesObjective(o, { type: 'talk', planet: 'coruscant', npcLoreId: 'char_mace_windu' })).toBe(false)
  })
  it('discover matches loreId only', () => {
    const o = { type: 'discover', loreId: 'event_invasion_naboo' }
    expect(matchesObjective(o, { type: 'discover', loreId: 'event_invasion_naboo' })).toBe(true)
    expect(matchesObjective(o, { type: 'discover', loreId: 'other' })).toBe(false)
  })
  it('enter matches planet + landmark', () => {
    const o = { type: 'enter', planet: 'naboo', landmarkId: 'lm_battle_naboo' }
    expect(matchesObjective(o, { type: 'enter', planet: 'naboo', landmarkId: 'lm_battle_naboo' })).toBe(true)
    expect(matchesObjective(o, { type: 'enter', planet: 'naboo', landmarkId: 'lm_other' })).toBe(false)
  })
  it('challenge matches planet + challengeId', () => {
    const o = { type: 'challenge', planet: 'naboo', challengeId: 'naboo_palace' }
    expect(matchesObjective(o, { type: 'challenge', planet: 'naboo', challengeId: 'naboo_palace' })).toBe(true)
    expect(matchesObjective(o, { type: 'challenge', planet: 'mustafar', challengeId: 'naboo_palace' })).toBe(false)
  })
  it('different types never match', () => {
    expect(matchesObjective({ type: 'talk', planet: 'a', npcLoreId: 'b' }, { type: 'discover', loreId: 'b' })).toBe(false)
  })
})
```

- [ ] **Step 2: Run, verify fail** — `npm test -- objectives` → FAIL.

- [ ] **Step 3: Write `src/quests/objectives.js`**
```js
export function matchesObjective(objective, event) {
  if (!objective || !event || objective.type !== event.type) return false
  switch (objective.type) {
    case 'talk':
      return objective.planet === event.planet && objective.npcLoreId === event.npcLoreId
    case 'discover':
      return objective.loreId === event.loreId
    case 'enter':
      return objective.planet === event.planet && objective.landmarkId === event.landmarkId
    case 'challenge':
      return objective.planet === event.planet && objective.challengeId === event.challengeId
    default:
      return false
  }
}
```

- [ ] **Step 4: Run, verify pass** — `npm test -- objectives` → PASS (5). Full green.

- [ ] **Step 5: Commit**
```bash
git add src/quests/objectives.js src/quests/objectives.test.js
git commit -m "feat: add objective matching"
```

---

### Task 7: QuestService

**Files:**
- Create: `src/quests/QuestService.js`
- Test: `src/quests/QuestService.test.js`

**Interfaces:**
- Consumes: `matchesObjective`; a `save` (SaveService API: `getQuestState`/`setQuestState`/`allQuestStates`/`isUnlocked`/`unlockLore`/`isChallengeCleared`/`addMaxHealth`); `holoById` (Map id→entry).
- Produces: `QuestService` per the Interface Summary. Used by BootScene (Task 8) and scenes.

- [ ] **Step 1: Write failing test** — `src/quests/QuestService.test.js`
```js
import { describe, it, expect, beforeEach } from 'vitest'
import QuestService from './QuestService.js'
import SaveService from '../services/SaveService.js'
import { createMemoryStorage } from '../../test/helpers/memoryStorage.js'

const quests = [{
  id: 'q1', title: 'Q1',
  giver: { planet: 'naboo', npcLoreId: 'char_padme' },
  summary: 's',
  steps: [
    { id: 's1', hint: 'h1', objective: { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' } },
    { id: 's2', hint: 'h2', objective: { type: 'discover', loreId: 'lore_x' } },
    { id: 's3', hint: 'h3', objective: { type: 'enter', planet: 'naboo', landmarkId: 'lm_y' } }
  ],
  reward: { holocronLoreId: 'holo_q1', maxHealthBonus: 20 }
}]
const holoById = new Map([['holo_q1', { id: 'holo_q1', rarity: 'legendary', unlock_condition: { trigger: 'quest' } }]])

function make() {
  const save = new SaveService(createMemoryStorage()); save.load()
  return { save, qs: new QuestService({ quests, save, holoById }) }
}

describe('QuestService', () => {
  let save, qs
  beforeEach(() => { ({ save, qs } = make()) })

  it('lists the quest as available, offered by its giver', () => {
    expect(qs.getAvailable().map(q => q.id)).toEqual(['q1'])
    expect(qs.availableFrom('naboo', 'char_padme').id).toBe('q1')
    expect(qs.availableFrom('naboo', 'someone_else')).toBeNull()
  })

  it('accept makes it active at step 0 and tracked', () => {
    qs.accept('q1')
    expect(qs.getActive().map(q => q.id)).toEqual(['q1'])
    expect(qs.currentStepIndex('q1')).toBe(0)
    expect(qs.getTrackedId()).toBe('q1')
    expect(qs.trackedObjective()).toEqual(quests[0].steps[0].objective)
  })

  it('advance only progresses on the matching current objective', () => {
    qs.accept('q1')
    qs.advance({ type: 'discover', loreId: 'lore_x' })      // not current (current is talk)
    expect(qs.currentStepIndex('q1')).toBe(0)
    qs.advance({ type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' })
    expect(qs.currentStepIndex('q1')).toBe(1)
  })

  it('completes on the last step and grants reward once', () => {
    qs.accept('q1')
    qs.advance({ type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' }) // ->1
    qs.advance({ type: 'discover', loreId: 'lore_x' })                              // ->2
    const res = qs.advance({ type: 'enter', planet: 'naboo', landmarkId: 'lm_y' })  // ->complete
    expect(res).toEqual([{ questId: 'q1', completed: true, reward: quests[0].reward }])
    expect(qs.getCompleted().map(q => q.id)).toEqual(['q1'])
    expect(save.isUnlocked('holo_q1')).toBe(true)
    expect(save.getMaxHealth()).toBe(120)
    // re-emitting does not re-grant
    const again = qs.advance({ type: 'enter', planet: 'naboo', landmarkId: 'lm_y' })
    expect(again).toEqual([])
    expect(save.getMaxHealth()).toBe(120)
  })

  it('auto-advances past an already-satisfied discover step (no soft-lock)', () => {
    save.unlockLore({ id: 'lore_x', unlock_condition: { trigger: 'terminal' } }) // pre-discovered
    qs.accept('q1')
    qs.advance({ type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' }) // ->1, which is discover lore_x already done -> auto ->2
    expect(qs.currentStepIndex('q1')).toBe(2)
  })

  it('persists across reload', () => {
    qs.accept('q1')
    qs.advance({ type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' })
    const qs2 = new QuestService({ quests, save, holoById })
    expect(qs2.currentStepIndex('q1')).toBe(1)
    expect(qs2.getActive().map(q => q.id)).toEqual(['q1'])
  })
})
```

- [ ] **Step 2: Run, verify fail** — `npm test -- QuestService` → FAIL.

- [ ] **Step 3: Write `src/quests/QuestService.js`**
```js
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
```

- [ ] **Step 4: Run, verify pass** — `npm test -- QuestService` → PASS (6). Full `npm test` green.

- [ ] **Step 5: Commit**
```bash
git add src/quests/QuestService.js src/quests/QuestService.test.js
git commit -m "feat: add QuestService state machine"
```

---

### Task 8: Wire QuestService into the registry

**Files:**
- Modify: `src/scenes/BootScene.js`

**Interfaces:**
- Consumes: `QuestService`, `getQuests`, `indexById`/`allLore`, `save`.
- Produces: `registry.get('quests')` available to all scenes.

- [ ] **Step 1: Edit `src/scenes/BootScene.js`**
```js
import Phaser from 'phaser'
import SaveService from '../services/SaveService.js'
import LoreService from '../services/LoreService.js'
import QuestService from '../quests/QuestService.js'
import { allLore, indexById } from '../data/loreData.js'
import { getQuests } from '../data/quests.js'

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  create() {
    const save = new SaveService()
    save.load()
    const lore = new LoreService({ entries: allLore })

    const byId = indexById(allLore)
    const holoById = new Map(
      allLore.filter(e => e.category === 'holocrons').map(e => [e.id, e])
    )
    const quests = new QuestService({ quests: getQuests(), save, holoById })

    this.registry.set('save', save)
    this.registry.set('lore', lore)
    this.registry.set('quests', quests)
    this.registry.set('uiOpen', false)

    this.scene.start('GalaxyMapScene')
  }
}
```

- [ ] **Step 2: Verify** — `npm test` green; `npm run build` succeeds.

- [ ] **Step 3: Commit**
```bash
git add src/scenes/BootScene.js
git commit -m "feat: register QuestService in the boot registry"
```

---

### Task 9: Hazard factory

**Files:**
- Create: `src/objects/Hazard.js`
- Test: `src/objects/Hazard.test.js` (pure `patrolOffset` only)

**Interfaces:**
- Produces: `createHazard(scene, def)` and the pure `patrolOffset(elapsedMs, speed, range)`. Used by ChallengeController (Task 10).

- [ ] **Step 1: Write failing test** for the pure motion helper — `src/objects/Hazard.test.js`
```js
import { describe, it, expect } from 'vitest'
import { patrolOffset } from './Hazard.js'

describe('patrolOffset', () => {
  it('is 0 at t=0 and stays within [-range, range]', () => {
    expect(patrolOffset(0, 100, 200)).toBeCloseTo(0, 5)
    for (let t = 0; t < 5000; t += 137) {
      const o = patrolOffset(t, 120, 200)
      expect(o).toBeGreaterThanOrEqual(-200.0001)
      expect(o).toBeLessThanOrEqual(200.0001)
    }
  })
  it('moves in the positive direction initially', () => {
    expect(patrolOffset(100, 100, 200)).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run, verify fail** — `npm test -- Hazard` → FAIL.

- [ ] **Step 3: Write `src/objects/Hazard.js`**
```js
const DANGER = 0xff4400
const DANGER2 = 0xd9534a

// Triangle-wave offset: starts at 0, rises to +range, falls to -range, period derived from speed.
export function patrolOffset(elapsedMs, speed, range) {
  if (range <= 0) return 0
  const period = (4 * range) / speed   // seconds for a full cycle
  const t = (elapsedMs / 1000) % period
  const quarter = period / 4
  if (t < quarter) return speed * t
  if (t < 3 * quarter) return range - speed * (t - quarter)
  return -range + speed * (t - 3 * quarter)
}

export function createHazard(scene, def) {
  let sprite
  if (def.type === 'sweep') {
    sprite = scene.add.rectangle(def.x, def.y, def.length, 10, DANGER).setOrigin(0, 0.5)
  } else {
    sprite = scene.add.rectangle(def.x, def.y, def.w, def.h, def.type === 'static' ? DANGER2 : DANGER)
  }
  sprite.setDepth(20)
  const base = { x: def.x, y: def.y }

  const update = (elapsedMs) => {
    if (def.type === 'patrol') {
      const off = patrolOffset(elapsedMs, def.speed, def.range)
      if (def.axis === 'y') sprite.y = base.y + off
      else sprite.x = base.x + off
    } else if (def.type === 'sweep') {
      sprite.rotation = (elapsedMs / 1000) * (def.speed * Math.PI / 180)
    }
  }

  // axis-aligned bounding box for overlap tests (sweep approximated by its tip reach box)
  const bounds = () => {
    if (def.type === 'sweep') {
      const r = def.length
      return { x: sprite.x - r, y: sprite.y - r, w: r * 2, h: r * 2 }
    }
    return { x: sprite.x - sprite.width / 2, y: sprite.y - sprite.height / 2, w: sprite.width, h: sprite.height }
  }

  return { def, sprite, update, bounds }
}
```
(Note: `sweep` overlap uses a coarse circular reach box — fine for the minimalist feel; the visual is a rotating bar.)

- [ ] **Step 4: Run, verify pass** — `npm test -- Hazard` → PASS (2). Full green. `npm run build` succeeds.

- [ ] **Step 5: Commit**
```bash
git add src/objects/Hazard.js src/objects/Hazard.test.js
git commit -m "feat: add hazard factory with patrol/sweep/static"
```

---

### Task 10: ChallengeController

**Files:**
- Create: `src/challenge/ChallengeController.js`

**Interfaces:**
- Consumes: `createHazard`; `Health`; a `save` (`clearChallenge`); a `healthBar` (Task 11) with `set/show/hide`.
- Produces: `ChallengeController` per the Interface Summary. Used by PlanetScene (Task 12).

- [ ] **Step 1: Write `src/challenge/ChallengeController.js`**
```js
import { createHazard } from '../objects/Hazard.js'

const IFRAME_MS = 1000

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
function pointBox(px, py, b, pad = 10) {
  return px >= b.x - pad && px <= b.x + b.w + pad && py >= b.y - pad && py <= b.y + b.h + pad
}

export default class ChallengeController {
  constructor(scene, planetId, def, { save, onClear }) {
    this.scene = scene
    this.planetId = planetId
    this.def = def
    this.save = save
    this.onClear = onClear
    this._armed = false
    this.hazards = []
    this.goalRect = null
    this.invulnUntil = 0
    this.elapsed = 0
  }

  get armed() { return this._armed }

  arm(player, health, healthBar) {
    if (this._armed) return
    this._armed = true
    this.player = player
    this.health = health
    this.healthBar = healthBar
    this.elapsed = 0
    this.invulnUntil = 0
    health.restore()
    // visual goal marker
    const g = this.def.goal
    this.goalRect = this.scene.add.rectangle(g.x + g.w / 2, g.y + g.h / 2, g.w, g.h, 0x6fcf97, 0.35)
      .setStrokeStyle(2, 0x6fcf97).setDepth(15)
    this.hazards = (this.def.hazards || []).map(h => createHazard(this.scene, h))
    healthBar.set(health.current, health.max)
    healthBar.show()
  }

  disarm() {
    if (!this._armed) return
    this._armed = false
    this.hazards.forEach(h => h.sprite.destroy())
    this.hazards = []
    if (this.goalRect) { this.goalRect.destroy(); this.goalRect = null }
    if (this.healthBar) this.healthBar.hide()
  }

  update(time) {
    if (!this._armed) return
    this.elapsed += this.scene.game.loop.delta
    this.hazards.forEach(h => h.update(this.elapsed))

    const pb = { x: this.player.x - 12, y: this.player.y - 12, w: 24, h: 24 }

    // hazard contact
    if (time >= this.invulnUntil) {
      for (const h of this.hazards) {
        if (aabb(pb, h.bounds())) {
          this.health.damage(h.def.damage)
          this.healthBar.set(this.health.current, this.health.max)
          this.invulnUntil = time + IFRAME_MS
          // knockback away from hazard centre
          const hb = h.bounds()
          const dx = this.player.x - (hb.x + hb.w / 2)
          const dy = this.player.y - (hb.y + hb.h / 2)
          const len = Math.hypot(dx, dy) || 1
          this.player.x += (dx / len) * 60
          this.player.y += (dy / len) * 60
          if (this.health.isDead()) this._respawn()
          break
        }
      }
    }

    // goal
    if (pointBox(this.player.x, this.player.y, this.def.goal, 0)) {
      this._clear()
    }
  }

  _respawn() {
    this.player.setPosition(this.def.checkpoint.x, this.def.checkpoint.y)
    this.player.body.setVelocity(0, 0)
    this.health.restore()
    this.healthBar.set(this.health.current, this.health.max)
    this.invulnUntil = this.scene.time.now + IFRAME_MS
  }

  _clear() {
    this.save.clearChallenge(this.planetId, this._challengeId())
    this.disarm()
    if (this.onClear) this.onClear(this._challengeId())
  }

  _challengeId() {
    // def is referenced by id in PlanetScene; store it on def for convenience
    return this.def._id
  }
}
```
(PlanetScene sets `def._id = challengeId` when constructing — see Task 12.)

- [ ] **Step 2: Verify build** — `npm run build` succeeds; `npm test` still green (no new unit tests; logic is runtime-verified by the smoke test in Task 16).

- [ ] **Step 3: Commit**
```bash
git add src/challenge/ChallengeController.js
git commit -m "feat: add ChallengeController (hazards, health, checkpoint, clear)"
```

---

### Task 11: HUD — health bar + objective tracker

**Files:**
- Create: `src/ui/HealthBar.js`, `src/ui/ObjectiveTracker.js`

**Interfaces:**
- Produces: `createHealthBar(scene)` and `createObjectiveTracker(scene)` per the Interface Summary. Used by PlanetScene (Task 12).

- [ ] **Step 1: Write `src/ui/HealthBar.js`**
```js
export function createHealthBar(scene) {
  const x = 40, y = 690, w = 240, h = 14
  const bg = scene.add.rectangle(x, y, w, h, 0x1b2230).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100).setVisible(false)
  const fill = scene.add.rectangle(x, y, w, h, 0xd9534a).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101).setVisible(false)
  const label = scene.add.text(x, y - 22, 'HEALTH', { fontFamily: 'monospace', fontSize: '11px', color: '#d9534a' })
    .setScrollFactor(0).setDepth(101).setVisible(false)

  return {
    set(cur, max) { fill.width = w * Math.max(0, Math.min(1, cur / max)) },
    show() { bg.setVisible(true); fill.setVisible(true); label.setVisible(true) },
    hide() { bg.setVisible(false); fill.setVisible(false); label.setVisible(false) },
    destroy() { bg.destroy(); fill.destroy(); label.destroy() }
  }
}
```

- [ ] **Step 2: Write `src/ui/ObjectiveTracker.js`**
```js
export function createObjectiveTracker(scene) {
  const text = scene.add.text(scene.scale.width - 40, 30, '', {
    fontFamily: 'monospace', fontSize: '13px', color: '#c8a24a', align: 'right',
    wordWrap: { width: 360 }
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(100)

  return {
    set(hint) { text.setText(hint ? `▸ ${hint}` : '').setVisible(!!hint) },
    hide() { text.setVisible(false) }
  }
}
```

- [ ] **Step 3: Verify** — `npm run build` succeeds; `npm test` green.

- [ ] **Step 4: Commit**
```bash
git add src/ui/HealthBar.js src/ui/ObjectiveTracker.js
git commit -m "feat: add health bar and objective tracker HUD"
```

---

### Task 12: PlanetScene integration

**Files:**
- Modify: `src/scenes/PlanetScene.js`

**Interfaces:**
- Consumes: `ChallengeController`, `Health`, `createHealthBar`, `createObjectiveTracker`, `registry.quests`/`save`.
- Produces: on-planet challenge zones that arm/clear; quest events reported on talk/discover/enter/challenge; objective tracker + on-planet target marker; `J` opens the quest log; quest-completion reward feedback.

- [ ] **Step 1: Edit the imports and `create()` of `src/scenes/PlanetScene.js`.** Add imports at top:
```js
import Health from '../challenge/health.js'
import ChallengeController from '../challenge/ChallengeController.js'
import { createHealthBar } from '../ui/HealthBar.js'
import { createObjectiveTracker } from '../ui/ObjectiveTracker.js'
```

In `create()`, after `this._refreshProgress()` add:
```js
    // --- quests & challenges ---
    this.quests = this.registry.get('quests')
    this.health = new Health(this.registry.get('save').getMaxHealth())
    this.healthBar = createHealthBar(this)
    this.objectiveTracker = createObjectiveTracker(this)

    // build challenge controllers for this planet
    this.challengeZones = []
    const challenges = layout.challenges || {}
    for (const [cid, def] of Object.entries(challenges)) {
      def._id = cid
      // visual zone outline
      const r = this.add.rectangle(def.bounds.x + def.bounds.w / 2, def.bounds.y + def.bounds.h / 2,
        def.bounds.w, def.bounds.h, 0xd9534a, 0.06).setStrokeStyle(1, 0xd9534a, 0.4)
      this.add.text(def.bounds.x + 6, def.bounds.y + 6, def.name,
        { fontFamily: 'monospace', fontSize: '12px', color: '#d9534a' })
      const controller = new ChallengeController(this, this.planetId, def, {
        save: this.registry.get('save'),
        onClear: (clearedId) => this._reportEvent({ type: 'challenge', planet: this.planetId, challengeId: clearedId })
      })
      this.challengeZones.push({ cid, def, controller, rect: r })
    }

    // objective marker (pulsing ring) for an on-this-planet tracked target
    this.objectiveMarker = this.add.circle(0, 0, 22, 0xc8a24a, 0).setStrokeStyle(2, 0xc8a24a, 0.9).setDepth(40).setVisible(false)
    this.tweens.add({ targets: this.objectiveMarker, scale: 1.4, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 })

    this._updateObjectiveUI()

    this.input.keyboard.on('keydown-J', () => {
      if (this.registry.get('uiOpen')) return
      import('../ui/QuestLog.js').then(m => m.openQuestLog(this.quests, this.game))
    })
```

Also extend the HUD controls hint line — change the existing controls text to mention J:
```js
    this.add.text(40, 64, 'WASD/Arrows: move   E: interact   C: codex   J: quests   Esc: galaxy',
      { fontFamily: 'monospace', fontSize: '13px', color: '#5b6472' }).setScrollFactor(0)
```

- [ ] **Step 2: Add the event-reporting + challenge update + objective-UI logic** as new methods on `PlanetScene` (after `_countFound`):
```js
  _reportEvent(event) {
    const results = this.quests.advance(event)
    for (const res of results) {
      import('../ui/DiscoveryToast.js').then(m => m.showToast({ title: res.completed ? 'Quest complete' : 'Objective complete' }))
      if (res.completed && res.reward) {
        const holo = this.registry.get('lore').getEntry(res.reward.holocronLoreId)
        if (holo) import('../ui/CardReveal.js').then(m => m.openCardReveal(holo, this.game))
        // refresh local max health ceiling for any subsequent challenge
        this.health.setMax(this.registry.get('save').getMaxHealth())
      }
    }
    this._updateObjectiveUI()
  }

  _updateObjectiveUI() {
    const hint = this.quests.trackedHint()
    this.objectiveTracker.set(hint)
    // place the pulsing marker if the tracked objective targets something on THIS planet
    const obj = this.quests.trackedObjective()
    const pos = obj ? this._objectiveTargetPos(obj) : null
    if (pos) this.objectiveMarker.setPosition(pos.x, pos.y).setVisible(true)
    else this.objectiveMarker.setVisible(false)
  }

  _objectiveTargetPos(obj) {
    if (obj.type === 'talk' && obj.planet === this.planetId) {
      const it = this.layout.interactables.find(i => i.type === 'npc' && i.loreId === obj.npcLoreId)
      return it ? { x: it.x, y: it.y } : null
    }
    if (obj.type === 'enter' && obj.planet === this.planetId) {
      const lm = this.layout.landmarks.find(l => l.id === obj.landmarkId)
      return lm ? { x: lm.x + lm.w / 2, y: lm.y + lm.h / 2 } : null
    }
    if (obj.type === 'challenge' && obj.planet === this.planetId) {
      const c = (this.layout.challenges || {})[obj.challengeId]
      return c ? { x: c.bounds.x + c.bounds.w / 2, y: c.bounds.y + c.bounds.h / 2 } : null
    }
    return null
  }

  _activeChallenge() {
    return this.challengeZones.find(z => z.controller.armed) || null
  }
```

- [ ] **Step 3: Wire challenge arming + updates into `update()`, and report talk/discover/enter events.** Replace the body of `update()` with:
```js
  update(time) {
    if (this.registry.get('uiOpen')) {
      this.player.body.setVelocity(0, 0)
      return
    }
    updatePlayer(this.player, this.cursors, this.wasd)

    // challenge arm/disarm + update
    const px = this.player.x, py = this.player.y
    for (const z of this.challengeZones) {
      const b = z.def.bounds
      const inside = px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h
      const cleared = this.registry.get('save').isChallengeCleared(this.planetId, z.cid)
      if (inside && !z.controller.armed && !cleared) {
        z.controller.arm(this.player, this.health, this.healthBar)
      } else if (!inside && z.controller.armed) {
        z.controller.disarm()
      }
    }
    const active = this._activeChallenge()
    if (active) active.controller.update(time)

    // proximity prompt (skip while a challenge is armed to keep focus)
    const near = nearestInteractable({ x: px, y: py }, this.interactables, 70)
    if (near && !active) {
      this.promptText.setText('Press E').setPosition(near.x, near.y - 28).setVisible(true)
    } else {
      this.promptText.setVisible(false)
    }

    // landmark entry (auto-unlock + enter event)
    for (const zone of this.landmarkZones) {
      const lm = zone.def
      const inLm = px >= lm.x && px <= lm.x + lm.w && py >= lm.y && py <= lm.y + lm.h
      if (inLm && !this._enteredLandmarks.has(lm.id)) {
        this._enteredLandmarks.add(lm.id)
        const save = this.registry.get('save')
        const entry = this.registry.get('lore').getEntry(lm.loreId)
        if (save.unlockLore(entry)) {
          this._refreshProgress()
          import('../ui/DiscoveryToast.js').then(m => m.showToast(entry))
          this._reportEvent({ type: 'discover', loreId: entry.id })
        }
        this._reportEvent({ type: 'enter', planet: this.planetId, landmarkId: lm.id })
      }
    }
  }
```

- [ ] **Step 4: Report talk/discover on interaction.** In `tryInteract()`, after `const isNew = save.unlockLore(entry)` block and before `this.dispatchInteraction(...)`, add event reporting:
```js
    if (isNew) {
      this._refreshProgress()
      import('./../ui/DiscoveryToast.js').then(m => m.showToast(entry))
      this._reportEvent({ type: 'discover', loreId: entry.id })
    }
    if (near.def.type === 'npc') {
      this._reportEvent({ type: 'talk', planet: this.planetId, npcLoreId: near.def.loreId })
    }
    this.promptText.setVisible(false)
    this.dispatchInteraction(near, entry)
```
(Remove the now-duplicated `this.promptText.setVisible(false)` that previously sat right before `dispatchInteraction` so it appears once.)

- [ ] **Step 5: Pass quest context to the dialogue overlay.** In `dispatchInteraction`, change the npc branch to pass quest options so the giver can offer the quest:
```js
    } else if (type === 'npc') {
      import('../ui/DialogueBox.js').then(m => m.openDialogue(near.def, entry, this.game,
        { questService: this.quests, planet: this.planetId }))
    }
```

- [ ] **Step 6: Verify** — `npm test` green (no unit-test changes; PlanetScene is runtime). `npm run build` succeeds. Report visual verification deferred.

- [ ] **Step 7: Commit**
```bash
git add src/scenes/PlanetScene.js
git commit -m "feat: integrate challenges, quest events, and objective markers into PlanetScene"
```

---

### Task 13: Quest Log overlay

**Files:**
- Create: `src/ui/QuestLog.js`
- Modify: `src/styles.css` (append quest-log styles)

**Interfaces:**
- Consumes: `openOverlay`/`closeOverlay`; `QuestService`.
- Produces: `openQuestLog(questService, game)`. Opened by PlanetScene (Task 12) and GalaxyMapScene (Task 15).

- [ ] **Step 1: Write `src/ui/QuestLog.js`**
```js
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
```

- [ ] **Step 2: Append quest-log styles to `src/styles.css`**
```css
.questlog h3 { color: #9aa0a6; margin: 16px 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
.ql-quest { border-top: 1px solid #1b2230; padding: 10px 0; }
.ql-title { color: #d7dde6; font-size: 15px; }
.ql-title .tracked { color: #c8a24a; font-size: 11px; border: 1px solid #c8a24a; border-radius: 4px; padding: 1px 6px; margin-left: 6px; }
.ql-steps { margin-top: 6px; font-size: 13px; line-height: 1.6; }
.step-current { color: #c8a24a; }
.step-done { color: #5b6472; }
.step-todo { color: #8a93a3; }
.ql-track { margin-top: 8px; background: none; border: 1px solid #2a3242; color: #d7dde6; border-radius: 4px; padding: 4px 12px; cursor: pointer; font: inherit; font-size: 12px; }
.ql-track:hover { border-color: #c8a24a; color: #c8a24a; }
```

- [ ] **Step 3: Verify** — `npm run build` succeeds; `npm test` green.

- [ ] **Step 4: Commit**
```bash
git add src/ui/QuestLog.js src/styles.css
git commit -m "feat: add quest log overlay"
```

---

### Task 14: DialogueBox — accept-quest beat

**Files:**
- Modify: `src/ui/DialogueBox.js`

**Interfaces:**
- Consumes: `QuestService.availableFrom`/`accept`; `DiscoveryToast`.
- Produces: `openDialogue(def, entry, game, opts)` where `opts = { questService, planet }`; when the NPC offers an available quest, an "Accept" beat is appended.

- [ ] **Step 1: Edit `src/ui/DialogueBox.js`**
```js
import { openOverlay, closeOverlay } from './overlay.js'
import { factionColor } from './helpers.js'

export function openDialogue(def, entry, game, opts = {}) {
  const { questService, planet } = opts
  const offered = (questService && planet)
    ? questService.availableFrom(planet, def.loreId)
    : null

  const panel = document.createElement('div')
  panel.className = 'panel dialogue'
  const hex = '#' + factionColor(def.faction).toString(16).padStart(6, '0')
  const lines = [...def.lines, `「 Lore unlocked: ${entry.title} 」\n${entry.summary}`]
  if (offered) lines.push(`「 New quest available 」\n${offered.title} — ${offered.summary}`)
  let idx = 0

  panel.innerHTML = `
    <h2 style="color:${hex}">${def.name || 'Unknown'}</h2>
    <div class="muted">${def.faction || 'unaligned'}</div>
    <div class="body dialogue-line"></div>
    <button class="dialogue-next">Next ▸</button>
    <div class="close-hint">Esc to close</div>`

  const lineEl = panel.querySelector('.dialogue-line')
  const nextBtn = panel.querySelector('.dialogue-next')
  const onLast = () => idx >= lines.length - 1

  const render = () => {
    lineEl.textContent = lines[idx]
    if (onLast()) nextBtn.textContent = offered ? 'Accept Quest ✦' : 'Close ✕'
    else nextBtn.textContent = 'Next ▸'
  }
  nextBtn.addEventListener('click', () => {
    if (onLast()) {
      if (offered) {
        questService.accept(offered.id)
        import('./DiscoveryToast.js').then(m => m.showToast({ title: `Quest accepted: ${offered.title}` }))
      }
      closeOverlay()
      return
    }
    idx++; render()
  })
  render()
  openOverlay(panel, { game })
}
```

- [ ] **Step 2: Verify** — `npm run build` succeeds; `npm test` green (DialogueBox has no unit test; covered by smoke).

- [ ] **Step 3: Commit**
```bash
git add src/ui/DialogueBox.js
git commit -m "feat: offer and accept quests from NPC dialogue"
```

---

### Task 15: GalaxyMapScene — galaxy markers + quest log

**Files:**
- Modify: `src/scenes/GalaxyMapScene.js`

**Interfaces:**
- Consumes: `registry.quests`; `planetLayouts`.
- Produces: a pulsing marker on the planet node holding the tracked objective (when it has a `planet`); `J` opens the quest log on the map.

- [ ] **Step 1: Edit `src/scenes/GalaxyMapScene.js`.** At the end of `create()` (after the existing `keydown-C` handler) add:
```js
    // quest log
    this.input.keyboard.on('keydown-J', () => {
      if (this.registry.get('uiOpen')) return
      import('../ui/QuestLog.js').then(m => m.openQuestLog(this.registry.get('quests'), this.game))
    })

    // marker on the planet that holds the tracked objective
    const quests = this.registry.get('quests')
    const obj = quests.trackedObjective()
    const targetPlanet = obj && obj.planet ? obj.planet : null
    if (targetPlanet && planetLayouts[targetPlanet]) {
      const p = planetLayouts[targetPlanet].galaxyPos
      const ring = this.add.circle(p.x, p.y, 20, 0xc8a24a, 0).setStrokeStyle(2, 0xc8a24a, 0.9)
      this.tweens.add({ targets: ring, scale: 1.6, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 })
    }
```
Also update the controls hint text to mention J — change the line that reads `'Arrow keys: select system   Enter: travel   C: codex'` to:
```js
    this.add.text(40, 66, 'Arrow keys: select system   Enter: travel   C: codex   J: quests',
      { fontFamily: 'monospace', fontSize: '14px', color: '#5b6472' })
```

- [ ] **Step 2: Verify** — `npm run build` succeeds; `npm test` green.

- [ ] **Step 3: Commit**
```bash
git add src/scenes/GalaxyMapScene.js
git commit -m "feat: galaxy objective marker and quest log key"
```

---

### Task 16: Runtime smoke (quests) + README + final build

**Files:**
- Modify: `README.md`
- Verify: production build + a quest-flow Playwright smoke

**Interfaces:**
- Consumes: the whole feature.
- Produces: updated docs; a verified runtime quest flow.

- [ ] **Step 1: Update `README.md`** — add J/quests + health to controls and a Quests section. In the Controls list add:
```markdown
- **J** — open the quest log
```
And after the "Lore modes" section add:
```markdown
## Quests & challenges
Talk to notable figures to accept **investigation chains** that retrace real prequel storylines across planets. Steps advance through normal discovery plus **traversal challenges** — cross hazard-filled zones (patrol droids, sweeping scanners, lava vents) without your **health bar** hitting zero, or respawn at the last checkpoint. Completing a chain awards an exclusive **holocron** and a permanent max-health boost.
```

- [ ] **Step 2: Run the full unit suite + build**

Run (PowerShell, with the Node PATH prepend): `npm test`
Expected: all green (base 52 + new: SaveService +5, health +5, validate +7, loreData +1, quests +3, objectives +5, QuestService +6, Hazard +2 ≈ 86 total — confirm 0 failures).
Then: `npm run build` → succeeds.

- [ ] **Step 3: Drive a quest end-to-end with a Playwright smoke.** Create `quest-smoke.mjs` in a scratch dir (not committed), serve the build with `npm run preview -- --port 4173` (background), and run a script that:
  1. loads the page, waits for `#game canvas`;
  2. travels to Naboo, walks to Queen Amidala (NPC), presses E, advances the dialogue to "Accept Quest", accepts;
  3. opens the quest log (J), asserts an Active quest with a current step is shown; closes;
  4. travels to Coruscant, completes the `talk` (Palpatine) and `discover` (assassination artifact) steps;
  5. returns to Naboo, walks into the `naboo_palace` challenge bounds, asserts the health bar appears, takes damage, then walks to the goal to clear it;
  6. completes the final `enter` step and asserts a "Quest complete" toast + the holocron card; asserts `localStorage` shows `maxHealth: 120` and the holocron in `unlockedLore`;
  7. asserts zero console/page errors; screenshots each beat.

Use the existing base-game smoke (`smoke.mjs`) as the template for browser setup and key/screenshot helpers. This step is run by the controller/human (headless agents may approximate by asserting build success + unit tests); record the result and screenshots.

- [ ] **Step 4: Commit**
```bash
git add README.md
git commit -m "docs: document quests and challenges"
```

---

## Self-Review

**1. Spec coverage:**
- Investigation chains, NPC givers, 4 objective types → Tasks 5, 6, 7, 14. ✓
- Traversal challenges on the planet (hybrid C), hazards static/patrol/sweep → Tasks 9, 10, 12. ✓
- Shared health bar, checkpoint respawn, damage + i-frames + knockback → Tasks 2, 10, 11. ✓
- Quest log (J), objective tracker, on-planet + galaxy markers → Tasks 11, 12, 13, 15. ✓
- Rewards: holocron (new category, exclusive) + max-health, idempotent → Tasks 4, 7. ✓
- Pre-satisfied auto-advance (no soft-lock) → Task 7 (`_settle`) + test. ✓
- Persistence + backward compatibility → Tasks 1, 7. ✓
- validateQuests gate (refs, geometry) → Tasks 3, 5. ✓
- Quests optional/parallel, calm overworld (health hidden/no damage outside challenges) → Tasks 10, 12. ✓
- Testing: unit on pure logic, build + Playwright smoke on runtime → throughout + Task 16. ✓

**2. Placeholder scan:** Challenge coordinates, hazard params, holocron text, and quest data are all concrete. Quest references were verified against the actual `planetLayouts.js` (e.g. `char_padme_amidala`/`char_kit_fisto`/`char_mace_windu` are NPCs on naboo/kamino/coruscant; `lm_battle_naboo`/`lm_jedi_order`/`lm_duel_mustafar` are landmarks on their planets; `faction_grand_army_republic`/`event_assassination_padme` exist). The smoke harness (Task 16) is intentionally external (not committed) to avoid adding a Playwright dependency to the repo. No "TBD"/vague steps.

**3. Type consistency:** `getQuestState` returns `{status, step}|null` (Tasks 1, 7). `advance(event)` returns `[{questId, completed, reward?}]` (Tasks 7, 12). `createHealthBar` → `{set,show,hide,destroy}` (Tasks 11, 10, 12). `ChallengeController(scene, planetId, def, {save,onClear})` with `arm(player, health, healthBar)` (Tasks 10, 12). `openDialogue(def, entry, game, {questService, planet})` (Tasks 12, 14). `matchesObjective(objective, event)` (Tasks 6, 7). `def._id` set in PlanetScene (Task 12) and read by ChallengeController (Task 10). Event shapes (`talk`/`discover`/`enter`/`challenge`) consistent across Tasks 6, 7, 12. `holoById` Map built in BootScene (Task 8), consumed by QuestService (Task 7). ✓
