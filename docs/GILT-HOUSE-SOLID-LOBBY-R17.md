# Gilt House R17: Solid Grand Lobby

**Status:** Review candidate, not live until the PR is merged and Pages deploys green.

## Why

R13 introduced solid geometry on the **3D gaming floor** but the older R9 **3D Grand Lobby** still allowed the viewpoint to travel straight through gold support columns and small decorative brass posts. R17 aligns the entrance lobby with the gaming floor's movement physics while preserving R10's four usable door approaches.

## Player experience

- All eight gilded wall-side support columns (x ±7.9; z −7, −2, 3, 8) and six small brass queue posts (x ±4.7; z 0, 4, 7) have solid collision footprints sized to the visible geometry plus an approximate visitor-body margin.
- Walking into a column/post is blocked. Moving diagonally along one slides on the free axis rather than freezing.
- Diagonal movement is normalized so forward+strafe does not move faster than a straight walk.
- Frame motion is capped and swept in 7-centimeter substeps to prevent slipping through posts after dropped WebGL frames.
- Low-FPS/software WebGL movement uses a capped 250-ms delta so the camera remains usable on slower devices.
- A small X/Z readout and a gentle obstruction message appear inside the 3D lobby when applicable. No new game HUD or world save is created.
- The carpet/gold trim is intentionally **not** treated as a physical wall. The central corridor and all four actual doors remain accessible. R10's tap/F distance and room-ID checks remain unchanged.

## Files

- `src/lib/world/lobby3d.ts` adds `collidesLobby3DObstacle`, `advanceLobby3DCamera` and fixed collision constants, with no extra rendering dependencies.
- `src/components/world/lobby3d.tsx` uses those pure rules in the existing optional, lazy-loaded Three.js lobby. No new textures/geometry/network calls.
- `src/lib/world/lobby3d.test.ts` tests all 14 existing structural obstacles, swept movement/no tunneling, diagonal sliding, invalid numeric data, preserved spawn, and a full route from spawn to **every** allowed casino room door.
- `scripts/check-lobby3d-browser.mjs` uses Chromium and the built GitHub Pages app to strafe into a real gold column at z=8, verifying collision when WebGL is available. Without WebGL, the original accessible HTML room navigation and Training Lab return are still tested. Gilt House Pages runs this browser gate alongside the casino floor and desktop/mobile smoke tests.

## Boundaries

- The physics is local viewpoint navigation only. No new wagers, chips, financial value, odds, settlements, house-edge changes, account privileges, agent actions, model calls, API keys, data collection or persistence.
- Existing Gilt House 16-bit story, casino, agent desk and room navigation are preserved.
- Separately sold Neon Royal / City369 remains **fully independent**: no shared code, payments, customers, data, entitlements or deployment.

## Manual acceptance after deployment

1. Open the 16-bit Gilt House scene and select **Enter 3D lobby**.
2. Move against a gilded column near the side wall. Verify the camera stops without passing through it.
3. Walk into and slide around a brass queue post with diagonal controls.
4. Check all four northern doors via physical F/tap interaction as well as their existing accessible HTML shortcuts.
5. Return to the 16-bit scene; reopen the lobby and visit the Training Lab. No chips should be altered simply by walking.
6. Repeat on a touchscreen and with WebGL disabled. Confirm that reduced-motion and renderer cleanup still work.

Physical-device responsiveness and subjective art quality need a human review after Pages deployment. This rung does not claim full rigid-body or VR simulation.
