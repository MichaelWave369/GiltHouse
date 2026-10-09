# R14: 3D Gaming Floor Map & Wayfinding

**Review candidate, not a deployed release until PR merge and green Pages deployment.**

## What players can do

In the existing optional Three.js gaming floor, choose **Show floor map**. A small, keyboard-accessible map opens above the 3D scene. It shows all eight real casino stations, the solid table footprints, the central clear aisle, and your live blue position/heading marker.

Choose any casino station by name. The map highlights a gold walking route to a safe, reachable spot beside that table and offers a heading-relative instruction such as "turn left" or "continue ahead." The player still walks and turns manually with the original keyboard or touch controls. The guide never teleports them, changes the casino view, or autonomously executes movement.

**Hide floor map** removes the overlay. Existing F/Enter or nearby tap to enter a real table works as before. All eight quick-access buttons remain available below the 3D scene even with no WebGL. The map itself only imports normal React and SVG, so it stays usable on WebGL-limited devices.

## Technical design

- `src/lib/casino/floor3d-nav.ts`: pure, fixed half-meter grid pathfinder (four-direction breadth-first) reusing **R13's actual table collision model**. It returns only `{ game, points, meters, destination }` for allowlisted destinations, or `null` if no collision-safe route is available.
- `src/components/casino/floor-wayfinder.tsx`: optional, lazy-loaded SVG floor map, station labels, camera marker, accessible selection buttons and read-only walking instructions.
- `src/components/casino/floor-walk3d.tsx`: Show/Hide toggle and temporary target selection state, reading R13's existing throttled camera HUD. The WebGL lifecycle is not restarted when the map opens or closes.
- `src/lib/casino/floor3d-nav.test.ts`: verifies all eight from spawn and all 64 station-pair routes. Samples each rendered line segment to ensure it never crosses a solid table. Also checks invalid/privileged IDs and nonfinite input fail closed.
- `scripts/check-floor3d-browser.mjs`: existing Pages Chromium journey extended to open map, select Blackjack, verify eight destinations and rendered route text, close map and confirm the chip purse is untouched. Existing walk-to-solid-rail test and 3D/2D casino roundtrips remain.

**Guidance is approximate:** a 0.5 m grid rather than physics navmesh. It is read-only and does not command the 3D player or guarantee the shortest real human walking route. The line avoids the modelled solid table footprints; visual décor outside that collision model is not simulated.

## Strict boundaries

- No model connections, trained agents, live data, new betting engines, payment calls, account authentication, credits, withdrawals, or network requests.
- No modification of either Gilt House local save key, bank, ledger, RNG, winnings, payouts, casino math, story or shops.
- The existing TanStack hosted build and React GitHub Pages edition remain independent deployment targets.
- **Commercial Neon Royal / City369 remains completely separate**, without code, accounts, license, payment, hosting or telemetry exchange.

## Manual QA after merge

1. Visit Gilt House Live, use Quick casino access → Explore the 3D gaming floor → Show floor map.
2. Confirm map geometry matches the decorative 3D tables and the player marker changes with WASD movement and Q/E turning.
3. Choose each destination, verify the gold route stays in usable aisles and F opens the corresponding existing game once you reach its table.
4. Close the map, enter Blackjack and use Back to the Floor. R12 camera return must still work.
5. Test on mobile touchscreen and with WebGL disabled. The HTML table shortcuts should remain usable.
6. Confirm no storage change merely from opening, selecting, or closing the map.

CI qualifies source and browser behavior, not every physical GPU, input device or screen reader combination. Do not merge if tests fail.
