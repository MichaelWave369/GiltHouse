# Gilt House standalone product boundary (R0)

Status: **review-only architectural guardrail**. This repository and this PR do not modify the separately sold **Neon Royal** city/travel explorer, its City369 code, its deployment, or its commercial launch gates.

## Three intentionally distinct surfaces

| Surface | Product / purpose | Ownership and deployment |
| --- | --- | --- |
| **Neon Royal / City369** | Standalone commercial Las Vegas discovery and field-explorer product, with its own licensing and prospective purchase flow | Existing `MichaelWave369/City369` repository, separately deployed. No integration required. |
| **Gilt House** | Standalone play-chip casino-themed entertainment and probability-learning app | Existing `MichaelWave369/GiltHouse` repository, independently deployed. It is not the paid app, a bundle, or an entitlement. |
| **Virtual Vegas / VR** | Future *separately built* 3D/VR simulation and agent-training world | Separate app/deployment/module boundaries; no dependency on the paid explorer. Architecture and repository to be decided explicitly. |

Shared creative inspiration is not a code, account, data, hosting, or financial integration.

## Hard separation rules

1. **No paid-app code imports**: Gilt House and any VR world must not directly import the paid explorer's application modules or commercial code. If a reusable city-engine capability is ever needed, it requires a separately reviewed, extracted, versioned component with independent permissions and licensing. The paid app remains unaffected.
2. **Separate deployment and origin**: No shared deploy directory, routes, service workers, origin-scoped browser storage, or production backend. A future public hyperlink can be considered *only after explicit review* and must not be required for either app to function.
3. **Separate identities and entitlements**: No shared sign-in, subscription, customer licenses, session tokens, account databases, or access rights. Buying Neon Royal does not authorize access to Gilt House, and playing Gilt House does not grant Neon Royal access.
4. **Separate financial flows**: The City369/Neon Royal purchase system is untouched. Gilt House's resettable chips have **zero cash value**, are nontransferable and nonredeemable, and cannot buy API credits. No real-money, crypto, or token wagering is permitted through agent automation.
5. **Separate compute costs**: PhiBot, BrainC, and BudgetGenius hooks remain **PROPOSED**. A separately funded, reviewed API budget must be authorized by the operator. Gameplay results do not become treasury deposits or credits.
6. **Separate data and telemetry**: No automatic movement of traveler data or purchasing information into Gilt House or VR. Any voluntary learning export must be opt-in, minimized, independently evaluated, and explicitly labelled as simulation evidence rather than verified model training.
7. **No release coupling**: Gilt House release, tests, failures, or future VR development cannot affect the sale-readiness state, customer experience, availability, or deployment of Neon Royal. Likewise, a change to the paid app never automatically changes Gilt House.
8. **No apparent live claims**: Static discovery claims do not prove actual compatibility, VR hardware qualification, financial compliance, identity, or running agents. All disabled capabilities remain marked as such.

## Existing Gilt House features actually inspected

- `src/routes/index.tsx` routes to `src/components/casino/app.tsx`, which selects standalone game views.
- `src/lib/casino/store.ts` stores a resettable chip purse and limited ledger in browser `localStorage["gilt-house-v1"]`. Not financial accounting.
- `src/lib/casino/workshop.ts` contains probability/strategy questions, and `src/components/casino/workshop.tsx` provides a workshop interface. It is not yet an externally validated training system.
- `src/lib/casino/agents.ts` simulates sports with rule-based random transitions; the named 'agents' are not yet remote LLM agents.
- `src/components/casino/gl/arena.tsx` uses Three.js and requests WebXR immersive VR where supported. A code path is not evidence of headset readiness.
- `src/lib/casino/wire.ts` fetches third-party scoreboards on the server. Its availability/accuracy is not guaranteed.
- `src/lib/multiplayer/p2p.ts` implements client-authoritative WebRTC rooms. Peer results are not authoritative for financial, identity, or learning claims.

## What R0 changes

- Adds `/bridge/gilt-house.venue.v0.json`, public standalone discovery *for Gilt House itself*. It names no external parent platform and does not permit embedding or execution.
- Tests assert no City369/Neon Royal parent identity, no inherited paid access or shared commercial machinery, and no wagering/token conversion authority.
- Adds a CI workflow for these invariants.
- Does not modify existing game routes, gameplay, databases, purchase flows, app UI, or the City369 repository.

## Optional independent roadmap (not committed)

- **R1: Independent Gilt House experience registry** with explicit versioned self-discovery; no need to alter City369.
- **R2: Opt-in local-first learning receipts**, reproducible simulation seeds, privacy controls, and held-out assessment.
- **R3: Sandboxed PhiBot play**, virtual chips only, action limits, model/compute quotas, and independent evaluation.
- **R4: Separate Virtual Vegas/VR client**, with its own venue directory and portable *non-commercial* scene interfaces; physical VR and accessibility qualification.
- **R5: Optional lawful funding system**, based solely on independently settled non-wagering business revenue, not casino chips, with manual treasury approval.

## Qualification

Run `node --test scripts/gilt-venue-manifest.test.mjs` or `npm test`.

**Explicit non-goal:** connecting, modifying, bundling, gating, or otherwise changing the commercial Neon Royal application.
