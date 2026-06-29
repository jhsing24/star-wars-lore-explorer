# Star Wars Lore Explorer — Design Spec
**Date:** 2026-06-29  
**Era:** Prequel (~32–19 BBY)  
**Platform:** Web browser (Phaser.js)  
**Art Style:** Minimalist / abstract geometric

---

## Overview

A 2D browser-based exploration game set in the Star Wars prequel era. The player navigates a galaxy map and explores planet surfaces, discovering lore grounded in Wookieepedia-accurate facts. Lore is presented through multiple in-game modes (codex, collectible cards, holographic terminals, NPC dialogue). No combat — pure exploration and collection.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Browser (HTML/JS)              │
│                                             │
│  ┌─────────────┐    ┌────────────────────┐  │
│  │  Phaser.js  │    │    HTML UI Layer   │  │
│  │  Game World │    │  Codex / Cards /   │  │
│  │  (canvas)   │    │  Menus / Overlays  │  │
│  └──────┬──────┘    └────────┬───────────┘  │
│         └─────────┬──────────┘              │
│               ┌───▼──────┐                  │
│               │  Lore    │                  │
│               │ Service  │                  │
│               └───┬──────┘                  │
│         ┌─────────┴──────────┐              │
│  ┌──────▼──────┐    ┌────────▼────────┐     │
│  │  Seed Data  │    │ Wookieepedia    │     │
│  │  (JSON)     │    │ MediaWiki API   │     │
│  └─────────────┘    └─────────────────┘     │
└─────────────────────────────────────────────┘
```

- **Phaser.js canvas** — game world, movement, collision, scene transitions
- **HTML UI layer** — overlaid DOM for lore UI (cards, codex, menus); better than canvas for text-heavy interfaces
- **Lore Service** — single source of truth; checks seed data first, fetches Wookieepedia to enrich, caches in `localStorage`
- **No backend** — fully client-side; all state in `localStorage`

### Tech Stack
| Layer | Technology |
|---|---|
| Game engine | Phaser.js 3 |
| Language | JavaScript (ES modules) |
| UI overlays | HTML/CSS |
| Lore API | Wookieepedia MediaWiki API |
| Persistence | localStorage |
| Build | Vite (dev server + bundler) |

---

## Game World

### Galaxy Map (Macro Layer)

A dark canvas showing 12 prequel-era star systems as glowing abstract nodes connected by faint hyperspace lanes. The player pilots a minimal geometric ship between them. Systems are color-coded by faction allegiance:

- **Republic blue** — Coruscant, Kamino, Kashyyyk, Naboo
- **Separatist red** — Geonosis, Utapau, Mustafar, Rodia
- **Neutral gray** — Tatooine, Mandalore, Christophsis, Ryloth

### Planet Surfaces (Micro Layer)

Each planet is a small, hand-crafted top-down map composed of flat geometric shapes in a planet-appropriate color palette:

| Planet | Palette | Notable Locations |
|---|---|---|
| Coruscant | Gray, gold, deep blue | Jedi Temple, Senate District, Underworld |
| Naboo | Green, teal, warm gold | Royal Palace, Gungan Swamps, Theed |
| Kamino | Pale blue, white, silver | Cloning Facility, Landing Platforms |
| Geonosis | Deep red, tan, brown | Petranaki Arena, Droid Foundries |
| Kashyyyk | Forest green, dark brown | Kachirho, Wookiee Tree Cities |
| Mustafar | Deep red, orange, black | Separatist Stronghold, Lava Rivers |
| Utapau | Pale beige, dusty orange | Pau City, Sinkhole Levels |
| Tatooine | Sand, burnt orange, rust | Mos Espa, Hutt Palaces, Dune Sea |
| Mandalore | Silver, dark blue | Sundari Dome City, Royal Palace |
| Ryloth | Purple, gray, cave tones | Lessu, Twi'lek Villages |
| Christophsis | Crystal blue, white | Crystal Canyons, Battle Sites |
| Rodia | Jungle green, humid gray | Iskaayuma, Spaceport |

**Player character:** Small glowing triangle. Moves with WASD or arrow keys.

**Interactable objects:**
- **Terminals** — rectangle with pulsing glow; opens holographic text interface
- **NPCs** — rounded geometric shapes, faction-colored; trigger dialogue on interaction
- **Artifacts** — small distinct objects hidden in environment; grant collectible cards
- **Landmarks** — named zones that auto-unlock a codex entry on player entry

Each planet has 4–8 discoverable lore points. The player can return to the galaxy map at any time.

---

## Lore System

### Seed Data

~80 curated JSON entries, bundled with the game, organized into five categories:

```
src/data/
  planets.json      (~12 entries)
  factions.json     (~10 entries)
  characters.json   (~25 entries)
  events.json       (~15 entries)
  species.json      (~18 entries)
```

Each entry schema:
```json
{
  "id": "char_palpatine",
  "title": "Sheev Palpatine",
  "category": "characters",
  "summary": "2–3 sentence Wookieepedia-accurate summary.",
  "wookieepedia_slug": "Palpatine",
  "rarity": "legendary",
  "unlock_condition": {
    "planet": "coruscant",
    "trigger": "npc_dialogue"
  }
}
```

Rarity tiers: `common`, `rare`, `legendary` — used for card presentation.

### Wookieepedia API Enrichment

When a player unlocks a seed entry, the Lore Service calls:
```
GET https://starwars.fandom.com/api.php
  ?action=query
  &prop=extracts
  &exintro=true
  &titles=<wookieepedia_slug>
  &format=json
  &origin=*
```

The intro section is stripped of wikitext markup and stored as `extended_lore` on the entry. This appears in the codex as a secondary "Extended" tab.

**Caching:** Results stored in `localStorage` keyed by slug. Fetched once per slug per session at most; persisted across sessions.

**Failure handling:** 5-second timeout. On failure, the entry displays seed summary only — no error shown to the player. Retried automatically next session.

### Lore Presentation Modes

All four modes are active simultaneously — the mode is determined by the trigger:

| Mode | Trigger | UX |
|---|---|---|
| **Codex** | Menu button (anytime) | Browsable encyclopedia; entries grouped by category; two tabs: Summary / Extended |
| **Collectible Card** | Artifact pickup | Animated card-flip reveal; rarity displayed; cards saved to collection |
| **Holographic Terminal** | Interact with terminal | Scanline visual effect; typewriter text reveal; faction logo watermark |
| **NPC Dialogue** | Talk to NPC | Speech bubble chain above NPC; character name + faction color header |

A discovery popup (brief toast notification) always fires first, regardless of mode, to acknowledge the find.

---

## Player Progression

All state in `localStorage`:

```json
{
  "currentPlanet": "coruscant",
  "visitedPlanets": ["coruscant", "naboo"],
  "unlockedLore": ["char_palpatine", "planet_naboo", "event_invasion_naboo"],
  "cardCollection": [
    { "id": "char_palpatine", "rarity": "legendary", "unlockedAt": 1719619200 }
  ],
  "planetProgress": {
    "coruscant": { "found": 3, "total": 7 },
    "naboo": { "found": 5, "total": 6 }
  }
}
```

No fail states, no combat, no time pressure. Completion percentage per planet is shown on the galaxy map node. A global completion bar tracks total lore found across the galaxy.

---

## File Structure

```
star-wars-lore-explorer/
  index.html
  vite.config.js
  src/
    main.js                  # Phaser game init
    scenes/
      GalaxyMapScene.js
      PlanetScene.js
      BootScene.js
    data/
      planets.json
      factions.json
      characters.json
      events.json
      species.json
    services/
      LoreService.js         # Seed lookup + Wookieepedia fetch + cache
      SaveService.js         # localStorage read/write
    ui/
      Codex.js               # Codex overlay (HTML/CSS)
      CardReveal.js          # Card flip animation
      Terminal.js            # Holographic terminal overlay
      DialogueBox.js         # NPC speech bubble chain
      DiscoveryToast.js      # Brief unlock notification
    objects/
      Player.js
      NPC.js
      Artifact.js
      Terminal.js            # In-world terminal object
  public/
    assets/                  # Minimal: fonts, audio (optional)
  docs/
    superpowers/
      specs/
        2026-06-29-star-wars-lore-explorer-design.md
```

---

## Out of Scope (v1)

- Multiplayer or shared lore collections
- Combat or fail states
- Procedurally generated planets
- Audio (can be added later)
- Mobile touch controls (keyboard-only for v1)
- Eras beyond prequel (~32–19 BBY)
