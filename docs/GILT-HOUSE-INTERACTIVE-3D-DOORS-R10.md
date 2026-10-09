# Gilt House R10: Interactive 3D Casino Doors

Status: PR candidate, subject to green CI and human visual inspection.

## What changed

R9 supplied an optional Three.js casino lobby and four accessible HTML room buttons. R10 makes its **actual 3D doorway surfaces interactive**, keeping the existing 16-bit street and the casino engines unchanged.

- Walk toward any of the four glowing doors on the north wall.
- When your camera is near an existing doorway, a visible `F · Enter …` prompt appears.
- Press **F** or **Enter** (while the 3D room itself is focused), or click the proximity prompt, to enter the nearby existing casino room.
- Click or tap a doorway in the rendered 3D canvas. **This does not teleport from across the room.** The renderer raycasts the panel, checks the station against a strict known-room list, and enforces the same proximity rule. If you are too far away, it shows an instruction to approach.
- Dragging the viewport remains camera look; tap recognition tolerates tiny finger movement but rejects drags.
- All original HTML quick-access buttons still work even on devices where WebGL fails, and continue to be the accessibility fallback.

A near-door prompt is derived from camera proximity only. Its selection does **not** write to the player, quest, street token or casino state; the actual room transition uses the existing `useWorld.enterCasino` action.

## Controls

- **W/S**, Up/Down: walk forward/back
- **A/D**: strafe
- **Q/E**, Left/Right: turn
- **F** or Enter near a door: enter
- **Drag**: rotate view
- **Tap** near a door: interact
- Bottom area room buttons: open existing room regardless of camera position
- **Back to 16-bit lobby**: resume previous 2D location

Movement is clamped to the existing bounds. Interactivity is allowed only in the actual Gilt House 3D view (already gated by the existing `gilt-lobby` scene). It opens no new casino actions, privileges or wagers.

## Implementation

- `src/lib/world/lobby3d.ts`: pure `nearbyLobbyStation` and `canEnterLobbyPortal` guards.
- `src/components/world/lobby3d.tsx`: raycast targets on original 3D door meshes, pointer tap vs drag filtering, live proximity prompt and keyboard entry. Input listeners and GPU resources still clean up on unmount.
- `src/lib/world/lobby3d.test.ts`: tests that every room can be reached only near its own physical door; wrong/stale/privileged room IDs and nonfinite camera positions are rejected.
- `scripts/check-lobby3d-browser.mjs`: checks F cannot teleport from the starting lobby position; preserves existing 3D→Training Lab→16-bit roundtrip and chip-isolation checks.
- Existing workflows run regression, TypeScript, lint, full-stack build, static build, desktop/mobile smoke and optional 3D browser acceptance.

## Safety, product separation and limitations

Gilt House entertainment chips have no cash value. The 3D lobby is a scene navigator and never edits odds, tickets, payouts or balances. There is **no** direct local Ollama, remote PhiBot, learning promotion or authorization change.

The separately sold Neon Royal / City369 application and its commerce, authentication, data and deployment are never imported, modified or connected.

The browser test verifies route behavior but is not a substitute for human evaluation of lighting, click targeting, physical mobile touchscreen behavior, native WebGL performance or actual VR hardware. These remain manual release-acceptance tasks.

## Manual acceptance

1. Open the Gilt House GitHub Pages site in a desktop browser, enter Gilt House from the retro street, then enter the 3D lobby.
2. Confirm **F** doesn't teleport from the spawn point.
3. Walk toward one of the four glowing doors, confirm the prompt appears for the correct destination and press F.
4. Return to the 3D room, approach another door and test a short tap vs drag. A tap near the door enters, while a drag rotates the camera.
5. Confirm the existing room buttons work even if WebGL is disabled, and test on a phone.
6. Verify the casino chip purse and Neon Block local save are unchanged by room navigation.
