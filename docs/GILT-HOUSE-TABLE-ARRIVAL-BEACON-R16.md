# R16: The Table Arrival Beacon

**Status: PR candidate.** The public site does not contain R16 until the PR is reviewed, merged, and GitHub Pages deploys successfully.

## Player experience

R15 added gold walking arrows. R16 gives the guide a clear **arrival destination** rather than expecting a player to infer the correct point from an arrow trail.

1. Enter **Explore the 3D gaming floor**, open **Show floor map**, and select a casino table.
2. Close the map. The floor arrows remain, and a small **gold ring with a hovering diamond** identifies the safe arrival point on the central aisle beside the chosen table. It is **not inside** the table's R13 solid collider.
3. The floating guidance panel names your destination, approximate remaining walking distance, and plain-language direction (turn left/right, continue forward, or turn around). These prompts adapt when your camera turns or moves.
4. When the player walks within the existing casino table interaction range, the panel changes to **You've arrived!** and shows **Enter selected table**. That button invokes **the same existing game view and the same distance/nearest-table guard** as the F key. It cannot enter a table from the entrance or from a neighboring table.
5. **Clear guide** hides the arrows, ring, diamond and panel. Map selection, automatic entry, teleports, wagering, spending, and storing navigation data are not introduced.
6. If WebGL is unavailable, the existing map and eight HTML game shortcuts remain accessible. There are no false claims of live 3D beacons in fallback mode.

## Implementation

- `src/lib/casino/floor3d-arrival.ts`: pure, read-only destination and arrival state. `floor3DArrival(pose, game)` exposes only `game`, `label`, `destination`, `distance`, and `canEnter`. The crucial `canEnter` calls the existing R11 `canOpenFloor3DTable` guard unchanged.
- `src/components/casino/floor-walk3d.tsx`: two lightweight Three.js meshes and no new light sources, animations frozen in reduced-motion mode. Geometry/materials use the established scene disposal on exit. Existing GPU instanced directional arrow batch (72 max) remains unchanged.
- The active guidance label updates using the existing R14 `floor3DHeading` and refreshes on camera turn, motion, or periodic route replanning. It never automatically dispatches input.
- `src/lib/casino/floor3d-arrival.test.ts`: all eight destinations, wrong-table rejection, spawn distance protection, invalid/privileged IDs and non-finite values.
- Extended `scripts/check-floor3d-browser.mjs`: selects Blackjack on the map, confirms the GPU beacon state when WebGL initializes, walks into the existing solid-rail interaction zone, checks the arrival state and selects **Enter selected table**. The same test verifies the original Blackjack game loads, R12 camera return works, and no chips were changed by walking/navigation. On unsupported WebGL, it tests the accessible 2D route instead.
- Existing Neon Block, Pages, 3D lobby, Training Lab, layout and accessibility qualification still gate merge.

## Privacy, commerce and authority

**Visual-navigation-only change.** No new casino game engine, RNG, payouts, bets, purchases, account privileges, remote agent calls, model inference, telemetry, localStorage changes, or real-money value. The separately sold **Neon Royal / City369** product remains completely independent, including commerce, customer data, hosting and runtime.

## Manual verification after public deployment

1. On a real GPU browser, select The Shoe. Confirm the glowing destination ring/diamond visibly appears **on the aisle**, not inside Blackjack's table.
2. Follow the golden arrows. Turn and verify the plain-text directional prompt changes; test reduced-motion settings.
3. Approach the station; verify **You've arrived** and the Enter button only appear beside the correct table.
4. Verify keyboard F and the new Enter button open the same existing Blackjack game. Return via **Back to the floor** and check R12 camera continuity.
5. Test **Clear guide**, another destination, mobile touch, WebGL-disabled fallback and a smaller screen.
6. Monitor actual GPU FPS and memory across repeated table-guidance changes.

No headset/WebXR readiness is claimed. CI checks behavior; a hands-on check is needed for actual appearance and feel.
