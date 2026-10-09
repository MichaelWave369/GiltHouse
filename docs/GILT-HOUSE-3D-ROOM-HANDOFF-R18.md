# Gilt House R18: Direct 3D Lobby → 3D Gaming Floor

**Status:** Review candidate; not deployed until merged and GitHub Pages finishes successfully.

## The transition

Before R18, players entered the 3D Grand Lobby, chose **The Floor**, landed in a 2D casino directory, and had to select **Explore the 3D gaming floor** to continue in Three.js. R18 removes that unnecessary interruption **only for deliberate 3D-lobby floor entry**.

1. Walk inside the existing 3D Grand Lobby and approach its **The Floor** doorway. Press F/Enter or tap its door when within R10 proximity; the existing HTML Floor shortcut still works as an accessible alternative.
2. The original optional **3D gaming floor** now opens directly as soon as the casino app mounts, with all eight existing table stations, R13 collision, R14 map, R15 arrows, and R16 arrival beacons.
3. Use **Back to 3D Grand Lobby** to return to the Gilt House 3D entrance lobby, or **Back to casino directory** to continue in the original 2D casino menu.
4. The ordinary 16-bit **The Floor** button, street-door routes, and any other 2D casino entry **still open the classic 2D directory by default**. No global autoplay of Three.js is introduced.
5. Casino table gameplay and the R12 camera-return handoff are unchanged. After returning from Blackjack, a visit that originated in the Grand Lobby still resumes the optional 3D floor and retains the explicit Grand Lobby return button.

## Architecture

- `src/lib/world/lobby3d.ts`: pure provenance guards for starting and returning the cross-room 3D visit. Only `gilt-lobby + street + lobby-3d panel` without a dialogue/arcade can start a direct transfer.
- `src/lib/world/store.ts`: new **ephemeral, in-memory** `casino3DFromLobby` flag and narrow `enterCasino3DFromLobby` / `returnTo3DLobby` actions. They update view/UI navigation only, never write the world or casino save. Ordinary `enterCasino`, `leaveCasino`, and game reset clear the flag.
- `src/components/world/lobby3d.tsx`: Floor door raycast, F interaction, nearby action and HTML room shortcut all use the guarded 3D transfer. Other three doors still open their previous existing modes.
- `src/components/casino/app.tsx`: consumes ephemeral origin flag and controls the explicitly requested return to the 3D Grand Lobby, stopping casino audio.
- `src/components/casino/floor.tsx`: initializes its existing lazy 3D showroom when the valid transfer flag is present; the conventional 2D directory remains below as a fallback.
- `src/components/casino/floor-walk3d.tsx`: contextual Back to 3D Grand Lobby button only for visitors who came from the actual 3D entrance. Standard Back to casino directory is unchanged.
- `src/lib/world/lobby3d.test.ts`: rejects unauthorized scene/panel/mode/active-interaction paths and invalid 3D lobby returns.
- `scripts/check-lobby3d-browser.mjs`: actual static-Pages Chromium check travels from the 3D Grand Lobby straight to the 3D gaming floor, returns to 3D Grand Lobby, then verifies ordinary 2D floor access does not automatically open 3D. It retains R17 real pillar collision and Training Lab navigation tests, and asserts no navigation-related chip changes.

## Hard boundaries and limitations

- No automatic wager, new casino engine, odds, payouts, RNG changes, real-money value, wallet, cryptocurrency, agent authority, API call, commerce, or user-account changes.
- No new dependencies, assets, backend, storage key or network activity. Both Three.js rooms already exist, and only one is mounted at a time.
- Commercial **Neon Royal / City369** remains entirely independent, with no shared deployment, customers, finances, permissions, or imported code.
- Returning to the Grand Lobby currently starts its 3D camera at the usual lobby spawn. R18 transfers **room choice**, not a persistent cross-room lobby camera pose.
- WebGL failure keeps the accessible HTML room shortcuts usable. The existing 2D casino remains available.

## Manual device QA

1. Use the 16-bit street to enter Gilt House. Enter 3D Grand Lobby.
2. Approach The Floor door and press F, then test a nearby tap and the HTML shortcut. Each should take you directly to the **3D** gaming floor.
3. Check all eight game tables and ensure R16 table beacons/maps still work, then use **Back to 3D Grand Lobby**.
4. From the 3D lobby, visit Training Lab or The Pit and return. Their original paths must be unchanged.
5. Leave for the 16-bit street; click its **The Floor** HUD entry and confirm the conventional **2D** directory still loads.
6. Try **Back to casino directory**, direct game entry and R12 gaming-floor camera restoration; verify chip purse remains unaffected by room navigation.
7. Test a slower physical GPU/mobile screen, WebGL unavailable mode, and repeated round-trips for listener/audio/GPU leaks.

The automated browser suite checks functional navigation, not the visual quality of a true room-to-room transition on every device. No VR headset qualification is claimed.
