# Gilt House R9: Optional 3D Grand Lobby

Status: **review candidate; must pass CI and human browser inspection before merging.**

## What changed

Players retain the original, fully playable 16-bit Neon Block and the Gilt House casino floor. R9 adds an **opt-in, lazily loaded Three.js Art Deco lobby** available after walking through the Gilt House street doorway into `gilt-lobby`.

From the existing 2D Gilt House lobby, choose **Enter 3D lobby** in the top navigation (or **Menu → 3D Grand Lobby**). A new screen presents a procedural, original WebGL room with gilded pillars, decorative chandeliers, illuminated architectural portals, polished checkerboard floors and a central velvet carpet. Nothing in the 2D quest, save, player location, math engine, or casino economy is changed.

### Controls

- **W / S** or **Up / Down**: walk forward/backward in the room.
- **A / D**: strafe sideways.
- **Q / E** or **Left / Right arrows**: turn.
- **Drag** across the canvas: turn/view around.
- On mobile: six on-screen direction and turn controls.
- **Back to 16-bit lobby**: return to exactly the same 2D scene and position.
- Select **The Floor**, **The Pit**, **Training Lab** or **The Agents** to open the EXISTING casino modes via the existing `useWorld.enterCasino` method.

The three standard casino stations correspond to already-established 2D lobby destinations. The agent arena is also a pre-existing casino view and receives no new runtime permissions. The 3D room does not add mini-games, chips, wagering, quests or agent autonomy. Its camera position and orientation are ephemeral and do not write browser saves.

### Devices and fallback

- Loads Three.js only on explicit entry, not when the world starts.
- Caps device pixel ratio at 1.5 for browser efficiency.
- Supports resize/orientation changes and has a bounded, clamped walkthrough.
- Reduced-motion mode freezes decorative animation, while manual controls still work.
- If WebGL cannot initialize, a clear notice appears but the **four real room navigation buttons remain usable**.
- Renderer, geometries, materials, textures, animation frame and all listeners are disposed on exit.

### Architecture and isolation

- `src/lib/world/lobby3d.ts`: immutable room manifest and camera bounds.
- `src/components/world/lobby3d.tsx`: on-demand Three.js renderer, input and navigation, WebGL fallback.
- `src/components/world/overlay.tsx`: lazy route and lobby-only entry buttons.
- `src/lib/world/store.ts`: fails closed if any attempt opens `lobby-3d` from another location or during an encounter.
- `src/lib/world/lobby3d.test.ts`: destination allowlist and boundary tests.
- `scripts/check-lobby3d-browser.mjs`: independent Chromium check against the actual Pages build, including Gilt House location, 3D overlay and Training Lab roundtrip.
- Existing full-stack app and GitHub Pages static build continue to use the same React UI and shared game module. No change to SSR or the static file path is required.

**No changes to the separately sold Neon Royal / City369 product, accounts, licensing, customer data, or payment infrastructure.** No real-money wagering, cashouts, cryptocurrency, agent spending, remote model calls, or direct Ollama connection.

## Qualification

Run:

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build:pages
npm run check:pages
npx playwright install --with-deps chromium
node scripts/check-lobby3d-browser.mjs
```

CI includes this browser check for the Pages build. Since headless Chromium may use software WebGL or decline WebGL entirely, it qualifies room navigation and fallback rather than asserting physical GPU quality or headset support.

### Manual QA still required

1. Enter Gilt House from The Neon Block using the street door.
2. Open 3D lobby; verify floor, gold columns, four station plaques, responsive motion.
3. Move/turn with desktop controls and drag. Test tap/hold movement on mobile.
4. Open The Floor, play a normal free-chip round, return to the street and verify save state.
5. Open The Pit/Training Lab/Agents and return.
6. Disable WebGL if possible and verify the fallback is readable and buttons still work.
7. Verify no double audio loops, no obvious GPU crashes and reduced-motion behavior.

**R9 is a 3D showcase and room navigator, not full 3D street exploration or VR-headset qualification.** It is intentionally scoped to preserve the existing pixel-art game and keep the deployment free.
