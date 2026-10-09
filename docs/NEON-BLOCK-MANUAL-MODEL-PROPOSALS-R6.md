# R6: Manual Model Proposal Bridge (offline inspection only)

**Status: review candidate. Not a live local-model connector, agent runtime, or execution grant.**

Gilt House's R4/R5 Backstage Agent Desk is a deterministic rehearsal. R6 adds a manual way to ask an **external local model of the player's choice** to suggest up to 12 visitor actions, then inspect the suggestion *in an isolated world copy* without changing the game.

## User journey

1. Start/Continue Gilt House, enter **Menu → Agent Desk** and expand **Model proposal bridge · manual, no API**.
2. Copy the provided model briefing. It contains only current scene, approximate position, nearby NPC IDs and the title of the current objective. It does not include chip balances, street-token balances, inventory, quests, personal accounts, IDs, API keys or saves.
3. **Outside Gilt House**, ask a local model such as one running in Ollama to answer that briefing. You manage the model and its usage separately.
4. Paste exactly one JSON response into the bounded text field. Or use **Load harmless example** to test the parser.
5. Click **Inspect only**. Invalid or privileged actions are rejected. Strictly shaped actions are projected at 0.25-second movement steps in a copied scene, with scene-specific NPC proximity checks. Inspect each step in the static preview canvas.
6. Close the panel to discard the entire manual experiment. Nothing automatically saves or uploads.

Example of the required reply:

```json
{"schema":"gilt-house.model-proposal.v1","actions":[{"type":"move","dir":1},{"type":"move","dir":-1}]}
```

The parser accepts **only** a JSON object with exactly `schema` and `actions`, maximum 4096 characters, maximum 12 actions, and exact keys for three action types: move (`dir` ±1), talk (known `npcId`), emote (known `npcId`, `wave` or `listen`). The parser denies unexpected permissions, tools, prompt text, unrecognized IDs, role labels, wagering/payment actions, and other extra fields. It does not execute accepted proposals. Out-of-range talks/emotes are marked as failed preview steps.

**Trust model:** proposed actions remain `UNTRUSTED_MODEL_PROPOSAL` and `PREVIEW_ONLY_NO_EXECUTION`. The model's text is **never passed to the trusted `local-script` source** and never passed to `reviewAgentAction` as a real permission-bearing action. Parsing or preview-valid movement does not authenticate an actor, confer an entitlement or approve execution. The visitor projected on the screen is not a separate live NPC, and is not the player's actual avatar.

## Invariants

- The feature contains **zero network calls** and no local Ollama API call. Clipboard copy is a deliberate browser action, not model communication.
- No remote models, PhiBot credentials, payments, provider keys, autoplay, automatic tool execution, background jobs or external dependencies.
- The inspector is **read-only**. It never updates the Zustand world, quests, inventory, chip purse, street tokens, stored progress or real actors.
- All action strings render through normal React escaping rather than raw HTML.
- Browser-text proposal length and action count are bounded; syntax and policy errors fail closed.
- No model score or claim of training is produced.
- No dependencies on, changes to, or customer data shared with the separately sold commercial **Neon Royal / City369** app.
- No real-money gambling, chip redemption, or conversion to API credits.

## Implementation

- `src/lib/world/model-proposal.ts`: minimal prompt, strict parser, isolated geometric preview and explicit no-authority inspection result.
- `src/lib/world/model-proposal.test.ts`: regression tests for privacy minimization, strict JSON, grants rejection, replay consistency, no game mutation, NPC proximity and bounded input.
- `src/components/world/model-proposal-desk.tsx`: opt-in copy/paste interface and read-only 320×180 preview.
- `src/components/world/agent-desk.tsx`: adds the optional collapsible panel alongside the existing R4/R5 scripted visitor rehearsal.
- `package.json`: runs the new tests in `npm test`; existing Neon Block workflow runs tests, typecheck, lint and production build.

## Manual acceptance

- Ensure Copy briefing works or offers manual selection if clipboard is blocked.
- Load example, inspect and step forward/backward without moving the *real* player.
- Paste a known-NPC talk near/in another scene and observe accepted/rejected proximity correctly.
- Paste malformed JSON, unexpected keys, a `wager` action and an oversized payload: no action executes and rejection is clear.
- Test desktop and mobile, then close/reopen the desk to verify no persistence.
- Check that existing casino, Training Lab and street tokens are unchanged.
- Run CI. CI green is not a claim that this manual browser acceptance was performed.

## Explicit future milestone

A genuinely connected, opt-in local Ollama / PhiBot adapter still needs an authenticated local service origin, user-selected model, bounded inference budgets, cross-origin validation, human review, revocable grants, ledger receipts, and independent runtime-enforced checks. This bridge supplies **untrusted proposals only**, not approval for that integration.
