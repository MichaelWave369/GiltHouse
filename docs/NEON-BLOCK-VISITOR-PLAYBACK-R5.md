# R5: Backstage Visitor Playback

Status: review-only local visual rehearsal. **No model invocation. No live NPC. No agent gateway.**

## What players can inspect

From **Menu → Agent Desk**, click **Load scripted patrol**, then **Play preview** or step through the sequence manually. The preview uses the game's actual 320×180 canvas world renderer, but on an isolated copy of the current scene at the visitor's hypothetical x-coordinate. It shows a *preview player avatar*, not an actual world occupant.

The fixed script optionally greets a nearby NPC, walks right for eight bounded steps, and returns for eight. Replaying the same scene creates the same path. No random actions or stochastic agent decisions occur. The existing 24-action limit remains enforced. The user can also append manual rehearsal move/talk/emote commands. Talk and emote never invoke the NPC dialogue engine or change quest progress.

Play and pause are local UI controls. Timers only exist while the optional desk panel is mounted. In-game or OS reduced-motion preferences disable automatic playback; previous/next step remain available.

## Data and authority

- No automatic saves or exports, accounts, background jobs, network requests, tokens, keys or remote tools.
- No writes to the actual player world, casino, training results or either storage key.
- No grants, coins, chips, quests, rewards or casino game modifications.
- No remote PhiBot controller; `local-script` is an internal application-origin label only, not a credential.
- Replay traces remain `UNVERIFIED_LOCAL_SIMULATION`. They do not certify skills, training, safety or model improvement.
- No dependency, code import or other effect on the independently sold City369 / Neon Royal product.

## Code

- `src/lib/world/visitor-demo.ts`: deterministic scripted patrol generator, bounded by `MAX_LOCAL_ACTIONS`.
- `src/lib/world/visitor-demo.test.ts`: patrol repeatability, authorization boundaries, source rejection and collision fixtures.
- `src/components/world/agent-desk.tsx`: pixel-art sandbox preview with manual/automatic step controls, reduced-motion support and replay trace.
- `src/lib/world/agent-sandbox.ts`: existing pure replay authority check remains the sole local-preview evaluator.
- `src/lib/world/draw.ts`: existing renderer is reused unchanged.
- `npm test` now includes the patrol suite. The existing Neon Block workflow covers test, typecheck, lint and production build.

## Acceptance before merging

1. Open the desk on desktop and mobile. The preview should resemble the current game scene and be labelled as simulation.
2. Load patrol; step through, reverse, play and pause. No actual player moves or quest flag changes.
3. Reduced-motion preferences disable autoplay without blocking manual inspection.
4. Close and reopen the desk: prior session is discarded; no save is written.
5. Navigate to the real Gilt House casino: the chip purse and casino games must behave exactly as before.
6. Confirm CI green. This does not replace browser QA.

## Following rungs

An actual controlled local model or remote PhiBot will need *separate* authenticated ingress, human-approved capabilities, external spending quotas, zero financial authority by default, no model self-grants, independent receipts and quality evaluation. This PR neither activates nor authorizes that path.
