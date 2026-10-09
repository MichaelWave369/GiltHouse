# Gilt House R13: Solid Table Collision & Navigable Aisles

**Release state:** review candidate. R13 changes optional Three.js showroom *movement only*. The 16-bit Neon Block, classic casino directory, and all game economics are unchanged.

## Player behavior

- All eight original 3D tables now have collision bodies aligned with their physical 3.0 × 2.15-meter table platform dimensions, plus camera/body clearance.
- Walking into a felt table or brass rail **stops at the obstacle**. Diagonal walking slides along the obstruction's open axis, rather than freezing.
- A central aisle down the entire floor stays open. Both sides of each table have accessible interaction distance for **F/Enter**, raycast taps, and the HTML room shortcuts.
- Fast frame deltas are subdivided and bounded. Characters cannot teleport through a table when a browser briefly stutters.
- Diagonal walking is normalized: moving forward while strafing does not produce a faster-than-normal sprint.
- A subtle “Solid table ahead” feedback message appears when movement is obstructed, and a small in-room X/Z position readout helps with navigation and testing.
- Previous R12 return-camera positions remain in memory only; rare older poses *inside* a new solid table are relocated to the nearest clear aisle edge on re-entry. Valid positions remain unchanged.

## Implementation

- `src/lib/casino/floor3d.ts`: `collidesFloor3DTable`, swept `advanceFloor3DCamera`, `safeFloor3DReturnPose`, fixed clearance margins, step bound, and aisle-preserving AABB logic.
- `src/components/casino/floor-walk3d.tsx`: replaces camera freeflight with swept collision motion, adds diagonal normalization and lightweight collision feedback / camera HUD.
- `src/lib/casino/floor3d.test.ts`: tests every table footprint; interaction reachable from the central aisle; no fast-motion tunneling; sliding movement; corridor traversal; wall constraints; legacy camera recovery; nonfinite inputs.
- `scripts/check-floor3d-browser.mjs`: when WebGL is available, drives the real showroom toward Blackjack, attempts to push through its rail, asserts the camera stays outside, and checks the nearby table prompt. On headless systems without WebGL, browser testing still covers the existing accessible casino directory with an explicit logged movement-probe skip.
- Existing CI also verifies the R12 3D → Blackjack → 3D return, explicit 3D exit, 2D-only direct game flow, unchanged chip storage, original Vite hosted build, static GitHub Pages build, desktop/mobile layout, R9/R10 lobby and Training Lab boundaries.

## Product boundaries

This is locally calculated **camera physics**, not a new game engine or gambling service. It writes no localStorage, casino purse, ledger, financial transaction, world state, agent authority, network request or model budget. All gambling chips are fictional, free and nonredeemable.

The independent paid **Neon Royal / City369** product is not imported, changed, deployed or connected in any way.

## Manual QA

1. Open the deployed Gilt House Pages site. Enter the regular casino floor, then the optional 3D gaming floor.
2. Walk straight down the central aisle, turn toward a blackjack/roulette table. Keep walking into the solid tabletop. Confirm movement blocks instead of passing through.
3. Try diagonal movement along the table to verify smooth sidestepping.
4. Confirm the **F / Enter** interaction still opens the correct game when near the table. Use a touch gesture and the accessible shortcut independently.
5. Return to 3D from a real game to verify R12 resumes at the expected safe position/angle.
6. On a phone, test long held touch controls and rotation. Test fallback HTML navigation without WebGL.
7. Test repeated opening/closing the room and ensure no accumulating camera listeners, broken keyboard controls or GPU resource leaks.

**R13 does not yet include NPC crowd physics, rigid bodies, mesh-based collision, avatar animations or VR room-scale tracking.** The intentionally simple footprint model is deterministic, low-cost, and sufficient to stop walking through the tables.
