# Gilt House Training Lab R1: standalone, reproducible browser practice

Status: review candidate. Adds an opt-in, **session-only practice experience** in Gilt House. It is not a real-money game, verified agent assessment, model update, training pipeline, or integrated AI agent.

## Product separation

This rung changes **only** `MichaelWave369/GiltHouse`. It does **not** import any City369 code, contact the separately sold Neon Royal app, reuse its paid accounts, expose its purchase/checkout UI, or touch that product's deployment or release status.

- Gilt House is its own web app, with its own routing and existing play-money games.
- Future Virtual Vegas/VR can be a distinct product; nothing here integrates it.
- A future PhiBot/BudgetGenius adapter requires its own governed contract and operator approval; none exists in this rung.

## User journey

1. From Gilt House's main floor, select **Training Lab**.
2. Answer eight probability and decision-bias questions drawn from the existing `src/lib/casino/workshop.ts` station bank.
3. See the total, feedback, and explanations **only after answering the full set**.
4. Optionally click **Export practice JSON** for a local browser download of a compact self-report receipt.
5. Start a new deterministic round with a new integer seed.

Closing the room loses the current attempt. The app **does not persist** progress, call AI providers, transmit answers, create accounts, or share the data with other apps. If a browser download fails, no export should be claimed as externally received. The player retains full control over the downloaded file.

## Repeatability and evidence

`src/lib/casino/training-lab.ts` selects and orders eight existing station challenges with a deterministic, non-cryptographic PRNG. Seed + fixed question bank version determine the same challenge IDs and order. Scoring rejects missing, duplicate, invalid, or out-of-order answers and recomputes correctness using the local question bank.

A voluntary JSON export includes:

- Schema `gilt-house.training-observation.v1`
- Static exercise bank version and replay seed
- `UNVERIFIED_CLIENT_PRACTICE` evidence status
- Browser-reported completion time
- Answer indices, score, and explicit lack of execution/financial authority

It deliberately includes no identity, name, user email, IP address, profile, betting balance, chip stake, financial transaction, cash value, API token, or secret.

The question bank and answer key ship in JavaScript. Therefore this JSON **cannot certify** independent human competence, model improvement, integrity, or tamper resistance. It is untrusted, local practice information. Exporting it does not automatically consent to model training or publication.

## Scope exclusions

- No chips earned, wagered, transferred, cashed out, or converted to API credits.
- No real-money or crypto betting.
- No live agent calls, remote PhiBot sessions, or autonomous wagering.
- No LLM routing, model weights updates, embeddings, or NBG persistence.
- No cross-app launch link, iframe, shared browser storage, SSO, database or payment integration.
- No changes to the old Workshop's existing chip comp rules.
- No claim that completing a practice run proves learning.

## Acceptance

```sh
node --experimental-strip-types --test src/lib/casino/training-lab.test.ts
node --test scripts/gilt-venue-manifest.test.mjs
npm ci
npm run typecheck
```

The GitHub workflow `training-lab-r1.yml` performs those checks. Manually review that the new main-floor card opens the session, eight answers complete, results appear, JSON export downloads only on click, and the existing games remain unchanged.

## Next candidate: human/agent sandbox R2

Design an **externally evaluated** sandbox: qualified task suites separate from answer-key access; human-visible agent permissions; replayed task receipts; source provenance and anti-tamper handling; clear privacy/consent; and per-agent compute quotas approved by BudgetGenius. Do not promote local practice scores as proof of learned model capabilities.

The paid Neon Royal app remains independent and can be sold without this work.
