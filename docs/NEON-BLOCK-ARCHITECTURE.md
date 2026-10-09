# Neon Block architecture

The street is a layer on top of the existing casino. It does not replace table logic, chip storage, the Training Lab, or the standalone-product manifest.

## Boot

`src/routes/index.tsx` renders `GiltHouseShell`.

- `mode: "street"` mounts `NeonStage` (canvas + HUD).
- `mode: "casino"` mounts the existing `CasinoApp` and a single **Back to the Neon Block** control.
- Entering the casino calls `useCasino.getState().setView(...)`. Leaving does not rewrite the chip purse.

## Simulation vs drawing

World rules are plain data and functions. The canvas is a view.

| Module | Job |
| --- | --- |
| `src/lib/world/types.ts` | Save shape, effects, scene ids, the two storage keys |
| `src/lib/world/content.ts` | District geometry, portals, hotspots, items, NPCs, encounters, quests |
| `src/lib/world/logic.ts` | Movement, collision, interact, dialogue, shop, arcade payouts, objectives |
| `src/lib/world/save.ts` | Versioned parse, migrate v0 → v1, corrupt fallback |
| `src/lib/world/store.ts` | Zustand runtime: panels, talk, arcade, casino door |
| `src/lib/world/draw.ts` | 320×180 pixel frame, nearest-neighbor scaled in the game loop. Facades, interiors, and people are drawn in code. Marquee names use a 3×5 pixel alphabet.
| `src/lib/world/agent.ts` | Disabled remote-agent contract |
| `src/lib/world/agent-sandbox.ts` | Deterministic hypothetical visitor replay, no state effects |
| `src/components/world/agent-desk.tsx` | Opt-in local-only rehearsal UI under the pause menu |
| `src/components/world/engine.tsx` | rAF loop, keyboard, touch, audio, `__controlsTest` |
| `src/components/world/overlay.tsx` | HUD, dialogue, shops, journal, map, creator |
| `src/components/world/arcade.tsx` | Pulse Line and Marquee Memory |

Stable ids (`scene`, NPC id, item id, quest id, portal id) are the contract a future 3D scene can reuse. Interaction results are commands (`dialogue`, `casino`, `arcade`, scene change), not keycodes, so a later VR client can send the same commands.

## Loop

`requestAnimationFrame` computes one capped delta. A/D move only while no blocking panel, dialogue, or cabinet is open. The title, creator, and chapter card do block walking. Intro text does not. **E** prefers a person or a hotspot. **W** prefers a door, and falls back to E only when no door is in range. Blur, a hidden tab, and pointer cancel release held movement. The camera follows the player inside the logical frame. The visible canvas is an integer scale of that frame with smoothing off.

## Economy wall

`purchase`, `useItem`, `equipItem`, and `grantArcade` change `tokens` on the world save only. They never call `settle`, never write `gilt-house-v1`, and never read the chip bank. Casino games are not imported by `logic.ts`.

## Audio

Street music and street cues use their own gain nodes in `src/lib/casino/audio.ts`. Starting the block stops the lounge bed. Starting the lounge stops the block bed. The original cues (`chip`, `card`, `spin`, `win`, `lose`, `dice`) are unchanged.

## Future agents

`reviewAgentAction` accepts only `local-script`. A move must use direction `-1` or `1`. Talk and emote must name an NPC who already exists, and an emote must be `wave` or `listen`. Privileged fields (`wager`, `chips`, `bank`, `spendApi`, `selfGrant`, and the rest of that list) are rejected even on an otherwise legal action. Remote sources, including any future PhiBot, stay off. The remote-call budget is zero. NPC dialogue remains deterministic. In-game success is not a training receipt.

A later agent can live here as an inhabitant only by sending those same local actions through the review function, with a person raising the budget first. It must not grant itself permissions, spend API money, place real-money wagers, touch commercial entitlements, or rewrite the chip purse. Observations stay on scene id, nearby actor ids, the objective line, and visible street tokens. They never include the chip bank.

## R4 Backstage Agent Desk

The optional Menu → Agent Desk is an in-memory, deterministic *rehearsal*, not an agent execution path. Its 24-action capped script uses a snapshot of the current scene, the existing collision rules, and `reviewAgentAction`. Talk and emotes require a nearby in-scene character but never execute dialogue or quests. The actual world and casino stores are never written. No remote model, API, telemetry, or user account is connected. See `docs/NEON-BLOCK-AGENT-DESK-R4.md`.


## R5 visual playback of rehearsed visitors

The Backstage Agent Desk now reuses `renderFrame` to show an isolated copied scene at a hypothetical visitor x-coordinate. It does **not** inject characters into the actual world or alter saved state. The local scripted patrol is deterministic and limited by `MAX_LOCAL_ACTIONS`. Manual stepping remains available for reduced-motion settings. See `docs/NEON-BLOCK-VISITOR-PLAYBACK-R5.md`. This is *not* live PhiBot execution or verified agent training.
