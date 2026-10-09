# Gilt House R11: Explorable Three.js Gaming Floor

**Status:** Review candidate. The existing retro game and casino directory remain the default gameplay.

## What the player gets

The Gilt House casino now includes **Explore the 3D gaming floor** near the top of the existing 2D casino directory. Click it to enter a second original Art Deco Three.js room with eight themed tables:

- The Shoe: existing Blackjack.
- The Wheel: existing single-zero Roulette.
- The Rail: existing Craps.
- The Salon: existing Baccarat.
- The Draw: existing Poker.
- Vesper Reels: existing Slots.
- The Cage: existing Keno.
- After Hours: existing additional slot game.

The room has a central carpet, brass columns, chandeliers, thematic colored table displays, casino signage, and a bounded first-person camera.

**It is a visual navigation mode only.** No bets, outcomes, payouts, odds, or additional currencies occur in the Three.js renderer.

The original 2D casino floor remains one click away. Every selectable 3D table routes into an existing Gilt House game. The separately deployed React Pages edition can load this scene without running a server.

### Controls

- **W / S**, Up/Down: forward and backward.
- **A / D**: sidestep.
- **Q / E**, Left/Right: turn.
- **Drag** the canvas: look around.
- **F / Enter** near the selected table: open existing game.
- **Tap** a table within range: open existing game, using Three.js raycast/proximity validation.
- **Back to casino directory**: close showroom without changes.
- Accessible HTML game buttons remain visible even when WebGL is unsupported.
- On mobile: additional large touch movement controls.

## Technical boundaries

- The room is **lazy-loaded** from the original `src/components/casino/floor.tsx`. It does not mount Three.js until explicitly requested.
- The fixed `FLOOR3D_STATIONS` catalogue and pure `canOpenFloor3DTable` proximity rule live in `src/lib/casino/floor3d.ts`.
- Rendering is isolated in `src/components/casino/floor-walk3d.tsx`; all GPU resources and event listeners dispose on exit.
- No live sportsbook scoreboard dependency, new APIs, model calls, logins, analytics, payments, persistence, VR-headset assumptions, or subscriptions are added.
- No changes to `src/lib/casino/store.ts`, any betting logic, odds, RNG, payout rules, chip save key, or `src/lib/world/store.ts`.
- The floor cannot wager for the player. It only calls the original `setView(game)` after a deliberate selection.
- Casino chips remain **local, free, nonredeemable entertainment credits**. There is no withdrawal/cash-out or conversion to external API credits.
- No code, shared user accounts, sales, dependencies, licensing, or deployment changes to the separately sold **Neon Royal / City369** commercial product.
- This showroom does not create real model-controlled agents. The existing Backstage Agent Desk remains unprivileged.

## Testing

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build:pages
npm run check:pages
npx playwright install --with-deps chromium
node scripts/check-floor3d-browser.mjs
```

Regression tests verify fixed game destinations, invalid/privileged destination rejection, proximity, finite camera movement, and catalogue integrity. The browser smoke uses the real Pages build to open the 3D floor, confirm eight HTML game destinations, ensure **F** cannot enter a station from across the hall, return, open Blackjack, go back to the directory, and verify no chip-storage changes.

The original Gilt House Pages workflow also runs the R8 layout browser checks and R9/R10 lobby walkthrough. The new R11 browser test blocks Pages deployment when it fails.

**Browser smoke does not certify artistic quality or native GPU acceleration.** Headless Chromium may fall back to software rendering or have WebGL unavailable; the HTML game links are deliberately accessible anyway.

## Manual review before release

1. Enter Gilt House from the 16-bit street and take its gaming-floor entrance.
2. Choose **Explore the 3D gaming floor** from the actual casino directory.
3. Confirm all eight themed tables and lights look correct on desktop.
4. Walk, turn and approach different tables. Try F near and far away, and tap versus drag.
5. Open at least two real casino games from tables; return each time.
6. Test mobile controls on a physical touchscreen, plus reduced-motion settings.
7. Disable WebGL and verify a fallback message and playable accessible game links.
8. Verify no memory leaks or runaway WebGL animation after repeated entry/exit.
9. Verify existing 2D casino, first Neon Block chapter, Agent Desk, and Pages workflow remain unaffected.

R11 is **not** a VR-ready casino or production financial service. It is a freely accessible, optional gaming-floor walkthrough built atop the existing Gilt House entertainment application.
