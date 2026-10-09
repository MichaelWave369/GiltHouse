# Gilt House R4: Backstage Agent Desk (local-only rehearsal)

Status: **review-only implementation; no remote PhiBot integration**.

This optional menu panel lets a human try a **hypothetical scripted visitor** in the existing scene. It does not spawn or modify an NPC, move the actual player, progress a story, award currency, store a transcript, train a model, or contact any service.

## Try it

1. Start or Continue The Neon Block.
2. Open **Menu → Agent Desk**.
3. Click **Rehearse left**, **Rehearse right**, **Rehearse talk**, or **Rehearse wave**.
4. The visitor's hypothetical x position and most recent decisions appear in an on-screen replay trace.
5. Click **Reset rehearsal** to discard the scripted actions. Close returns to the game.

Talk/wave are enabled only when an existing NPC is near the hypothetical visitor. All actions remain a rehearsal, and no live dialogue choices or reputation effects occur. Script limit: 24 actions, each simulated move = 0.25 seconds of the existing collision rules.

## Contracts

- `src/lib/world/agent-sandbox.ts`: pure, deterministic, in-memory preview, using existing scene/collision and `reviewAgentAction` policy.
- `src/lib/world/agent-sandbox.test.ts`: deterministic replay, proximity, malformed/extra commands, source rejection, scene collisions, no world writes, 24-action cap, zero financial/remote authority.
- `src/components/world/agent-desk.tsx`: opt-in, read-only user interface.
- `src/lib/world/store.ts`, `src/components/world/overlay.tsx`: an optional menu panel only; no game economy, game loop, rendering pipeline or casino navigation changed.
- `npm test` runs the new agent sandbox tests automatically. The existing `Neon Block` PR workflow also runs typecheck, lint, and build.

The output is labelled `UNVERIFIED_LOCAL_SIMULATION`. It is deliberately **not** a training, safety, skill, or performance certification.

## Boundary law

- No network requests, remote models, API keys, subscriptions, customer data, telemetry or automatic storage.
- No mutation of casino chips, street tokens, quests, inventory or character state.
- No API credits, real-money/crypto wagering, token redemption, or model-training entitlement.
- `source="local-script"` is an internal **trust label**, not authentication. **Never allow remotely supplied or model-generated actions to use this label**, even if they resemble approved commands. Real agents require an authenticated, operator-governed gateway and independent permission enforcement that does not exist yet.
- Only `move`, `talk`, and `emote` are considered. Actions are strict-allowlist objects and require current-scene proximity to the target NPC. `talk` and `emote` are *preview events* without invoking dialogue or story effects.
- No imported modules, deployment, payments, commercial licensing, or customer accounts from the separately sold City369 / Neon Royal app.

## Remaining future work

Build a separately qualified remote-agent execution gateway with user approval, authentication, logged grants, explicit maximum compute budgets through BudgetGenius, replay evidence with anti-tamper protections, and a server-side trusted validator for actions that affect real state. The current read-only rehearsal is neither that gateway nor permission to deploy one.

Actual local UI interaction and accessibility review must be performed after CI. Green automated checks alone are not proof of browser/headset QA.
