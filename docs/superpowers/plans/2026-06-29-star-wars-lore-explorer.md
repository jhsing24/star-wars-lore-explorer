# Star Wars Lore Explorer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 2D browser game where the player explores a prequel-era Star Wars galaxy (galaxy map → planet surfaces) and collects Wookieepedia-grounded lore through four presentation modes.

**Architecture:** A Vite-bundled single-page app. Phaser.js 3 renders the game world on a canvas (galaxy map + planet surfaces); an HTML/CSS overlay layer renders text-heavy lore UI (codex, cards, terminals, dialogue). A `LoreService` resolves curated seed JSON first and enriches it on demand from the Wookieepedia MediaWiki API (cached in `localStorage`). A `SaveService` persists all progression to `localStorage`. No backend.

**Tech Stack:** JavaScript (ES modules), Phaser.js 3, Vite (dev server + build), Vitest + jsdom (tests).

## Global Constraints

- **Language:** JavaScript ES modules only. No TypeScript, no JSX.
- **Era:** Prequel only (~32–19 BBY). All lore content must be accurate to this era and grounded in Wookieepedia facts.
- **Art style:** Minimalist / abstract geometric. No imported sprite art, no official Star Wars imagery, no copyrighted logos. Everything is drawn from Phaser shapes (`rectangle`, `circle`, `triangle`, `graphics`) and CSS.
- **No backend:** All persistence is `localStorage`. The game must be fully playable offline (seed data only); Wookieepedia enrichment is strictly additive.
- **Controls (v1):** Keyboard only — WASD / arrow keys to move, `E` to interact, `C` for codex, `Esc` to close overlays / return to galaxy.
- **API failure is silent:** Wookieepedia fetch failures never surface an error to the player and never block the core loop. 5-second timeout.
- **Canonical planet ids (12):** `coruscant`, `naboo`, `kamino`, `geonosis`, `kashyyyk`, `mustafar`, `utapau`, `tatooine`, `mandalore`, `ryloth`, `christophsis`, `rodia`.
- **Faction ids (3):** `republic`, `separatist`, `neutral`.
- **Lore categories (5):** `planets`, `factions`, `characters`, `events`, `species`.
- **Rarity tiers (3):** `common`, `rare`, `legendary`.
- **Interaction triggers (4):** `landmark`, `terminal`, `npc_dialogue`, `artifact`.
- **localStorage keys:** save → `swle_save`; per-slug lore cache → `swle_lore_<slug>`.
- **Commit after every task.** Conventional commit messages (`feat:`, `test:`, `chore:`).

---

## File Structure

```
star-wars-lore-explorer/
  index.html                     # Mount point: #game canvas host + #overlay-root
  package.json
  vite.config.js                 # Vite config + Vitest config (test field), base:'./'
  src/
    main.js                      # Phaser.Game init, scene list
    styles.css                   # Overlay + global styles
    scenes/
      BootScene.js               # Instantiates services into registry, → GalaxyMapScene
      GalaxyMapScene.js          # Nodes, lanes, ship, travel, progress labels
      PlanetScene.js             # Planet render, player movement, interaction dispatch
    data/
      planets.json               # 12 entries
      factions.json              # >=10 entries
      characters.json            # >=25 entries
      events.json                # >=15 entries
      species.json               # >=18 entries
      loreData.js                # Merges the 5 JSON files; exports allLore + indexById
      planetLayouts.js           # Per-planet geometry, galaxy positions, interactables
      validate.js                # validateLoreEntry / validateLore / validateLayouts
    services/
      SaveService.js             # localStorage progression model
      LoreService.js             # seed lookup + Wookieepedia enrich + cache + pure helpers
    game/
      interaction.js             # nearestInteractable (pure proximity math)
    objects/
      Player.js                  # createPlayer factory (triangle + movement state)
      Interactable.js            # createInteractable factory (npc/terminal/artifact visuals)
    ui/
      overlay.js                 # openOverlay / closeOverlay + uiOpen registry flag
      helpers.js                 # factionColor, groupByCategory, rarityClass
      DiscoveryToast.js          # showToast(entry)
      Codex.js                   # openCodex(loreService, save)
      CardReveal.js              # openCardReveal(entry)
      Terminal.js                # openTerminal(entry, loreService)
      DialogueBox.js             # openDialogue(interactable, entry)
  test/
    helpers/memoryStorage.js     # createMemoryStorage() test double
  docs/superpowers/...           # spec + this plan (already committed)
```

**Note on objects/:** The spec lists `Player.js`, `NPC.js`, `Artifact.js`, `Terminal.js`. NPCs, artifacts, and in-world terminals are all geometric point-interactables differing only by color/shape, so they are consolidated into one `createInteractable` factory (`Interactable.js`) that branches on `type`. This is a deliberate DRY consolidation, not a scope cut — all four object behaviors are implemented.

---

## Interface Summary (locked names used across tasks)

```
// data/validate.js
export const CATEGORIES = ['planets','factions','characters','events','species']
export const RARITIES   = ['common','rare','legendary']
export const TRIGGERS   = ['landmark','terminal','npc_dialogue','artifact']
export const PLANET_IDS = ['coruscant','naboo','kamino','geonosis','kashyyyk','mustafar','utapau','tatooine','mandalore','ryloth','christophsis','rodia']
export function validateLoreEntry(entry): string[]            // [] = valid
export function validateLore(entries): string[]               // counts + uniqueness + per-entry
export function validateLayouts(layouts, byId): string[]      // cross-refs + per-planet point counts

// data/loreData.js
export const allLore: Array<Entry>
export function indexById(entries): Map<string,Entry>

// services/SaveService.js
class SaveService {
  constructor(storage = localStorage, key = 'swle_save')
  load(): State                                  // parse or fresh default; also sets this.state
  persist(): void
  reset(): void
  get state(): State
  isUnlocked(id): boolean
  unlockLore(entry): boolean                     // true if newly unlocked; cards added for 'artifact' trigger
  setCurrentPlanet(planetId): void
  visitPlanet(planetId): void
  setPlanetProgress(planetId, found, total): void
  getPlanetProgress(planetId): {found, total}
  totalUnlocked(): number
}

// services/LoreService.js
export function buildExtractUrl(slug): string
export function parseExtract(json): string|null
export function stripHtml(html): string
class LoreService {
  constructor({ entries, fetchFn = fetch, storage = localStorage, timeoutMs = 5000 })
  getEntry(id): Entry|undefined
  getAllEntries(): Entry[]
  getByCategory(category): Entry[]
  getByPlanet(planetId): Entry[]
  async enrich(id): Promise<string|null>         // extended lore text; cached; null on failure
}

// game/interaction.js
export function nearestInteractable(pos, interactables, radius): object|null

// ui/overlay.js
export function openOverlay(node, { game, onClose }): HTMLElement
export function closeOverlay(): void
// ui/helpers.js
export function factionColor(faction): number    // Phaser hex int
export function groupByCategory(entries): Record<category, Entry[]>
export function rarityClass(rarity): string      // CSS class name
```

**Registry keys (Phaser `game.registry`):** `save` → SaveService, `lore` → LoreService, `uiOpen` → boolean (true while any overlay is open; scenes skip movement/interaction when true).

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/styles.css`, `src/scenes/BootScene.js`, `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: a runnable Vite dev server showing an empty dark Phaser canvas; `npm test` runs Vitest (0 tests, exits clean).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "star-wars-lore-explorer",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.80.1"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/
.DS_Store
*.local
```

- [ ] **Step 3: Create `vite.config.js`** (Vite + Vitest config in one file)

```js
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: { target: 'es2020' },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js', 'src/**/*.test.js'],
    globals: false
  }
})
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Star Wars Lore Explorer</title>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <div id="game"></div>
    <div id="overlay-root"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/styles.css`**

```css
* { box-sizing: border-box; }
html, body {
  margin: 0; height: 100%; background: #05070c;
  font-family: ui-monospace, "Cascadia Code", Menlo, Consolas, monospace;
  color: #d7dde6; overflow: hidden;
}
#game { position: absolute; inset: 0; }
#game canvas { display: block; margin: 0 auto; }
#overlay-root { position: absolute; inset: 0; pointer-events: none; z-index: 10; }
#overlay-root > * { pointer-events: auto; }
```

- [ ] **Step 6: Create `src/scenes/BootScene.js`** (placeholder; services wired in Task 7)

```js
import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }
  create() {
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Star Wars Lore Explorer', {
      fontFamily: 'monospace', fontSize: '24px', color: '#9aa0a6'
    }).setOrigin(0.5)
  }
}
```

- [ ] **Step 7: Create `src/main.js`**

```js
import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#05070c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene]
}

// eslint-disable-next-line no-new
new Phaser.Game(config)
```

- [ ] **Step 8: Install and verify dev server**

Run: `npm install`
Then: `npm run dev`
Expected: Vite prints a `localhost` URL. Open it — a dark canvas centered in the window shows the gray text "Star Wars Lore Explorer". No console errors.

- [ ] **Step 9: Verify test runner boots**

Run: `npm test`
Expected: Vitest runs, reports "No test files found" (or 0 tests) and exits 0. (This confirms config is valid before any tests exist.)

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json .gitignore vite.config.js index.html src/
git commit -m "chore: scaffold Vite + Phaser + Vitest project"
```

---

### Task 2: Lore schema validator

**Files:**
- Create: `src/data/validate.js`
- Test: `src/data/validate.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `validateLoreEntry(entry) -> string[]`, plus exported constants `CATEGORIES`, `RARITIES`, `TRIGGERS`, `PLANET_IDS`, and `validateLore(entries) -> string[]`. Task 3 (content) and Task 6 (layouts) depend on these.

- [ ] **Step 1: Write the failing test** — `src/data/validate.test.js`

```js
import { describe, it, expect } from 'vitest'
import { validateLoreEntry, validateLore } from './validate.js'

const good = {
  id: 'char_palpatine',
  title: 'Sheev Palpatine',
  category: 'characters',
  summary: 'A Naboo senator who became Supreme Chancellor of the Galactic Republic.',
  wookieepedia_slug: 'Palpatine',
  rarity: 'legendary',
  unlock_condition: { planet: 'coruscant', trigger: 'npc_dialogue' }
}

describe('validateLoreEntry', () => {
  it('accepts a well-formed entry', () => {
    expect(validateLoreEntry(good)).toEqual([])
  })
  it('rejects an unknown category', () => {
    const errs = validateLoreEntry({ ...good, category: 'vehicles' })
    expect(errs.some(e => e.includes('category'))).toBe(true)
  })
  it('rejects an unknown rarity', () => {
    const errs = validateLoreEntry({ ...good, rarity: 'mythic' })
    expect(errs.some(e => e.includes('rarity'))).toBe(true)
  })
  it('rejects an unknown planet in unlock_condition', () => {
    const errs = validateLoreEntry({ ...good, unlock_condition: { planet: 'dagobah', trigger: 'terminal' } })
    expect(errs.some(e => e.includes('planet'))).toBe(true)
  })
  it('rejects an unknown trigger', () => {
    const errs = validateLoreEntry({ ...good, unlock_condition: { planet: 'coruscant', trigger: 'mind_trick' } })
    expect(errs.some(e => e.includes('trigger'))).toBe(true)
  })
  it('rejects a missing summary', () => {
    const e2 = { ...good }; delete e2.summary
    expect(validateLoreEntry(e2).some(e => e.includes('summary'))).toBe(true)
  })
})

describe('validateLore', () => {
  it('flags duplicate ids', () => {
    const errs = validateLore([good, good])
    expect(errs.some(e => e.includes('duplicate'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- validate`
Expected: FAIL — cannot import `./validate.js` (module not found).

- [ ] **Step 3: Write `src/data/validate.js`**

```js
export const CATEGORIES = ['planets', 'factions', 'characters', 'events', 'species']
export const RARITIES = ['common', 'rare', 'legendary']
export const TRIGGERS = ['landmark', 'terminal', 'npc_dialogue', 'artifact']
export const PLANET_IDS = [
  'coruscant', 'naboo', 'kamino', 'geonosis', 'kashyyyk', 'mustafar',
  'utapau', 'tatooine', 'mandalore', 'ryloth', 'christophsis', 'rodia'
]

export function validateLoreEntry(entry) {
  const errs = []
  const requireString = (field) => {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      errs.push(`${entry.id || '(no id)'}: ${field} must be a non-empty string`)
    }
  }
  requireString('id')
  requireString('title')
  requireString('summary')
  requireString('wookieepedia_slug')

  if (!CATEGORIES.includes(entry.category)) {
    errs.push(`${entry.id}: invalid category "${entry.category}"`)
  }
  if (!RARITIES.includes(entry.rarity)) {
    errs.push(`${entry.id}: invalid rarity "${entry.rarity}"`)
  }
  const uc = entry.unlock_condition
  if (!uc || typeof uc !== 'object') {
    errs.push(`${entry.id}: missing unlock_condition`)
  } else {
    if (!PLANET_IDS.includes(uc.planet)) {
      errs.push(`${entry.id}: invalid unlock_condition.planet "${uc.planet}"`)
    }
    if (!TRIGGERS.includes(uc.trigger)) {
      errs.push(`${entry.id}: invalid unlock_condition.trigger "${uc.trigger}"`)
    }
  }
  return errs
}

export function validateLore(entries) {
  const errs = []
  const seen = new Set()
  for (const entry of entries) {
    errs.push(...validateLoreEntry(entry))
    if (seen.has(entry.id)) errs.push(`duplicate id "${entry.id}"`)
    seen.add(entry.id)
  }
  return errs
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- validate`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/validate.js src/data/validate.test.js
git commit -m "feat: add lore entry schema validator"
```

---

### Task 3: Seed lore content

**Files:**
- Create: `src/data/planets.json`, `src/data/factions.json`, `src/data/characters.json`, `src/data/events.json`, `src/data/species.json`, `src/data/loreData.js`
- Test: `src/data/loreData.test.js`

**Interfaces:**
- Consumes: `validateLore`, `CATEGORIES`, `PLANET_IDS` from `validate.js`.
- Produces: `allLore` (merged array) and `indexById(entries)` from `loreData.js`. Every later task that needs lore imports from here.

**This is test-driven content.** The test below is the spec for the content: it enforces minimum counts per category, total ≥ 80, schema validity, and id uniqueness. Author entries until the test passes. Every entry must be a real, Wookieepedia-accurate prequel-era fact. `id` convention: `<category-prefix>_<slug>` where prefix is `planet`/`faction`/`char`/`event`/`species` (e.g. `char_palpatine`, `event_invasion_naboo`). Each of the 12 planet ids must appear as a `planets` entry, and every planet must be referenced by at least 4 and at most 8 entries' `unlock_condition.planet` (enforced later in Task 6 against layouts — here just spread entries across planets).

- [ ] **Step 1: Write the failing test** — `src/data/loreData.test.js`

```js
import { describe, it, expect } from 'vitest'
import { allLore, indexById } from './loreData.js'
import { validateLore, CATEGORIES, PLANET_IDS } from './validate.js'

describe('seed lore data', () => {
  it('passes schema validation with no errors', () => {
    expect(validateLore(allLore)).toEqual([])
  })

  it('meets minimum counts per category', () => {
    const count = (c) => allLore.filter(e => e.category === c).length
    expect(count('planets')).toBe(12)
    expect(count('factions')).toBeGreaterThanOrEqual(10)
    expect(count('characters')).toBeGreaterThanOrEqual(25)
    expect(count('events')).toBeGreaterThanOrEqual(15)
    expect(count('species')).toBeGreaterThanOrEqual(18)
  })

  it('has at least 80 total entries', () => {
    expect(allLore.length).toBeGreaterThanOrEqual(80)
  })

  it('has one planets entry per canonical planet id', () => {
    const planetEntryIds = allLore.filter(e => e.category === 'planets')
      .map(e => e.unlock_condition.planet).sort()
    expect(planetEntryIds).toEqual([...PLANET_IDS].sort())
  })

  it('indexById returns a Map keyed by id', () => {
    const idx = indexById(allLore)
    expect(idx.get('char_palpatine')?.title).toBe('Sheev Palpatine')
    expect(idx.size).toBe(allLore.length)
  })

  it('only uses known categories', () => {
    expect(allLore.every(e => CATEGORIES.includes(e.category))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- loreData`
Expected: FAIL — cannot import `./loreData.js`.

- [ ] **Step 3: Create `src/data/loreData.js`**

```js
import planets from './planets.json'
import factions from './factions.json'
import characters from './characters.json'
import events from './events.json'
import species from './species.json'

export const allLore = [...planets, ...factions, ...characters, ...events, ...species]

export function indexById(entries) {
  const map = new Map()
  for (const e of entries) map.set(e.id, e)
  return map
}
```

- [ ] **Step 4: Author `src/data/planets.json`** — 12 entries, one per canonical planet id.

Worked example (write all 12 following this shape; `unlock_condition.planet` must equal the planet the entry is about, `trigger: "landmark"` for planet overview entries):

```json
[
  {
    "id": "planet_coruscant",
    "title": "Coruscant",
    "category": "planets",
    "summary": "An ecumenopolis at the heart of the galaxy whose entire surface is covered by sprawling city. It served as the capital of the Galactic Republic and seat of the Senate and the Jedi Order.",
    "wookieepedia_slug": "Coruscant",
    "rarity": "legendary",
    "unlock_condition": { "planet": "coruscant", "trigger": "landmark" }
  },
  {
    "id": "planet_naboo",
    "title": "Naboo",
    "category": "planets",
    "summary": "A peaceful Mid Rim world of rolling hills and lakes, home to both the human Naboo and the aquatic Gungans. It was the homeworld of Padmé Amidala and Senator Palpatine.",
    "wookieepedia_slug": "Naboo",
    "rarity": "rare",
    "unlock_condition": { "planet": "naboo", "trigger": "landmark" }
  }
]
```

Remaining planet entries to author (10): `kamino`, `geonosis`, `kashyyyk`, `mustafar`, `utapau`, `tatooine`, `mandalore`, `ryloth`, `christophsis`, `rodia`.

- [ ] **Step 5: Author `src/data/factions.json`** — ≥10 entries.

Required factions (author each; assign `unlock_condition.planet` to a thematically fitting planet and a sensible trigger): Galactic Republic, Confederacy of Independent Systems, Jedi Order, Sith, Galactic Senate, Trade Federation, Techno Union, Banking Clan, Mandalorians (Death Watch), Hutt Cartel. Worked example:

```json
{
  "id": "faction_jedi_order",
  "title": "Jedi Order",
  "category": "factions",
  "summary": "An ancient monastic peacekeeping organization unified by its belief in and observance of the light side of the Force. During the final years of the Republic the Order was led by a High Council based on Coruscant.",
  "wookieepedia_slug": "Jedi_Order",
  "rarity": "legendary",
  "unlock_condition": { "planet": "coruscant", "trigger": "terminal" }
}
```

- [ ] **Step 6: Author `src/data/characters.json`** — ≥25 entries.

Suggested prequel-era figures (author at least 25; verify each fact against Wookieepedia): Sheev Palpatine, Count Dooku, Mace Windu, Yoda, Qui-Gon Jinn, Obi-Wan Kenobi, Anakin Skywalker, Padmé Amidala, Jar Jar Binks, Sebulba, Watto, Shmi Skywalker, Darth Maul, Nute Gunray, Jango Fett, Boba Fett, General Grievous, Ki-Adi-Mundi, Plo Koon, Kit Fisto, Aayla Secura, Bail Organa, Mon Mothma, Wilhuff Tarkin, Ahsoka Tano, Captain Rex, Asajj Ventress, Cad Bane. Worked example is `char_palpatine` from Task 2's test fixture — reuse it verbatim so the `indexById` test passes:

```json
{
  "id": "char_palpatine",
  "title": "Sheev Palpatine",
  "category": "characters",
  "summary": "A Naboo senator who became Supreme Chancellor of the Galactic Republic. In secret he was the Sith Lord Darth Sidious, orchestrating the conflicts that allowed him to seize emergency powers.",
  "wookieepedia_slug": "Palpatine",
  "rarity": "legendary",
  "unlock_condition": { "planet": "coruscant", "trigger": "npc_dialogue" }
}
```

- [ ] **Step 7: Author `src/data/events.json`** — ≥15 entries.

Suggested events: Invasion of Naboo, Battle of Naboo, Assassination attempts on Padmé, First Battle of Geonosis, Outbreak of the Clone Wars, Battle of Christophsis, Battle of Kamino, Battle of Ryloth, Battle of Mandalore / Siege of Mandalore, Battle of Utapau, Battle of Kashyyyk, Order 66, Declaration of the New Order, Mission to Tatooine, Battle of Rodia. Worked example:

```json
{
  "id": "event_invasion_naboo",
  "title": "Invasion of Naboo",
  "category": "events",
  "summary": "The Trade Federation blockaded and occupied Naboo in 32 BBY in protest of taxation of the trade routes, secretly directed by Darth Sidious. The invasion ended after the Battle of Naboo.",
  "wookieepedia_slug": "Invasion_of_Naboo",
  "rarity": "rare",
  "unlock_condition": { "planet": "naboo", "trigger": "landmark" }
}
```

- [ ] **Step 8: Author `src/data/species.json`** — ≥18 entries.

Suggested species: Human, Gungan, Twi'lek, Wookiee, Kaminoan, Geonosian, Hutt, Toydarian, Dug, Neimoidian, Zabrak, Mon Calamari, Rodian, Besalisk, Nautolan, Cerean, Togruta, Kel Dor, Mandalorian (culture/people), Utai/Pau'an. Worked example:

```json
{
  "id": "species_kaminoan",
  "title": "Kaminoan",
  "category": "species",
  "summary": "A tall, long-necked amphibious species native to the ocean world of Kamino, renowned across the galaxy for their mastery of cloning technology.",
  "wookieepedia_slug": "Kaminoan",
  "rarity": "common",
  "unlock_condition": { "planet": "kamino", "trigger": "terminal" }
}
```

- [ ] **Step 9: Run the content gate**

Run: `npm test -- loreData`
Expected: PASS (6 tests). If counts fail, add entries; if validation fails, read the error strings — they name the offending id and field — and fix.

- [ ] **Step 10: Commit**

```bash
git add src/data/*.json src/data/loreData.js src/data/loreData.test.js
git commit -m "feat: add curated prequel-era seed lore (>=80 entries)"
```

---

### Task 4: SaveService (localStorage progression)

**Files:**
- Create: `src/services/SaveService.js`, `test/helpers/memoryStorage.js`
- Test: `src/services/SaveService.test.js`

**Interfaces:**
- Consumes: nothing (storage is injected).
- Produces: `SaveService` class with the methods listed in the Interface Summary. Scenes and overlays mutate progression exclusively through this class.

- [ ] **Step 1: Create the storage test double** — `test/helpers/memoryStorage.js`

```js
export function createMemoryStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)) },
    removeItem: (k) => { map.delete(k) },
    clear: () => { map.clear() }
  }
}
```

- [ ] **Step 2: Write the failing test** — `src/services/SaveService.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest'
import SaveService from './SaveService.js'
import { createMemoryStorage } from '../../test/helpers/memoryStorage.js'

const artifactEntry = {
  id: 'item_holocron', rarity: 'legendary',
  unlock_condition: { planet: 'coruscant', trigger: 'artifact' }
}
const npcEntry = {
  id: 'char_palpatine', rarity: 'legendary',
  unlock_condition: { planet: 'coruscant', trigger: 'npc_dialogue' }
}

describe('SaveService', () => {
  let storage, save
  beforeEach(() => { storage = createMemoryStorage(); save = new SaveService(storage); save.load() })

  it('starts from a fresh default state', () => {
    expect(save.state.unlockedLore).toEqual([])
    expect(save.state.cardCollection).toEqual([])
    expect(save.totalUnlocked()).toBe(0)
  })

  it('unlocks lore once and reports newness', () => {
    expect(save.unlockLore(npcEntry)).toBe(true)
    expect(save.unlockLore(npcEntry)).toBe(false)
    expect(save.isUnlocked('char_palpatine')).toBe(true)
    expect(save.totalUnlocked()).toBe(1)
  })

  it('adds a card only for artifact-trigger unlocks', () => {
    save.unlockLore(npcEntry)
    expect(save.state.cardCollection).toHaveLength(0)
    save.unlockLore(artifactEntry)
    expect(save.state.cardCollection).toHaveLength(1)
    expect(save.state.cardCollection[0].id).toBe('item_holocron')
    expect(save.state.cardCollection[0].rarity).toBe('legendary')
    expect(typeof save.state.cardCollection[0].unlockedAt).toBe('number')
  })

  it('tracks visited planets without duplicates', () => {
    save.visitPlanet('coruscant'); save.visitPlanet('coruscant'); save.visitPlanet('naboo')
    expect(save.state.visitedPlanets).toEqual(['coruscant', 'naboo'])
  })

  it('persists and reloads through storage', () => {
    save.setCurrentPlanet('naboo')
    save.unlockLore(npcEntry)
    const reloaded = new SaveService(storage)
    reloaded.load()
    expect(reloaded.state.currentPlanet).toBe('naboo')
    expect(reloaded.isUnlocked('char_palpatine')).toBe(true)
  })

  it('stores and reads planet progress', () => {
    save.setPlanetProgress('coruscant', 3, 7)
    expect(save.getPlanetProgress('coruscant')).toEqual({ found: 3, total: 7 })
    expect(save.getPlanetProgress('tatooine')).toEqual({ found: 0, total: 0 })
  })

  it('reset returns to defaults', () => {
    save.unlockLore(npcEntry); save.reset()
    expect(save.totalUnlocked()).toBe(0)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- SaveService`
Expected: FAIL — cannot import `./SaveService.js`.

- [ ] **Step 4: Write `src/services/SaveService.js`**

```js
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

  get state() { return this._state }

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
    return this._state.planetProgress[planetId] || { found: 0, total: 0 }
  }

  totalUnlocked() {
    return this._state.unlockedLore.length
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- SaveService`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add src/services/SaveService.js src/services/SaveService.test.js test/helpers/memoryStorage.js
git commit -m "feat: add SaveService localStorage progression model"
```

---

### Task 5: LoreService (seed lookup + Wookieepedia enrichment)

**Files:**
- Create: `src/services/LoreService.js`
- Test: `src/services/LoreService.test.js`

**Interfaces:**
- Consumes: `createMemoryStorage` (tests); lore entries array (injected).
- Produces: `LoreService` class + pure helpers `buildExtractUrl`, `parseExtract`, `stripHtml`. Codex (Task 11) and Terminal (Task 13) call `enrich`.

- [ ] **Step 1: Write the failing test** — `src/services/LoreService.test.js`

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- LoreService`
Expected: FAIL — cannot import `./LoreService.js`.

- [ ] **Step 3: Write `src/services/LoreService.js`**

```js
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
  return `${API_BASE}?${params.toString()}`
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
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- LoreService`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/LoreService.js src/services/LoreService.test.js
git commit -m "feat: add LoreService with Wookieepedia enrichment and caching"
```

---

### Task 6: Planet layouts + layout validator

**Files:**
- Create: `src/data/planetLayouts.js`
- Modify: `src/data/validate.js` (add `validateLayouts`)
- Test: `src/data/planetLayouts.test.js`, and extend `src/data/validate.test.js`

**Interfaces:**
- Consumes: `allLore`, `indexById` from `loreData.js`; `PLANET_IDS` from `validate.js`.
- Produces: `planetLayouts` (object keyed by planet id) and `validateLayouts(layouts, byId) -> string[]`. `GalaxyMapScene` (Task 7) reads `galaxyPos`/`faction`/`name`; `PlanetScene` (Task 9) reads `size`/`spawn`/`palette`/`landmarks`/`interactables`.

**Layout schema (per planet):**
```
{
  name: string,
  faction: 'republic' | 'separatist' | 'neutral',
  galaxyPos: { x: number, y: number },         // position on the 1280x720 galaxy map
  bg: hexInt,                                   // scene background
  palette: { floor: hexInt, accent: hexInt, structure: hexInt },
  size: { width: number, height: number },      // world bounds (>= 1280x720)
  spawn: { x: number, y: number },
  landmarks:     [ { id, name, x, y, w, h, loreId } ],     // rectangular zones, trigger 'landmark'
  interactables: [ { type: 'npc'|'terminal'|'artifact', x, y, loreId, name?, faction?, lines?[] } ]
}
```
**Rule:** per planet, `landmarks.length + interactables.length` must be between 4 and 8 (the planet's lore-point total). Every `loreId` must exist in lore data. Every `npc` interactable must have a non-empty `lines` array. NPC `lines` are game flavor written here (not lore summaries).

- [ ] **Step 1: Write the failing test** — `src/data/planetLayouts.test.js`

```js
import { describe, it, expect } from 'vitest'
import { planetLayouts } from './planetLayouts.js'
import { validateLayouts, PLANET_IDS } from './validate.js'
import { allLore, indexById } from './loreData.js'

describe('planetLayouts', () => {
  it('defines a layout for every canonical planet', () => {
    expect(Object.keys(planetLayouts).sort()).toEqual([...PLANET_IDS].sort())
  })
  it('passes cross-reference validation against lore data', () => {
    expect(validateLayouts(planetLayouts, indexById(allLore))).toEqual([])
  })
  it('every planet has 4..8 lore points', () => {
    for (const id of PLANET_IDS) {
      const l = planetLayouts[id]
      const points = l.landmarks.length + l.interactables.length
      expect(points, `${id} point count`).toBeGreaterThanOrEqual(4)
      expect(points, `${id} point count`).toBeLessThanOrEqual(8)
    }
  })
})
```

- [ ] **Step 2: Add `validateLayouts` test to `src/data/validate.test.js`**

```js
// append to src/data/validate.test.js
import { validateLayouts } from './validate.js'

describe('validateLayouts', () => {
  const byId = new Map([
    ['planet_coruscant', { id: 'planet_coruscant' }],
    ['char_x', { id: 'char_x' }]
  ])
  const base = {
    coruscant: {
      name: 'Coruscant', faction: 'republic', galaxyPos: { x: 100, y: 100 },
      bg: 0x10131a, palette: { floor: 1, accent: 2, structure: 3 },
      size: { width: 1600, height: 1200 }, spawn: { x: 800, y: 600 },
      landmarks: [{ id: 'lm1', name: 'Temple', x: 1, y: 1, w: 10, h: 10, loreId: 'planet_coruscant' }],
      interactables: [
        { type: 'npc', x: 1, y: 1, loreId: 'char_x', name: 'C', lines: ['hi'] },
        { type: 'terminal', x: 2, y: 2, loreId: 'char_x' },
        { type: 'artifact', x: 3, y: 3, loreId: 'char_x' }
      ]
    }
  }
  it('accepts a valid single-planet layout subset', () => {
    expect(validateLayouts(base, byId)).toEqual([])
  })
  it('flags a loreId missing from lore data', () => {
    const bad = structuredClone(base)
    bad.coruscant.interactables[0].loreId = 'ghost'
    expect(validateLayouts(bad, byId).some(e => e.includes('ghost'))).toBe(true)
  })
  it('flags an npc with no lines', () => {
    const bad = structuredClone(base)
    delete bad.coruscant.interactables[0].lines
    expect(validateLayouts(bad, byId).some(e => e.includes('lines'))).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- planetLayouts validate`
Expected: FAIL — `validateLayouts` not exported / `planetLayouts.js` missing.

- [ ] **Step 4: Add `validateLayouts` to `src/data/validate.js`**

```js
// append to src/data/validate.js
const FACTIONS = ['republic', 'separatist', 'neutral']

export function validateLayouts(layouts, byId) {
  const errs = []
  for (const [planetId, l] of Object.entries(layouts)) {
    if (!PLANET_IDS.includes(planetId)) errs.push(`layout "${planetId}": not a canonical planet id`)
    if (!FACTIONS.includes(l.faction)) errs.push(`${planetId}: invalid faction "${l.faction}"`)
    if (!l.galaxyPos || typeof l.galaxyPos.x !== 'number' || typeof l.galaxyPos.y !== 'number') {
      errs.push(`${planetId}: galaxyPos must have numeric x/y`)
    }
    if (!l.spawn || typeof l.spawn.x !== 'number') errs.push(`${planetId}: spawn must have numeric x/y`)
    if (!l.size || l.size.width < 1280 || l.size.height < 720) {
      errs.push(`${planetId}: size must be at least 1280x720`)
    }
    const landmarks = l.landmarks || []
    const interactables = l.interactables || []
    const points = landmarks.length + interactables.length
    if (points < 4 || points > 8) errs.push(`${planetId}: must have 4..8 lore points (has ${points})`)

    for (const lm of landmarks) {
      if (!byId.has(lm.loreId)) errs.push(`${planetId} landmark "${lm.id}": unknown loreId "${lm.loreId}"`)
    }
    for (const it of interactables) {
      if (!['npc', 'terminal', 'artifact'].includes(it.type)) {
        errs.push(`${planetId}: invalid interactable type "${it.type}"`)
      }
      if (!byId.has(it.loreId)) errs.push(`${planetId} interactable: unknown loreId "${it.loreId}"`)
      if (it.type === 'npc' && (!Array.isArray(it.lines) || it.lines.length === 0)) {
        errs.push(`${planetId} npc "${it.name || '?'}": must have non-empty lines`)
      }
    }
  }
  return errs
}
```

- [ ] **Step 5: Write `src/data/planetLayouts.js`** — all 12 planets.

Author every planet following this worked example. `loreId`s must match ids you created in Task 3. The set of `loreId`s referenced across a planet's landmarks+interactables should match (or be a subset of) the entries whose `unlock_condition.planet` is that planet. Galaxy positions should be spread across the 1280×720 map and grouped loosely by faction (Republic upper-left, Separatist lower-right, Neutral middle band).

```js
export const planetLayouts = {
  coruscant: {
    name: 'Coruscant',
    faction: 'republic',
    galaxyPos: { x: 250, y: 180 },
    bg: 0x0b0e15,
    palette: { floor: 0x1b2330, accent: 0xc8a24a, structure: 0x39414f },
    size: { width: 1800, height: 1200 },
    spawn: { x: 900, y: 600 },
    landmarks: [
      { id: 'lm_jedi_temple', name: 'Jedi Temple', x: 200, y: 160, w: 320, h: 220, loreId: 'faction_jedi_order' }
    ],
    interactables: [
      { type: 'npc', x: 1300, y: 400, loreId: 'char_palpatine', name: 'Supreme Chancellor', faction: 'republic',
        lines: [
          'Welcome to Coruscant, traveler.',
          'The Senate debates endlessly while the galaxy turns.',
          'Power... is a matter of perspective.'
        ] },
      { type: 'terminal', x: 700, y: 900, loreId: 'faction_galactic_senate' },
      { type: 'artifact', x: 1500, y: 950, loreId: 'planet_coruscant' }
    ]
  }
  // ... author the remaining 11 planets: naboo, kamino, geonosis, kashyyyk,
  // mustafar, utapau, tatooine, mandalore, ryloth, christophsis, rodia
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- planetLayouts validate`
Expected: PASS. If `validateLayouts` reports unknown `loreId`s, either add the missing lore entry (Task 3 files) or fix the reference. Re-run `npm test` fully to confirm Task 3's per-planet spread still holds.

- [ ] **Step 7: Commit**

```bash
git add src/data/planetLayouts.js src/data/validate.js src/data/planetLayouts.test.js src/data/validate.test.js
git commit -m "feat: add planet layouts and cross-reference validator"
```

---

### Task 7: Boot wiring + Galaxy map rendering

**Files:**
- Modify: `src/scenes/BootScene.js`
- Create: `src/scenes/GalaxyMapScene.js`, `src/ui/helpers.js`
- Modify: `src/main.js` (register both scenes)
- Test: `src/ui/helpers.test.js`

**Interfaces:**
- Consumes: `SaveService`, `LoreService`, `allLore`, `planetLayouts`.
- Produces: services in `game.registry` (`save`, `lore`, `uiOpen`); `GalaxyMapScene` rendering nodes/lanes/labels; `factionColor(faction)` from `helpers.js`.

- [ ] **Step 1: Write the failing test** — `src/ui/helpers.test.js`

```js
import { describe, it, expect } from 'vitest'
import { factionColor } from './helpers.js'

describe('factionColor', () => {
  it('maps known factions to distinct hex ints', () => {
    expect(factionColor('republic')).toBe(0x4a90d9)
    expect(factionColor('separatist')).toBe(0xd9534a)
    expect(factionColor('neutral')).toBe(0x9aa0a6)
  })
  it('falls back to neutral gray for unknown factions', () => {
    expect(factionColor('sith')).toBe(0x9aa0a6)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- helpers`
Expected: FAIL — `./helpers.js` missing.

- [ ] **Step 3: Create `src/ui/helpers.js`**

```js
const FACTION_COLORS = {
  republic: 0x4a90d9,
  separatist: 0xd9534a,
  neutral: 0x9aa0a6
}

export function factionColor(faction) {
  return FACTION_COLORS[faction] ?? FACTION_COLORS.neutral
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- helpers`
Expected: PASS (2 tests).

- [ ] **Step 5: Rewrite `src/scenes/BootScene.js`** to wire services into the registry

```js
import Phaser from 'phaser'
import SaveService from '../services/SaveService.js'
import LoreService from '../services/LoreService.js'
import { allLore } from '../data/loreData.js'

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  create() {
    const save = new SaveService()
    save.load()
    const lore = new LoreService({ entries: allLore })

    this.registry.set('save', save)
    this.registry.set('lore', lore)
    this.registry.set('uiOpen', false)

    this.scene.start('GalaxyMapScene')
  }
}
```

- [ ] **Step 6: Create `src/scenes/GalaxyMapScene.js`**

```js
import Phaser from 'phaser'
import { planetLayouts } from '../data/planetLayouts.js'
import { factionColor } from '../ui/helpers.js'

export default class GalaxyMapScene extends Phaser.Scene {
  constructor() { super('GalaxyMapScene') }

  create() {
    const save = this.registry.get('save')
    this.add.text(40, 30, 'GALAXY MAP', { fontFamily: 'monospace', fontSize: '28px', color: '#c8a24a' })
    this.add.text(40, 66, 'Arrow keys: select system   Enter: travel   C: codex',
      { fontFamily: 'monospace', fontSize: '14px', color: '#5b6472' })

    const ids = Object.keys(planetLayouts)

    // faint hyperspace lanes between same-faction neighbours
    const laneGfx = this.add.graphics({ lineStyle: { width: 1, color: 0x223044, alpha: 0.5 } })
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = planetLayouts[ids[i]], b = planetLayouts[ids[j]]
        if (a.faction === b.faction) {
          laneGfx.lineBetween(a.galaxyPos.x, a.galaxyPos.y, b.galaxyPos.x, b.galaxyPos.y)
        }
      }
    }

    this.nodes = ids.map((id) => {
      const l = planetLayouts[id]
      const color = factionColor(l.faction)
      const glow = this.add.circle(l.galaxyPos.x, l.galaxyPos.y, 16, color, 0.18)
      const dot = this.add.circle(l.galaxyPos.x, l.galaxyPos.y, 7, color)
      const label = this.add.text(l.galaxyPos.x + 14, l.galaxyPos.y - 8, l.name,
        { fontFamily: 'monospace', fontSize: '13px', color: '#d7dde6' })
      const prog = save.getPlanetProgress(id)
      const progLabel = this.add.text(l.galaxyPos.x + 14, l.galaxyPos.y + 8,
        `${prog.found}/${prog.total || 0}`, { fontFamily: 'monospace', fontSize: '11px', color: '#5b6472' })
      return { id, glow, dot, label, progLabel }
    })

    this.selected = 0
    this.ship = this.add.triangle(0, 0, 0, -10, -7, 8, 7, 8, 0xffffff)
    this.tweens.add({ targets: this.nodes.map(n => n.glow), alpha: 0.4, duration: 1200, yoyo: true, repeat: -1 })
    this.updateSelection()

    this.input.keyboard.on('keydown-RIGHT', () => this.cycle(1))
    this.input.keyboard.on('keydown-LEFT', () => this.cycle(-1))
    this.input.keyboard.on('keydown-DOWN', () => this.cycle(1))
    this.input.keyboard.on('keydown-UP', () => this.cycle(-1))
  }

  cycle(dir) {
    this.selected = (this.selected + dir + this.nodes.length) % this.nodes.length
    this.updateSelection()
  }

  updateSelection() {
    const node = this.nodes[this.selected]
    const l = planetLayouts[node.id]
    this.ship.setPosition(l.galaxyPos.x, l.galaxyPos.y - 24)
  }
}
```

- [ ] **Step 7: Update `src/main.js` scene list**

```js
import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'
import GalaxyMapScene from './scenes/GalaxyMapScene.js'

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#05070c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, GalaxyMapScene]
}

// eslint-disable-next-line no-new
new Phaser.Game(config)
```

- [ ] **Step 8: Browser verification**

Run: `npm run dev`
Expected: After the boot flash, the galaxy map shows 12 labelled nodes color-coded by faction (blue/red/gray), faint lanes connecting same-faction worlds, each node with a `0/0` progress label, and a white ship triangle hovering over the first node. Arrow keys move the ship between nodes. No console errors.

- [ ] **Step 9: Run full test suite**

Run: `npm test`
Expected: all prior tests still PASS.

- [ ] **Step 10: Commit**

```bash
git add src/scenes/BootScene.js src/scenes/GalaxyMapScene.js src/main.js src/ui/helpers.js src/ui/helpers.test.js
git commit -m "feat: wire services and render galaxy map"
```

---

### Task 8: Galaxy travel → planet transition

**Files:**
- Modify: `src/scenes/GalaxyMapScene.js`
- Create: `src/scenes/PlanetScene.js` (minimal stub that confirms arrival)
- Modify: `src/main.js` (register PlanetScene)

**Interfaces:**
- Consumes: registry `save`; `planetLayouts`.
- Produces: pressing Enter tweens the ship to the selected node, then `scene.start('PlanetScene', { planetId })`; `PlanetScene.init({ planetId })` records the destination and marks it visited/current.

- [ ] **Step 1: Add travel handling to `GalaxyMapScene.create`** (append after the arrow-key handlers)

```js
    this.input.keyboard.on('keydown-ENTER', () => this.travel())
    this.input.keyboard.on('keydown-SPACE', () => this.travel())
```

- [ ] **Step 2: Add the `travel` method to `GalaxyMapScene`**

```js
  travel() {
    if (this.traveling) return
    this.traveling = true
    const node = this.nodes[this.selected]
    const l = planetLayouts[node.id]
    this.tweens.add({
      targets: this.ship,
      x: l.galaxyPos.x,
      y: l.galaxyPos.y,
      duration: 500,
      onComplete: () => {
        this.traveling = false
        this.scene.start('PlanetScene', { planetId: node.id })
      }
    })
  }
```

- [ ] **Step 3: Create `src/scenes/PlanetScene.js`** (arrival stub)

```js
import Phaser from 'phaser'
import { planetLayouts } from '../data/planetLayouts.js'

export default class PlanetScene extends Phaser.Scene {
  constructor() { super('PlanetScene') }

  init(data) {
    this.planetId = data.planetId
  }

  create() {
    const save = this.registry.get('save')
    const layout = planetLayouts[this.planetId]
    save.setCurrentPlanet(this.planetId)
    save.visitPlanet(this.planetId)

    this.cameras.main.setBackgroundColor(layout.bg)
    this.add.text(40, 30, layout.name.toUpperCase(),
      { fontFamily: 'monospace', fontSize: '26px', color: '#d7dde6' }).setScrollFactor(0)
    this.add.text(40, 64, 'Esc: return to galaxy',
      { fontFamily: 'monospace', fontSize: '13px', color: '#5b6472' }).setScrollFactor(0)

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('GalaxyMapScene'))
  }
}
```

- [ ] **Step 4: Register `PlanetScene` in `src/main.js`**

```js
import PlanetScene from './scenes/PlanetScene.js'
// ...
  scene: [BootScene, GalaxyMapScene, PlanetScene]
```

- [ ] **Step 5: Browser verification**

Run: `npm run dev`
Expected: On the galaxy map, select a node and press Enter — the ship flies to it, then the scene switches to a planet screen showing that planet's name on its background color. Press Esc — you return to the galaxy map, and that node now shows the planet as visited (progress label still `0/0` until lore points exist). No console errors.

- [ ] **Step 6: Run full test suite**

Run: `npm test`
Expected: all PASS (no new tests; behavior is browser-verified).

- [ ] **Step 7: Commit**

```bash
git add src/scenes/GalaxyMapScene.js src/scenes/PlanetScene.js src/main.js
git commit -m "feat: galaxy travel and planet scene transition"
```

---

### Task 9: Planet surface — render + player movement

**Files:**
- Create: `src/objects/Player.js`, `src/objects/Interactable.js`
- Modify: `src/scenes/PlanetScene.js`

**Interfaces:**
- Consumes: `planetLayouts`, registry `uiOpen`.
- Produces: `createPlayer(scene, x, y)` → arcade-physics triangle with cursor+WASD movement via `updatePlayer(player, cursors, wasd, speed)`; `createInteractable(scene, def)` → a static visual + a returned descriptor `{ def, x, y, sprite }`. `PlanetScene` renders the full planet from its layout and stores `this.interactables` (array of descriptors) and `this.landmarkZones`.

- [ ] **Step 1: Create `src/objects/Player.js`**

```js
import Phaser from 'phaser'

export function createPlayer(scene, x, y) {
  const player = scene.add.triangle(x, y, 0, -12, -10, 10, 10, 10, 0xffffff)
  scene.physics.add.existing(player)
  player.body.setCollideWorldBounds(true)
  // glow ring
  const glow = scene.add.circle(x, y, 16, 0xffffff, 0.12)
  player.glow = glow
  return player
}

export function updatePlayer(player, cursors, wasd, speed = 220) {
  const body = player.body
  let vx = 0, vy = 0
  if (cursors.left.isDown || wasd.left.isDown) vx -= 1
  if (cursors.right.isDown || wasd.right.isDown) vx += 1
  if (cursors.up.isDown || wasd.up.isDown) vy -= 1
  if (cursors.down.isDown || wasd.down.isDown) vy += 1
  const len = Math.hypot(vx, vy) || 1
  body.setVelocity((vx / len) * speed, (vy / len) * speed)
  if (vx !== 0 || vy !== 0) player.rotation = Math.atan2(vy, vx) + Math.PI / 2
  player.glow.setPosition(player.x, player.y)
}
```

- [ ] **Step 2: Create `src/objects/Interactable.js`**

```js
import Phaser from 'phaser'

const STYLE = {
  npc: { color: 0x6fcf97, build: (s, x, y, c) => s.add.circle(x, y, 12, c) },
  terminal: { color: 0x4a90d9, build: (s, x, y, c) => s.add.rectangle(x, y, 22, 28, c) },
  artifact: { color: 0xc8a24a, build: (s, x, y, c) => s.add.star(x, y, 5, 6, 12, c) }
}

export function createInteractable(scene, def) {
  const style = STYLE[def.type]
  const color = def.type === 'npc' ? scene._factionTint(def.faction) : style.color
  const sprite = style.build(scene, def.x, def.y, color)
  scene.tweens.add({ targets: sprite, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 })
  return { def, x: def.x, y: def.y, sprite }
}
```

- [ ] **Step 3: Rewrite `src/scenes/PlanetScene.js`** to build the world and move the player

```js
import Phaser from 'phaser'
import { planetLayouts } from '../data/planetLayouts.js'
import { factionColor } from '../ui/helpers.js'
import { createPlayer, updatePlayer } from '../objects/Player.js'
import { createInteractable } from '../objects/Interactable.js'

export default class PlanetScene extends Phaser.Scene {
  constructor() { super('PlanetScene') }

  init(data) { this.planetId = data.planetId }

  _factionTint(faction) { return factionColor(faction) }

  create() {
    const save = this.registry.get('save')
    const layout = planetLayouts[this.planetId]
    this.layout = layout
    save.setCurrentPlanet(this.planetId)
    save.visitPlanet(this.planetId)

    const { width, height } = layout.size
    this.cameras.main.setBackgroundColor(layout.bg)
    this.physics.world.setBounds(0, 0, width, height)
    this.cameras.main.setBounds(0, 0, width, height)

    // floor texture: scattered structure blocks for visual texture
    const g = this.add.graphics()
    g.fillStyle(layout.palette.floor, 1).fillRect(0, 0, width, height)
    g.fillStyle(layout.palette.structure, 0.4)
    for (let i = 0; i < 40; i++) {
      const bx = Phaser.Math.Between(0, width - 80)
      const by = Phaser.Math.Between(0, height - 80)
      g.fillRect(bx, by, Phaser.Math.Between(30, 90), Phaser.Math.Between(30, 90))
    }

    // landmark zones (rectangles)
    this.landmarkZones = layout.landmarks.map((lm) => {
      const rect = this.add.rectangle(lm.x + lm.w / 2, lm.y + lm.h / 2, lm.w, lm.h, layout.palette.accent, 0.18)
      rect.setStrokeStyle(2, layout.palette.accent, 0.6)
      this.add.text(lm.x + 6, lm.y + 6, lm.name, { fontFamily: 'monospace', fontSize: '13px', color: '#d7dde6' })
      return { def: lm, rect }
    })

    // point interactables
    this.interactables = layout.interactables.map((def) => createInteractable(this, def))

    // player
    this.player = createPlayer(this, layout.spawn.x, layout.spawn.y)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    // input
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' })

    // HUD (fixed)
    this.add.text(40, 30, layout.name.toUpperCase(),
      { fontFamily: 'monospace', fontSize: '26px', color: '#d7dde6' }).setScrollFactor(0)
    this.add.text(40, 64, 'WASD/Arrows: move   E: interact   C: codex   Esc: galaxy',
      { fontFamily: 'monospace', fontSize: '13px', color: '#5b6472' }).setScrollFactor(0)

    this.input.keyboard.on('keydown-ESC', () => {
      if (this.registry.get('uiOpen')) return
      this.scene.start('GalaxyMapScene')
    })
  }

  update() {
    if (this.registry.get('uiOpen')) {
      this.player.body.setVelocity(0, 0)
      return
    }
    updatePlayer(this.player, this.cursors, this.wasd)
  }
}
```

- [ ] **Step 4: Browser verification**

Run: `npm run dev`
Expected: Travel to a planet. You see the planet's palette floor with scattered structure blocks, labelled landmark rectangle(s), pulsing interactable shapes (green circles = NPCs, blue rectangles = terminals, gold stars = artifacts), and a white player triangle. WASD/arrows move the triangle smoothly; the camera follows; the triangle points in the movement direction; it can't leave the world bounds. Esc returns to galaxy. No console errors.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/objects/Player.js src/objects/Interactable.js src/scenes/PlanetScene.js
git commit -m "feat: render planet surface with player movement and interactables"
```

---

### Task 10: Interaction system + overlay base + discovery toast

**Files:**
- Create: `src/game/interaction.js`, `src/ui/overlay.js`, `src/ui/DiscoveryToast.js`
- Modify: `src/scenes/PlanetScene.js` (proximity prompt + `E` dispatch)
- Test: `src/game/interaction.test.js`

**Interfaces:**
- Consumes: `nearestInteractable` (pure); registry `save`, `lore`, `uiOpen`.
- Produces: `nearestInteractable(pos, interactables, radius)`; `openOverlay(node, { game, onClose })` / `closeOverlay()` (sets `uiOpen` and pauses world movement); `showToast(entry)`. On `E` near an interactable, PlanetScene unlocks the lore via `save`, fires a toast, and (in later tasks) routes to the type-specific overlay. For now the dispatch logs the type and shows the toast.

- [ ] **Step 1: Write the failing test** — `src/game/interaction.test.js`

```js
import { describe, it, expect } from 'vitest'
import { nearestInteractable } from './interaction.js'

const items = [
  { x: 0, y: 0, def: { loreId: 'a' } },
  { x: 100, y: 0, def: { loreId: 'b' } },
  { x: 300, y: 300, def: { loreId: 'c' } }
]

describe('nearestInteractable', () => {
  it('returns the closest item within radius', () => {
    expect(nearestInteractable({ x: 10, y: 0 }, items, 60).def.loreId).toBe('a')
    expect(nearestInteractable({ x: 90, y: 0 }, items, 60).def.loreId).toBe('b')
  })
  it('returns null when nothing is within radius', () => {
    expect(nearestInteractable({ x: 1000, y: 1000 }, items, 60)).toBeNull()
  })
  it('returns null for an empty list', () => {
    expect(nearestInteractable({ x: 0, y: 0 }, [], 60)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- interaction`
Expected: FAIL — `./interaction.js` missing.

- [ ] **Step 3: Write `src/game/interaction.js`**

```js
export function nearestInteractable(pos, interactables, radius) {
  let best = null
  let bestDist = radius
  for (const it of interactables) {
    const d = Math.hypot(it.x - pos.x, it.y - pos.y)
    if (d <= bestDist) { bestDist = d; best = it }
  }
  return best
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- interaction`
Expected: PASS (3 tests).

- [ ] **Step 5: Create `src/ui/overlay.js`**

```js
let current = null
let currentGame = null

export function openOverlay(node, { game, onClose } = {}) {
  closeOverlay()
  const root = document.getElementById('overlay-root')
  const backdrop = document.createElement('div')
  backdrop.className = 'overlay-backdrop'
  backdrop.appendChild(node)
  root.appendChild(backdrop)
  current = backdrop
  currentGame = game
  current._onClose = onClose
  if (game) game.registry.set('uiOpen', true)

  const escHandler = (e) => { if (e.key === 'Escape') closeOverlay() }
  backdrop._escHandler = escHandler
  document.addEventListener('keydown', escHandler)
  return node
}

export function closeOverlay() {
  if (!current) return
  document.removeEventListener('keydown', current._escHandler)
  const onClose = current._onClose
  current.remove()
  if (currentGame) currentGame.registry.set('uiOpen', false)
  current = null
  currentGame = null
  if (onClose) onClose()
}
```

- [ ] **Step 6: Add overlay styles to `src/styles.css`** (append)

```css
.overlay-backdrop {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(3, 5, 10, 0.72); backdrop-filter: blur(2px);
}
.panel {
  background: #0c1019; border: 1px solid #2a3242; border-radius: 8px;
  max-width: 720px; width: 86%; max-height: 80%; overflow: auto; padding: 24px;
  box-shadow: 0 0 40px rgba(74, 144, 217, 0.15);
}
.panel h2 { margin: 0 0 4px; color: #c8a24a; font-size: 20px; }
.panel .muted { color: #5b6472; font-size: 12px; }
.panel .body { margin-top: 14px; line-height: 1.6; color: #d7dde6; }
.close-hint { margin-top: 18px; color: #5b6472; font-size: 12px; }
.toast {
  position: absolute; left: 50%; top: 90px; transform: translateX(-50%);
  background: #0c1019; border: 1px solid #c8a24a; border-radius: 6px;
  padding: 10px 18px; color: #c8a24a; font-size: 14px; animation: toastIn 0.25s ease;
}
@keyframes toastIn { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; } }
```

- [ ] **Step 7: Create `src/ui/DiscoveryToast.js`**

```js
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
```

- [ ] **Step 8: Wire proximity + `E` dispatch into `PlanetScene`.** Add to `create()` (after input setup):

```js
    this.promptText = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '13px', color: '#c8a24a' })
      .setOrigin(0.5).setDepth(50)
    this.input.keyboard.on('keydown-E', () => this.tryInteract())
```

Add these methods to `PlanetScene`:

```js
  tryInteract() {
    if (this.registry.get('uiOpen')) return
    const { nearestInteractable } = this._interaction
    const near = nearestInteractable({ x: this.player.x, y: this.player.y }, this.interactables, 70)
    if (!near) return
    const save = this.registry.get('save')
    const lore = this.registry.get('lore')
    const entry = lore.getEntry(near.def.loreId)
    const isNew = save.unlockLore(entry)
    if (isNew) {
      this._refreshProgress()
      import('./../ui/DiscoveryToast.js').then(m => m.showToast(entry))
    }
    this.dispatchInteraction(near, entry)
  }

  dispatchInteraction(near, entry) {
    // type-specific overlays are wired in Tasks 11-14; placeholder until then
    console.log('interact', near.def.type, entry.id)
  }

  _refreshProgress() {
    const save = this.registry.get('save')
    const total = this.layout.landmarks.length + this.layout.interactables.length
    const found = this._countFound()
    save.setPlanetProgress(this.planetId, found, total)
  }

  _countFound() {
    const save = this.registry.get('save')
    const ids = [
      ...this.layout.landmarks.map(l => l.loreId),
      ...this.layout.interactables.map(i => i.loreId)
    ]
    return ids.filter(id => save.isUnlocked(id)).length
  }
```

Add the import at the top of `PlanetScene.js` and store it for use:

```js
import { nearestInteractable } from '../game/interaction.js'
```
and in `create()` add: `this._interaction = { nearestInteractable }`

Add proximity prompt to `update()` (after the movement call):

```js
    const near = nearestInteractable({ x: this.player.x, y: this.player.y }, this.interactables, 70)
    if (near) {
      this.promptText.setText('Press E').setPosition(near.x, near.y - 28).setVisible(true)
    } else {
      this.promptText.setVisible(false)
    }
```

- [ ] **Step 9: Initialize planet progress total on entry.** In `create()`, after building interactables, call `this._refreshProgress()` so the galaxy map shows `x/total` even before discoveries.

- [ ] **Step 10: Browser verification**

Run: `npm run dev`
Expected: On a planet, walking near an interactable shows a gold "Press E" prompt above it. Pressing `E` shows a gold toast ("Lore discovered — <title>") the first time only. Returning to the galaxy map (Esc) shows that planet's progress count incremented (e.g. `1/4`). Re-entering and re-pressing E on the same item shows no toast (already unlocked). Movement freezes while... (no overlay yet — verify movement still works). Console logs `interact <type> <id>`.

- [ ] **Step 11: Run full test suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 12: Commit**

```bash
git add src/game/interaction.js src/ui/overlay.js src/ui/DiscoveryToast.js src/styles.css src/scenes/PlanetScene.js src/game/interaction.test.js
git commit -m "feat: interaction system, overlay base, and discovery toast"
```

---

### Task 11: Codex overlay (with Wookieepedia enrichment)

**Files:**
- Create: `src/ui/Codex.js`
- Modify: `src/ui/helpers.js` (add `groupByCategory`), `src/scenes/GalaxyMapScene.js` and `src/scenes/PlanetScene.js` (open codex on `C`)
- Test: extend `src/ui/helpers.test.js`

**Interfaces:**
- Consumes: registry `lore`, `save`, the Phaser `game`; `groupByCategory`; `openOverlay`/`closeOverlay`; `LoreService.enrich`.
- Produces: `openCodex(loreService, save, game)` rendering unlocked entries grouped by category, each expandable to show Summary and an Extended tab that lazy-loads `enrich`. `groupByCategory(entries)`.

- [ ] **Step 1: Add the failing test** — append to `src/ui/helpers.test.js`

```js
import { groupByCategory } from './helpers.js'

describe('groupByCategory', () => {
  it('groups entries by their category in canonical order', () => {
    const g = groupByCategory([
      { id: 'a', category: 'characters' },
      { id: 'b', category: 'planets' },
      { id: 'c', category: 'characters' }
    ])
    expect(Object.keys(g)).toEqual(['planets', 'characters'])
    expect(g.characters.map(e => e.id)).toEqual(['a', 'c'])
    expect(g.planets.map(e => e.id)).toEqual(['b'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- helpers`
Expected: FAIL — `groupByCategory` is not exported.

- [ ] **Step 3: Add `groupByCategory` to `src/ui/helpers.js`**

```js
import { CATEGORIES } from '../data/validate.js'

export function groupByCategory(entries) {
  const out = {}
  for (const cat of CATEGORIES) {
    const inCat = entries.filter(e => e.category === cat)
    if (inCat.length) out[cat] = inCat
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- helpers`
Expected: PASS (3 tests total).

- [ ] **Step 5: Create `src/ui/Codex.js`**

```js
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
```

- [ ] **Step 6: Add codex styles to `src/styles.css`** (append)

```css
.codex-section h3 { color: #9aa0a6; margin: 18px 0 6px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
.codex-entry { border-top: 1px solid #1b2230; }
.codex-title { width: 100%; text-align: left; background: none; border: none; color: #d7dde6;
  padding: 10px 0; font: inherit; cursor: pointer; }
.codex-title:hover { color: #fff; }
.rarity { font-size: 11px; padding: 1px 6px; border-radius: 4px; margin-left: 6px; }
.rarity.common { background: #2a3242; color: #9aa0a6; }
.rarity.rare { background: #1d3a52; color: #4a90d9; }
.rarity.legendary { background: #3a2f12; color: #c8a24a; }
.codex-detail { padding: 0 0 12px; }
.tabs { display: flex; gap: 8px; margin-bottom: 8px; }
.tab { background: none; border: 1px solid #2a3242; color: #5b6472; border-radius: 4px;
  padding: 3px 10px; cursor: pointer; font: inherit; font-size: 12px; }
.tab.active { color: #c8a24a; border-color: #c8a24a; }
.tab-panel { line-height: 1.6; }
```

- [ ] **Step 7: Open codex on `C` in both scenes.** In `GalaxyMapScene.create()` add:

```js
    this.input.keyboard.on('keydown-C', () => {
      import('../ui/Codex.js').then(m =>
        m.openCodex(this.registry.get('lore'), this.registry.get('save'), this.game))
    })
```

In `PlanetScene.create()` add the same handler, guarded:

```js
    this.input.keyboard.on('keydown-C', () => {
      if (this.registry.get('uiOpen')) return
      import('../ui/Codex.js').then(m =>
        m.openCodex(this.registry.get('lore'), this.registry.get('save'), this.game))
    })
```

- [ ] **Step 8: Browser verification**

Run: `npm run dev`
Expected: Press `C` on the galaxy map → codex opens showing "0 / N discovered" and an empty-state message. Discover some lore on a planet (press E), then press `C` → entries appear grouped by category with rarity badges. Click a title to expand; "Summary" shows the seed text; click "Extended" → "Loading from Wookieepedia…" then real article text appears (requires internet). Disconnect internet and click Extended on a fresh entry → graceful "unavailable offline" message, no error. Esc closes the codex and movement resumes. No console errors.

- [ ] **Step 9: Run full test suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add src/ui/Codex.js src/ui/helpers.js src/ui/helpers.test.js src/styles.css src/scenes/GalaxyMapScene.js src/scenes/PlanetScene.js
git commit -m "feat: codex overlay with Wookieepedia enrichment"
```

---

### Task 12: Collectible card reveal (artifact pickups)

**Files:**
- Create: `src/ui/CardReveal.js`
- Modify: `src/ui/helpers.js` (add `rarityClass`), `src/scenes/PlanetScene.js` (`dispatchInteraction` routes `artifact`)
- Test: extend `src/ui/helpers.test.js`

**Interfaces:**
- Consumes: `openOverlay`/`closeOverlay`; `rarityClass`; registry `game`.
- Produces: `openCardReveal(entry, game)` showing a flip animation revealing the lore card; `rarityClass(rarity)`.

- [ ] **Step 1: Add the failing test** — append to `src/ui/helpers.test.js`

```js
import { rarityClass } from './helpers.js'

describe('rarityClass', () => {
  it('returns a namespaced class for known rarities', () => {
    expect(rarityClass('legendary')).toBe('card-legendary')
    expect(rarityClass('rare')).toBe('card-rare')
    expect(rarityClass('common')).toBe('card-common')
  })
  it('falls back to common for unknown rarity', () => {
    expect(rarityClass('mythic')).toBe('card-common')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- helpers`
Expected: FAIL — `rarityClass` not exported.

- [ ] **Step 3: Add `rarityClass` to `src/ui/helpers.js`**

```js
export function rarityClass(rarity) {
  const known = ['common', 'rare', 'legendary']
  return `card-${known.includes(rarity) ? rarity : 'common'}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- helpers`
Expected: PASS.

- [ ] **Step 5: Create `src/ui/CardReveal.js`**

```js
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
```

- [ ] **Step 6: Add card styles to `src/styles.css`** (append)

```css
.card-stage { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.card { width: 300px; height: 420px; perspective: 1000px; }
.card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.7s;
  transform-style: preserve-3d; }
.card.flipped .card-inner { transform: rotateY(180deg); }
.card-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 12px;
  border: 2px solid #2a3242; display: flex; flex-direction: column; padding: 22px; }
.card-back { background: #0c1019; align-items: center; justify-content: center; font-size: 64px; color: #2a3242; }
.card-front { transform: rotateY(180deg); background: #0c1019; gap: 10px; }
.card-rarity { text-transform: uppercase; letter-spacing: 2px; font-size: 12px; }
.card-title { font-size: 22px; color: #fff; }
.card-summary { font-size: 13px; line-height: 1.5; color: #d7dde6; flex: 1; }
.card-cat { font-size: 11px; color: #5b6472; text-transform: uppercase; }
.card-common .card-front { box-shadow: 0 0 24px rgba(154,160,166,0.25); }
.card-common .card-rarity { color: #9aa0a6; }
.card-rare .card-front { box-shadow: 0 0 30px rgba(74,144,217,0.4); border-color: #4a90d9; }
.card-rare .card-rarity { color: #4a90d9; }
.card-legendary .card-front { box-shadow: 0 0 40px rgba(200,162,74,0.5); border-color: #c8a24a; }
.card-legendary .card-rarity { color: #c8a24a; }
```

- [ ] **Step 7: Route artifact interactions in `PlanetScene.dispatchInteraction`**

```js
  dispatchInteraction(near, entry) {
    const type = near.def.type
    if (type === 'artifact') {
      import('../ui/CardReveal.js').then(m => m.openCardReveal(entry, this.game))
    } else {
      console.log('interact', type, entry.id) // npc/terminal wired in Tasks 13-14
    }
  }
```

- [ ] **Step 8: Browser verification**

Run: `npm run dev`
Expected: Walk to a gold star (artifact), press E. A toast fires, then a card appears face-down and flips to reveal the lore with rarity-colored glow (gold for legendary, blue for rare, gray for common). Esc closes it; movement resumes. The card also now appears in the codex. No console errors.

- [ ] **Step 9: Run full test suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add src/ui/CardReveal.js src/ui/helpers.js src/ui/helpers.test.js src/styles.css src/scenes/PlanetScene.js
git commit -m "feat: collectible card reveal for artifact pickups"
```

---

### Task 13: Holographic terminal overlay

**Files:**
- Create: `src/ui/Terminal.js`
- Modify: `src/scenes/PlanetScene.js` (`dispatchInteraction` routes `terminal`)

**Interfaces:**
- Consumes: `openOverlay`; registry `game`, `lore`; `LoreService.enrich`.
- Produces: `openTerminal(entry, loreService, game)` — scanline panel with a typewriter reveal of the summary, then appends enriched text if available.

- [ ] **Step 1: Create `src/ui/Terminal.js`**

```js
import { openOverlay } from './overlay.js'

export function openTerminal(entry, loreService, game) {
  const panel = document.createElement('div')
  panel.className = 'panel terminal'
  panel.innerHTML = `
    <div class="scanlines"></div>
    <h2>// ${entry.title.toUpperCase()}</h2>
    <div class="muted">HOLONET ARCHIVE · ${entry.category.toUpperCase()}</div>
    <div class="body terminal-text"></div>
    <div class="close-hint">Esc to close</div>`
  openOverlay(panel, { game })

  const target = panel.querySelector('.terminal-text')
  typewriter(target, entry.summary, async () => {
    const extended = await loreService.enrich(entry.id)
    if (extended) {
      const more = document.createElement('div')
      more.style.marginTop = '12px'
      target.appendChild(more)
      typewriter(more, '\n> ARCHIVE EXPANDED:\n' + extended)
    }
  })
}

function typewriter(el, text, onDone, speed = 12) {
  let i = 0
  const span = document.createElement('span')
  el.appendChild(span)
  const timer = setInterval(() => {
    span.textContent += text[i] ?? ''
    i++
    if (i >= text.length) { clearInterval(timer); if (onDone) onDone() }
  }, speed)
}
```

- [ ] **Step 2: Add terminal styles to `src/styles.css`** (append)

```css
.terminal { position: relative; border-color: #4a90d9; box-shadow: 0 0 40px rgba(74,144,217,0.25); }
.terminal h2 { color: #4a90d9; }
.terminal .terminal-text { white-space: pre-wrap; font-size: 14px; color: #bfe0ff; min-height: 60px; }
.scanlines { position: absolute; inset: 0; pointer-events: none; border-radius: 8px;
  background: repeating-linear-gradient(rgba(74,144,217,0.05) 0 1px, transparent 1px 3px); }
```

- [ ] **Step 3: Route terminal interactions in `PlanetScene.dispatchInteraction`**

```js
  dispatchInteraction(near, entry) {
    const type = near.def.type
    if (type === 'artifact') {
      import('../ui/CardReveal.js').then(m => m.openCardReveal(entry, this.game))
    } else if (type === 'terminal') {
      import('../ui/Terminal.js').then(m => m.openTerminal(entry, this.registry.get('lore'), this.game))
    } else {
      console.log('interact', type, entry.id) // npc wired in Task 14
    }
  }
```

- [ ] **Step 4: Browser verification**

Run: `npm run dev`
Expected: Walk to a blue rectangle (terminal), press E. A blue scanline panel opens and types out the summary character-by-character; if online, it then types an "ARCHIVE EXPANDED" section with Wookieepedia text. Esc closes. No console errors.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/Terminal.js src/styles.css src/scenes/PlanetScene.js
git commit -m "feat: holographic terminal overlay with typewriter reveal"
```

---

### Task 14: NPC dialogue overlay

**Files:**
- Create: `src/ui/DialogueBox.js`
- Modify: `src/scenes/PlanetScene.js` (`dispatchInteraction` routes `npc`)

**Interfaces:**
- Consumes: `openOverlay`/`closeOverlay`; `factionColor`; registry `game`. NPC `lines` come from the interactable `def`; the lore `entry` provides title/summary shown after the dialogue.
- Produces: `openDialogue(def, entry, game)` — steps through `def.lines`, then reveals the lore summary as a closing beat.

- [ ] **Step 1: Create `src/ui/DialogueBox.js`**

```js
import { openOverlay, closeOverlay } from './overlay.js'
import { factionColor } from './helpers.js'

export function openDialogue(def, entry, game) {
  const panel = document.createElement('div')
  panel.className = 'panel dialogue'
  const hex = '#' + factionColor(def.faction).toString(16).padStart(6, '0')
  const lines = [...def.lines, `「 Lore unlocked: ${entry.title} 」\n${entry.summary}`]
  let idx = 0

  panel.innerHTML = `
    <h2 style="color:${hex}">${def.name || 'Unknown'}</h2>
    <div class="muted">${def.faction || 'unaligned'}</div>
    <div class="body dialogue-line"></div>
    <button class="dialogue-next">Next ▸</button>
    <div class="close-hint">Esc to close</div>`

  const lineEl = panel.querySelector('.dialogue-line')
  const nextBtn = panel.querySelector('.dialogue-next')

  const render = () => {
    lineEl.textContent = lines[idx]
    nextBtn.textContent = idx >= lines.length - 1 ? 'Close ✕' : 'Next ▸'
  }
  nextBtn.addEventListener('click', () => {
    if (idx >= lines.length - 1) { closeOverlay(); return }
    idx++; render()
  })
  render()
  openOverlay(panel, { game })
}
```

- [ ] **Step 2: Add dialogue styles to `src/styles.css`** (append)

```css
.dialogue .dialogue-line { white-space: pre-wrap; min-height: 80px; font-size: 15px; }
.dialogue-next { margin-top: 14px; background: none; border: 1px solid #2a3242; color: #d7dde6;
  border-radius: 4px; padding: 6px 14px; cursor: pointer; font: inherit; }
.dialogue-next:hover { border-color: #c8a24a; color: #c8a24a; }
```

- [ ] **Step 3: Route npc interactions in `PlanetScene.dispatchInteraction`** (final form — replace the method)

```js
  dispatchInteraction(near, entry) {
    const type = near.def.type
    if (type === 'artifact') {
      import('../ui/CardReveal.js').then(m => m.openCardReveal(entry, this.game))
    } else if (type === 'terminal') {
      import('../ui/Terminal.js').then(m => m.openTerminal(entry, this.registry.get('lore'), this.game))
    } else if (type === 'npc') {
      import('../ui/DialogueBox.js').then(m => m.openDialogue(near.def, entry, this.game))
    }
  }
```

- [ ] **Step 4: Browser verification**

Run: `npm run dev`
Expected: Walk to a green circle (NPC), press E. A dialogue panel opens with the NPC's faction-colored name; "Next" steps through the flavor lines; the final beat reveals the unlocked lore title and summary; "Close" dismisses it. The entry is in the codex afterward. No console errors.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/DialogueBox.js src/styles.css src/scenes/PlanetScene.js
git commit -m "feat: NPC dialogue overlay"
```

---

### Task 15: Landmark auto-unlock zones

**Files:**
- Modify: `src/scenes/PlanetScene.js`

**Interfaces:**
- Consumes: `this.landmarkZones`, registry `save`/`lore`.
- Produces: entering a landmark rectangle auto-unlocks its lore (codex trigger), fires a toast once, and updates progress — no key press required.

- [ ] **Step 1: Track entered landmarks.** In `PlanetScene.create()`, after building `this.landmarkZones`, add:

```js
    this._enteredLandmarks = new Set()
```

- [ ] **Step 2: Detect landmark entry in `update()`.** Add after the proximity-prompt block (only when no overlay is open):

```js
    if (!this.registry.get('uiOpen')) {
      for (const zone of this.landmarkZones) {
        const lm = zone.def
        const inside = this.player.x >= lm.x && this.player.x <= lm.x + lm.w &&
                       this.player.y >= lm.y && this.player.y <= lm.y + lm.h
        if (inside && !this._enteredLandmarks.has(lm.id)) {
          this._enteredLandmarks.add(lm.id)
          const save = this.registry.get('save')
          const entry = this.registry.get('lore').getEntry(lm.loreId)
          if (save.unlockLore(entry)) {
            this._refreshProgress()
            import('../ui/DiscoveryToast.js').then(m => m.showToast(entry))
          }
        }
      }
    }
```

- [ ] **Step 3: Browser verification**

Run: `npm run dev`
Expected: Walk the player triangle into a labelled landmark rectangle (e.g. "Jedi Temple"). A toast fires once on entry, the codex gains the entry, and the planet progress increments. Walking out and back in does not re-fire. No console errors.

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/PlanetScene.js
git commit -m "feat: landmark zones auto-unlock codex lore on entry"
```

---

### Task 16: Progression — galaxy completion bar + persistence polish

**Files:**
- Modify: `src/scenes/GalaxyMapScene.js`

**Interfaces:**
- Consumes: registry `save`/`lore`; `planetLayouts`.
- Produces: a global completion bar on the galaxy map; per-node progress labels reflect persisted `planetProgress`; values survive reload.

- [ ] **Step 1: Add a global completion bar to `GalaxyMapScene.create()`** (after the title text)

```js
    const lore = this.registry.get('lore')
    const totalLore = lore.getAllEntries().length
    const found = save.totalUnlocked()
    const pct = totalLore ? Math.round((found / totalLore) * 100) : 0

    const barX = 40, barY = 100, barW = 320, barH = 10
    this.add.rectangle(barX, barY, barW, barH, 0x1b2230).setOrigin(0, 0.5)
    this.add.rectangle(barX, barY, barW * (found / Math.max(totalLore, 1)), barH, 0xc8a24a).setOrigin(0, 0.5)
    this.add.text(barX + barW + 12, barY, `${found}/${totalLore} lore (${pct}%)`,
      { fontFamily: 'monospace', fontSize: '12px', color: '#c8a24a' }).setOrigin(0, 0.5)
```

- [ ] **Step 2: Ensure per-node progress labels use persisted totals.** Confirm the `progLabel` in Task 7 reads `save.getPlanetProgress(id)`; since `PlanetScene._refreshProgress` now sets totals on entry, returning to the map shows correct `found/total`. No code change needed if already correct — verify by reading the node-building loop.

- [ ] **Step 3: Browser verification (with reload)**

Run: `npm run dev`
Expected: Discover lore across two planets. Return to the galaxy map — the gold completion bar reflects total progress and shows `found/total (pct%)`; each visited node shows its own `found/total`. **Reload the browser tab** — boot returns you to the galaxy map (or last scene per BootScene) and all progress, codex entries, and cards persist (loaded from `localStorage`). No console errors.

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GalaxyMapScene.js
git commit -m "feat: galaxy completion bar and persisted progress display"
```

---

### Task 17: README, production build, and final playthrough

**Files:**
- Create: `README.md`
- Verify: production build

**Interfaces:**
- Consumes: the whole app.
- Produces: documentation + a verified `dist/` build.

- [ ] **Step 1: Create `README.md`**

```markdown
# Star Wars Lore Explorer

A 2D browser game: explore a prequel-era galaxy and collect Wookieepedia-grounded lore.

## Run locally
```
npm install
npm run dev
```
Open the printed localhost URL.

## Controls
- **Arrow keys** — select a system (galaxy map)
- **Enter / Space** — travel to the selected system
- **WASD / Arrow keys** — move (planet surface)
- **E** — interact (NPCs, terminals, artifacts)
- **C** — open the codex
- **Esc** — close an overlay / return to the galaxy map

## Lore modes
Codex (browsable encyclopedia), collectible cards (artifacts), holographic terminals, and NPC dialogue. Each entry ships with a curated summary and lazy-loads extended lore from the Wookieepedia API when online; everything is cached and the game is fully playable offline.

## Test
```
npm test
```

## Build
```
npm run build
npm run preview
```

## Tech
Phaser.js 3 · Vite · Vitest. No backend; progress is saved to `localStorage`.
```

- [ ] **Step 2: Run the full test suite one final time**

Run: `npm test`
Expected: all tests PASS. Note the count.

- [ ] **Step 3: Produce and preview a production build**

Run: `npm run build`
Expected: Vite writes `dist/` with no errors.
Then: `npm run preview`
Open the URL. Expected: the game runs identically to dev — galaxy map, travel, all four lore modes, codex, persistence.

- [ ] **Step 4: Final manual playthrough checklist** (do all, in one session)

- [ ] Galaxy map shows 12 faction-colored nodes + completion bar
- [ ] Travel to at least 3 different planets
- [ ] Trigger each lore mode at least once: NPC dialogue, terminal, artifact card, landmark zone
- [ ] Open codex; confirm grouped entries, rarity badges, Summary tab, Extended tab loads online and degrades offline
- [ ] Confirm toasts fire once per discovery (not on repeat)
- [ ] Reload the tab; confirm all progress persists
- [ ] No errors in the browser console throughout

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add README and finalize v1"
```

- [ ] **Step 6: Push**

```bash
git push
```

---

## Self-Review

**1. Spec coverage:**
- Web + Phaser.js → Task 1. ✓
- Minimalist geometric art → Tasks 7, 9 (shapes only, no imported art; enforced by Global Constraints). ✓
- Prequel era → Task 3 content + Global Constraints. ✓
- Galaxy map (12 nodes, faction colors, lanes, ship) → Tasks 7, 8. ✓
- Planet surfaces (palette, player triangle, WASD, landmarks/NPCs/artifacts/terminals) → Tasks 6, 9. ✓
- Hybrid lore (seed JSON + Wookieepedia enrich + cache + 5s timeout + silent failure) → Tasks 3, 5, 11, 13. ✓
- Four presentation modes (codex, cards, terminals, dialogue) → Tasks 11–14. ✓
- Discovery toast fires first → Tasks 10, 15. ✓
- localStorage save state (currentPlanet, visitedPlanets, unlockedLore, cardCollection, planetProgress) → Task 4. ✓
- Per-planet progress + global completion → Tasks 10, 16. ✓
- Out-of-scope items (multiplayer, combat, procedural, audio, mobile, other eras) → not implemented. ✓

**2. Placeholder scan:** Content tasks (3, 6) use enforcing tests rather than vague "fill in later" — the test asserts counts, validity, and cross-references, so completeness is verifiable. The one `console.log` in Task 10's `dispatchInteraction` is an explicit interim stub, replaced fully by Task 14. No "TBD"/"add error handling"/undefined-reference steps remain. ✓

**3. Type consistency:** `unlockLore(entry)` takes the full entry everywhere (Tasks 4, 10, 15). `getPlanetProgress` returns `{found,total}` (Tasks 4, 7, 16). `openOverlay(node, {game,onClose})` / `closeOverlay()` signature consistent across all overlays (Tasks 10–14). `factionColor` returns a hex int; DialogueBox converts to CSS hex string explicitly (Task 14). `nearestInteractable(pos, list, radius)` consistent (Tasks 10). Registry keys `save`/`lore`/`uiOpen` consistent throughout. ✓
