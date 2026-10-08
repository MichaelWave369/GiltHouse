# Neon Royal × Gilt House: discovery bridge R0

Status: **review-only proposal**. No integration, execution, training data transfer, payments, remote agents, or API credits are activated by this rung.

## Existing systems (verified from this repository)
- Gilt House renders `src/routes/index.tsx` → `src/components/casino/app.tsx`. The casino views, lounge and sports are separate React components.
- `src/lib/casino/store.ts` keeps the chip purse and a short local ledger under `localStorage["gilt-house-v1"]`. It includes a free-chip marker and reset. Those values are client-controlled and **never financial evidence**.
- `src/lib/casino/workshop.ts` defines educational stations. `src/components/casino/workshop.tsx` runs multiple-choice drills. These are not independent learning benchmarks.
- `src/lib/casino/agents.ts` provides **rule-based** soccer/baseball/football simulation, not live LLM agent policy or training. `src/components/casino/gl/arena.tsx` renders Three.js and requests an immersive WebXR session when supported. Code presence does not prove physical headset qualification.
- `src/lib/casino/wire.ts` makes server-side scoreboard requests. Sportsbook results are not guaranteed live or complete. This is not real-money betting authorization.
- `src/lib/multiplayer/p2p.ts` is a generic, client-authoritative WebRTC room implementation. Do not treat a peer message or game outcome as trusted authority.

## R0 deliverable
The public file `/bridge/gilt-house.venue.v0.json` is a **static, machine-readable discovery advertisement** for City369's proposed Neon Royal venue registry. It can be read by humans or agents but **cannot grant actions**.

The relative `entry.relativePath` of `/` intentionally avoids guessing a hosted URL. City369 should use a separately reviewed HTTPS origin allowlist and version pin. Venue discovery must never automatically import scripts, accept arbitrary iframe origins, or treat a manifest as proof of identity.

The manifest explicitly distinguishes code present but unqualified from working production integration. It describes nonredeemable chips, simulated sports agents, and *proposed* connectivity with PhiBots, BrainC, NBG, and BudgetGenius.

## Boundaries
1. **Chips are not money**. Never exchange, redeem, cash out, transfer, or convert browser chips into API credits, virtual assets with market value, or other real-world benefits.
2. **No autonomous real-money gambling**. No agent wagers with money, crypto, token balances, or API credits. The arena is a virtual entertainment/simulation environment.
3. **Treasury is separately funded**. Future BudgetGenius integration must accept only independent verified receipts for legitimate revenue and operator-approved budget grants, *not* casino outcomes, client ledgers, or peer reports.
4. **Observation ≠ proof ≠ permission**. Agent simulations, workshop answers, client exports and WebRTC messages are untrusted observations. Model improvement claims require isolated evaluation, held-out tasks, provenance, consent, and independent verification. No outcome grants an agent tool access or model permissions.
5. **Preserve City369 launch law**. City369's Vegas/Neon Royal repo currently keeps public sales **LOCKED**, and this discovery manifest must not change that. Preserve its recovered v1.2 baseline and mobile field requirements.
6. **No implicit accounts or tracking**. R0 emits no telemetry or personal data, creates no user IDs, and has no server endpoint.

## Planned next rungs
- **R1: City369 venue registry adapter**: opt-in, exact origin/manifest pin, reviewed link to Gilt House. Mobile-safe fallback; no secretless cross-site login or untrusted embedding.
- **R2: Training telemetry**: voluntary, local-first challenge receipts with stable simulation/version IDs, explicit source and epistemic status, opt-in export, evaluator separation and replay/abuse controls. Chip balance must not act as a skill metric.
- **R3: PhiBot sandbox**: bounded virtual-chip sessions using an action allowlist; cost caps through BudgetGenius, independent quality evaluator, rate limits, repeatable seeded scenarios, and no real-money access.
- **R4: City369 3D venue/VR**: navigate a scene entry and exit, preserve 2D/mobile access, WebXR capability detection, headset QA and accessible controls. Build beside the existing field-explorer rather than replacing it.
- **R5: Real-revenue treasury** (separate legal/commercial gate): sponsorship or other permitted revenue handled outside gaming outcomes; independent reconciliation and explicit approval before API expenditure. **Do not enable payments here.**

## Review checklist
- Public manifest parses and contains no credentials or personal information.
- Tests fail if chip redemption, real-money wagering, API-spend authority, or unqualified integration is marked active.
- No casino game mechanics, save format, audio, app shell, or route behavior changed.
- City369 remains an independent repository and no deployment URL is invented.

Run `node --test scripts/gilt-venue-manifest.test.mjs` for the bridge contract only, or `npm test` for the repository suite.
