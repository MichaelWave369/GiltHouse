# R15: Glowing 3D Casino Walking Guides

**Status:** PR candidate. Do not claim a public deployment until GitHub Pages publishes the merged commit.

## Player experience

- Enter the existing optional Three.js gaming floor, open **Show floor map**, and select one of the eight casino tables.
- Close the map. A short, visible gold-arrow trail remains **on the physical 3D floor**. It points along the collision-safe walking route calculated by R14, constrained by R13's solid tables.
- Keep walking and turning with WASD, Q/E, the arrows, drag and mobile touch controls. No auto-navigation, teleport or game action occurs.
- As you move, the trail recomputes periodically from your current position and turns to follow the new valid walking path. Its display is not a player controller.
- A compact read-only guide badge names the destination and approximate distance. **Clear guide** removes the graphics and badge without altering casino chips.
- The original map continues to work with WebGL unavailable, where the visual trail cannot render. The standard HTML casino shortcuts remain functional.
- Entering an existing game from a table still uses R12 camera handoff; the guiding target itself is temporary component state and does not persist when the 3D room unmounts.

## Architecture

- `src/lib/casino/floor3d-guide.ts` samples a **bounded maximum of 72** deterministic arrows from R14's validated polyline. Sampling fails closed if any arrow falls inside R13's solid table footprint. It contains no authority or casino state.
- `src/components/casino/floor-walk3d.tsx` uses **one Three.js InstancedMesh** for all arrow markers, so trail rendering adds one small GPU batch rather than a separate material and draw call per arrow. All geometry and material resources are still cleaned up via the existing scene teardown on exit.
- Current map target is held in React state and reflected in a read-only ref for the renderer. Selecting a target **does not restart the WebGL renderer**.
- Replanning occurs when the target changes, the player moves about 0.6 meters, or after 1.7 seconds. There is no per-frame path search and no additional external asset/API request.
- The map itself remains an accessible SVG overlay, with eight existing destinations. The 3D indicator uses an HTML label and clear button for mouse, keyboard and touch use.

## Verification

- `src/lib/casino/floor3d-guide.test.ts`: each table route samples only non-solid markers that lie on the validated map route, with bounded count and finite yaw. Tests include mutated and denied geometry, invalid distance, empty route and no gameplay authority fields.
- `scripts/check-floor3d-browser.mjs`: extended Chromium Pages journey selects the map target, closes the map, verifies an active guide with finite bounded marker count when WebGL starts, then clears it. Also repeats R13's real table collision walk and R12's game return.
- Existing Neon Block, static Pages, Gilt House lobby, accessibility and Training Lab checks all remain required.

## Safety and independent products

The route is **visual-only**: no moving avatars, simulated input, payouts, odds, RNG, cards, tokens, chip storage, authorizations, agents, model inference, payments, accounts, remote requests or persistent state changes. Gilt House's casino chips remain free, local, nonredeemable entertainment counters.

The separately sold **Neon Royal / City369** application stays completely independent. No imports, commerce workflows, credentials, user data or sharing have been introduced.

## Manual acceptance after merge

1. Enter Gilt House Live → casino directory → **Explore the 3D gaming floor**.
2. Open **Show floor map**, choose Blackjack, close map. Verify a gold floor trail visibly appears on a real WebGL device.
3. Turn and walk to the table. The arrow path should update while remaining off solid furniture. Press F beside the table to open the original game.
4. Re-enter 3D from that game. Camera restoration should still work. Targets are intentionally cleared when the 3D room is remounted.
5. Clear an active guide and confirm all arrow markers disappear.
6. Open on a phone and test touch controls, narrow screen sizes and WebGL failure. The map and accessible casino buttons must remain usable.
7. Monitor memory and FPS on a low-powered device after repeated map opening, replanning, and exiting/re-entering the 3D room.

**Browser CI proves functionality, not subjective glow quality or broad GPU compatibility.** Validate visually after public deployment.
