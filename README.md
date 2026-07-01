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
- **J** — open the quest log
- **Esc** — close an overlay / return to the galaxy map

## Lore modes
Codex (browsable encyclopedia), collectible cards (artifacts), holographic terminals, and NPC dialogue. Each entry ships with a curated summary and lazy-loads extended lore from the Wookieepedia API when online; everything is cached and the game is fully playable offline.

## Quests & challenges
Talk to notable figures to accept **investigation chains** that retrace real prequel storylines across planets. Steps advance through normal discovery plus **traversal challenges** — cross hazard-filled zones (patrol droids, sweeping scanners, lava vents) without your **health bar** hitting zero, or respawn at the last checkpoint. Completing a chain awards an exclusive **holocron** and a permanent max-health boost.

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
