# Star Wars Lore Explorer — Quests & Traversal Challenges (Expansion 1)
**Date:** 2026-06-30
**Builds on:** the completed base game (`docs/superpowers/specs/2026-06-29-star-wars-lore-explorer-design.md`)
**Status:** Design — first of a sequenced expansion (quests → combat → graphics pass)

---

## Overview

The base game is a no-combat lore-collection explorer across 12 prequel-era planets. This expansion adds **purpose and stakes** without abandoning the lore core: NPC-given **investigation chains** (multi-step questlines retracing real prequel storylines across planets), advanced through existing interactions plus **traversal/skill challenges** played out on the planet surface. Challenges introduce the game's first fail/retry stakes via a **shared health bar** — deliberately designed so the later combat expansion reuses the same health system.

Quests are **optional and parallel**: the game remains a free-exploration lore-explorer; quests and challenges are an added layer, never a wall.

### Goals
- Give the existing exploration direction and narrative momentum.
- Add active gameplay (hazard traversal) beyond walking and interacting.
- Establish a health/damage foundation the combat expansion will build on.
- Keep the minimalist geometric aesthetic and the calm overworld intact.

### Non-goals (this expansion)
- Combat / enemies (next expansion; health system is the shared foundation).
- A full graphics overhaul (later expansion; new elements here stay on-style but a dedicated visual pass comes later).
- Branching/choice-driven narrative — chains are linear.
- Economy, inventory, character stats beyond health.

---

## Architecture & Module Breakdown

The base game keeps its shape. `PlanetScene` *composes* the new systems but does not implement them.

**New pure/logic modules (unit-tested):**
```
src/data/quests.js            # Investigation-chain definitions + validateQuests
src/quests/QuestService.js    # Quest state machine (available→active→completed)
src/quests/objectives.js      # Pure objective-event matching
src/challenge/health.js       # Shared health model (current/max/damage/heal/isDead)
```

**New Phaser/DOM modules:**
```
src/challenge/ChallengeController.js  # Runs a challenge zone inside PlanetScene
src/objects/Hazard.js                 # Hazard factory (static/patrol/sweep)
src/ui/QuestLog.js                    # Journal overlay (J key)
src/ui/HealthBar.js                   # HUD health bar (during challenges)
src/ui/ObjectiveTracker.js            # Current-objective HUD line + world markers
```

**Extended files:**
```
src/services/SaveService.js   # + quests state, maxHealth, upgrades
src/data/planetLayouts.js     # + per-planet challenge-zone definitions
src/data/holocrons.json       # + reward-only lore entries (new 'holocrons' category)
src/scenes/PlanetScene.js     # Emits interaction events; renders markers; enters challenges
src/scenes/GalaxyMapScene.js  # Galaxy markers on planets with active objectives
src/ui/DialogueBox.js         # "Accept quest" beat when a giver NPC has an available quest
src/data/validate.js          # CATEGORIES gains 'holocrons'
```

### Module responsibilities
- **QuestService** — owns quest state; `accept(questId)`, `advance(event)`, `track(questId)`, getters for active/available/completed and the tracked objective. Persists through `SaveService`. No Phaser dependency.
  - **Pre-satisfied objectives:** when a step becomes the current step (on accept, and after each advance), QuestService checks whether the current objective is *already* satisfied by stateful progress — a `discover` whose lore is already unlocked, or a `challenge` already cleared — and auto-advances past it (chaining through consecutive pre-satisfied steps). This prevents a soft-lock where the player did the thing before the quest asked. (`talk`/`enter` are momentary and cannot be pre-satisfied.)
- **objectives.js** — `matchesObjective(objective, event) -> boolean`, the single source of truth for "did this event satisfy this step." Pure.
- **health.js** — plain object/class: `{ current, max }`, `damage(n)`, `heal(n)`, `setMax(n)`, `isDead()`. Clamped to `[0, max]`. Pure.
- **ChallengeController** — Phaser glue: given a challenge definition + scene + health + onCleared callback, spawns hazards, manages checkpoint respawn, detects goal, reports cleared. The only place challenge runtime lives.
- **Hazard** — factory returning a geometric sprite with a movement behavior and a `damage` value; exposes its collision body.

---

## Data Model

### Quest chain — `src/data/quests.js`
A linear, ordered investigation:

```js
{
  id: 'quest_naboo_invasion',
  title: 'Shadows over Naboo',
  giver: { planet: 'naboo', npcLoreId: 'char_padme_amidala' },
  summary: 'Uncover how the Trade Federation blockade of Naboo came to be.',
  steps: [
    { id: 's1', hint: 'Speak with Senator Palpatine on Coruscant',
      objective: { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' } },
    { id: 's2', hint: 'Find evidence of the Trade Federation deal',
      objective: { type: 'discover', loreId: 'faction_trade_federation' } },
    { id: 's3', hint: 'Slip through the occupied palace to the throne room',
      objective: { type: 'challenge', planet: 'naboo', challengeId: 'naboo_palace' } },
    { id: 's4', hint: 'Confront the truth at the Theed hangar',
      objective: { type: 'enter', planet: 'naboo', landmarkId: 'lm_theed_hangar' } }
  ],
  reward: { holocronLoreId: 'holo_naboo', maxHealthBonus: 20 }
}
```

### Objective types (4)
| type | satisfied when | event reported by |
|---|---|---|
| `talk` | player interacts with the NPC whose loreId matches `npcLoreId` on `planet` | PlanetScene NPC dispatch |
| `discover` | the lore entry `loreId` becomes unlocked | SaveService.unlockLore (any source) |
| `enter` | player enters the landmark zone `landmarkId` on `planet` | PlanetScene landmark detection |
| `challenge` | the challenge `challengeId` on `planet` is cleared | ChallengeController onCleared |

The first three reuse existing interaction events verbatim; they are simply also reported to `QuestService.advance(event)`.

### Challenge definition — in `src/data/planetLayouts.js`, per planet
```js
challenges: {
  naboo_palace: {
    name: 'Royal Palace (Occupied)',
    bounds:     { x, y, w, h },   // challenge area on the planet map (within planet size)
    checkpoint: { x, y },          // respawn point (inside bounds)
    goal:       { x, y, w, h },    // reach to clear (inside bounds)
    hazards: [
      { type: 'patrol', x, y, w, h, damage: 20, speed: 120, axis: 'x', range: 300 },
      { type: 'sweep',  x, y, length: 240, damage: 34, speed: 90 },
      { type: 'static', x, y, w, h, damage: 10 }
    ]
  }
}
```

### Reward holocrons — `src/data/holocrons.json`
New lore entries in a `holocrons` category, schema-identical to existing lore (`id`, `title`, `category: 'holocrons'`, `summary`, `wookieepedia_slug`, `rarity`, `unlock_condition`). `unlock_condition.trigger` is `'quest'` (a 5th trigger value). One holocron per chain. They appear in the Codex like any lore, but are obtainable only by completing their chain.

### Validation — `validateQuests(quests, byId, layouts)` in `validate.js`
Fails a unit test (not the game) if any quest references a non-existent `npcLoreId`/`loreId`/`landmarkId`/`challengeId`/`holocronLoreId`, an unknown objective `type`, a `giver` NPC not present on its planet, a challenge whose `checkpoint`/`goal` lie outside `bounds`, `bounds` outside the planet `size`, or an unknown hazard `type`. `TRIGGERS` gains `'quest'`; `CATEGORIES` gains `'holocrons'`.

**Authoring note:** chains reference real NPCs, lore, landmarks, and challenge zones. Where a referenced giver/`talk` NPC or `enter` landmark is not already present on the named planet's layout (the base game's lore rebalance moved some entries between planets), the implementation must add or adjust those interactables/landmarks in `planetLayouts.js` so references resolve. `validateQuests` is the gate that enforces this — chain authoring is complete only when it passes.

---

## Health & Challenge Mechanics

### Health — `src/challenge/health.js`
- `current` / `max`, default max 100. `damage(n)` and `heal(n)` clamp to `[0, max]`; `isDead()` is `current <= 0`; `setMax(n)` raises the ceiling (used by max-health rewards) and does not reduce `current`.
- **Transient:** `current` is not persisted — it restores to full on session start and on entering a challenge. Only `maxHealth` (and upgrades) persist via `SaveService`.
- Outside a challenge the overworld is calm: the health bar is hidden and no damage source exists.

### Entering / running a challenge (hybrid model — all on the planet map)
- When the player's position enters a challenge zone's `bounds`, `ChallengeController.arm()` runs: health restores to full, the HUD health bar fades in, hazards begin their motion, and the checkpoint is set to the zone's `checkpoint`. The rest of the planet remains present and visible — the player has not left the map.
- **Hazards** (`src/objects/Hazard.js`), geometric, danger-colored (red-orange family):
  - `static` — a fixed damaging field/block (e.g., lava vent).
  - `patrol` — a shape sliding back and forth along `axis` over `range` at `speed` (security droid).
  - `sweep` — a bar/beam of `length` rotating about its anchor at `speed` (scanning laser).
- **Contact:** on overlap a hazard applies `damage` once, then the player gets ~1s invulnerability (visual fl/blink) + a small knockback away from the hazard, preventing instant drain.

### Failing & clearing
- **Health 0 →** respawn at the `checkpoint` with full health; hazards keep running (the player is set back, not punished harshly). A brief "Knocked back" toast.
- **Player overlaps `goal` →** challenge **cleared**: hazards stop, the bar fades out, a `challenge_cleared` event (`{ type:'challenge', planet, challengeId }`) is sent to `QuestService.advance`. Cleared challenges are saved (`SaveService`); a cleared challenge does not re-arm on re-entry, so the player may re-cross freely.
- Leaving a challenge's `bounds` before clearing it disarms it (bar hides, hazards reset to start positions, health restores); re-entering re-arms from the checkpoint. No penalty for backing out.

---

## Quest Log, Objective Tracking & Markers

### Quest Log overlay — `src/ui/QuestLog.js` (key: **J**)
Parallels the Codex; uses `openOverlay`/`closeOverlay` (so the Esc-close fix and `uiOpen` movement-pause apply automatically). Three sections:
- **Active** — title, summary, and a step checklist with the current step highlighted; a "Track" button to make a quest the tracked one.
- **Available** — title + "Offered by \<NPC name\> on \<planet name\>".
- **Completed** — title + a "✓" and the holocron earned.

Opened from both `GalaxyMapScene` and `PlanetScene` (the latter guarded by `uiOpen`), matching the Codex's `C` wiring.

### Objective tracker — `src/ui/ObjectiveTracker.js`
A fixed HUD line (top-right, `setScrollFactor(0)` in-scene or a DOM element) showing the tracked quest's current step `hint`, e.g. *"▸ Slip through the occupied palace."* One tracked quest at a time; default to the most recently accepted; switchable from the log. Hidden when no quest is tracked.

### World & galaxy markers
- On the planet surface, the tracked objective's on-planet target (NPC / landmark / challenge entrance) shows a subtle pulsing ring.
- If the tracked objective is on a **different** planet, `GalaxyMapScene` shows a pulsing marker on that planet's node so the player knows where to travel.

### Accepting & advancing
- Talking to a giver NPC who has an **available** quest appends an "Accept quest: \<title\>" beat to the existing `DialogueBox` chain; confirming calls `QuestService.accept`.
- Every existing interaction the player performs (`talk`/`discover`/`enter`) and every `challenge_cleared` is reported to `QuestService.advance(event)`. It advances any active quest whose **current** objective matches (via `objectives.matchesObjective`), fires an "Objective complete" toast, and on the final step marks the quest completed and grants its reward (holocron unlock via `SaveService.unlockLore` + card reveal; `maxHealthBonus` applied to persisted `maxHealth`).

---

## Rewards & Progression

- **Holocron** — an exclusive `holocrons`-category lore entry per chain, unlocked only by completing it; surfaced through the normal unlock toast + card reveal and visible in the Codex.
- **Max-health upgrade** — `+20` to persisted `maxHealth` per chain, making later challenges (and future combat) more survivable. This is the deliberate progression hook for the combat expansion.

Rewards are granted exactly once (idempotent — re-emitting a completion does not re-grant), enforced by `QuestService` checking completion state before granting.

---

## Launch Scope — 3 Investigation Chains

Each spans 2–3 planets, 4–5 steps, 1–2 traversal challenges:

1. **Shadows over Naboo** — Naboo → Coruscant → Naboo. Challenge: *Royal Palace infiltration* (patrol droids + sweeping scanners). Reward: holocron `holo_naboo`, +20 max HP.
2. **The Cloners' Secret** — Kamino → Geonosis. Challenge: *Droid-foundry gauntlet* on Geonosis (conveyor hazards: patrol + static presses). Reward: holocron `holo_clones`, +20 max HP.
3. **The Sith Trail** — Coruscant → Mustafar. Challenge: *Lava-field crossing* on Mustafar (static lava vents + sweeping eruptions). Reward: holocron `holo_sith`, +20 max HP.

~13 steps and ~4 challenges total. More chains are pure data additions afterward.

---

## Testing

### Unit (Vitest, pure logic)
- `validateQuests` — the spec-as-test gate: all cross-references resolve; objective types valid; givers present on their planet; challenge geometry sane; holocrons exist. Asserts all 3 chains pass.
- `QuestService` — `accept` moves available→active; `advance` advances only on matching current objective and ignores non-matching events; reaching the last step completes and grants reward once (idempotent); track selection; persistence round-trips through injected storage. **Pre-satisfied auto-advance:** accepting a quest whose current `discover` objective is already unlocked (or `challenge` already cleared) immediately advances past it, chaining through consecutive pre-satisfied steps, without soft-locking.
- `objectives.matchesObjective` — true only for the correct event/objective pairing across all 4 types; no false positives (e.g., `talk` to the wrong NPC, `discover` of the wrong lore).
- `health.js` — `damage`/`heal` clamp to `[0,max]`; `isDead` at 0; `setMax` raises ceiling without lowering `current`.
- Challenge-definition validation — `bounds` within planet `size`; `checkpoint`/`goal` within `bounds`; hazard `type`s valid (folded into `validateQuests`/layout validation).
- `SaveService` additions — quests state, `maxHealth`, cleared-challenges set persist and reload; defaults are sane for an existing save with none of these fields (backward-compatible load).

### Runtime smoke (Playwright headless, extending the existing harness)
Drive a complete quest end-to-end: accept it from its giver NPC, advance a `talk`/`discover` step, travel as directed, enter a challenge, take hazard damage (health bar drops), reach the goal to clear it, confirm the step advances and the chain completes with the holocron + max-health reward applied. Assert zero console/page errors; screenshot each beat (quest log, objective tracker, challenge with health bar, reward).

### Backward compatibility
Existing saves (no `quests`/`maxHealth`/cleared-challenges fields) must load cleanly with sensible defaults (no quests accepted, `maxHealth` 100, no challenges cleared) — covered by a SaveService test loading a pre-expansion save shape.

---

## Out of Scope (this expansion)
- Combat, enemies, weapons (next expansion — reuses `health.js`).
- Full graphics overhaul (later expansion).
- Branching narrative / dialogue choices beyond accept/decline.
- Inventory, economy, non-health stats.
- Additional quest chains beyond the 3 (data-only additions later).
