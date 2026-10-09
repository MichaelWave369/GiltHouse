# Gilt House R12: Return to Your 3D Table

**Status:** PR candidate. The 3D gaming floor remains optional, browser-local, and a visual navigation layer over the original casino.

## Player experience

1. From the classic casino directory, choose **Explore the 3D gaming floor**.
2. Walk toward any of the eight decorative tables, then use F, Enter, a nearby tap or the accessible table shortcut to open its existing game.
3. Play the original game. When you use **Back to the floor**, the 3D showroom now reopens automatically with your previous **camera position and look angle**, not the original spawn location.
4. Repeat as desired with other tables, or choose **Back to casino directory** to deliberately leave 3D. Closing the 3D room clears that return ticket.
5. Visiting a casino game directly from the *classic 2D directory* still returns to the 2D directory. The 3D scene never opens without a prior explicit showroom visit.

If the page reloads, you leave the casino for the street, or close the browser, the temporary return ticket disappears. The behavior is scoped to an active 3D showroom visit within this casino session, **not a persistent game save**.

## Implementation

- `src/lib/casino/floor3d.ts`: `Floor3DPose`, `FLOOR3D_START_POSE`, `normalizeFloor3DPose`. A pure camera clamp validates coordinates and heading.
- `src/components/casino/floor-walk3d.tsx`: captures live camera position/heading in a lightweight ref, hands it to `onChoose(game, pose)` for both physically entered tables and accessible quick links, then reinitializes from the validated position when mounted again.
- `src/components/casino/app.tsx`: holds the **ephemeral** camera handoff *above* view switching, in local React state only.
- `src/components/casino/floor.tsx`: automatically reopens 3D when there is a pending handoff; explicit close clears it.
- `src/lib/casino/floor3d.test.ts`: verifies defaults, finite/clamped coordinates, heading and absence of money fields.
- `scripts/check-floor3d-browser.mjs`: browser verifies the 3D floor → actual Blackjack → 3D showroom loop, explicit exit, and then *2D directory → another existing game → 2D directory* without re-entering 3D.

## Strict product and trust boundaries

- The handoff has only `x`, `z`, and `yaw`. It is not stored in either `gilt-house-world-v1` or `gilt-house-v1`.
- No changes to chip balance, RNG, odds, casino settlement, wager authorization, street tokens, quests, accounts, user data, memory, API calls or agent routing.
- The actual game still occurs inside the original React casino components; the new functionality is presentation/navigation only.
- The independent commercial Neon Royal / City369 product is not touched or imported, and no code or commerce workflows are shared.

## Qualification

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run build:pages`, and `npm run check:pages` before browser QA.

The existing Pages CI runs the real Chromium suites, including `node scripts/check-floor3d-browser.mjs`. This test checks the resume/exit experience and confirms simple navigation does not alter local play-chip storage. All R8–R11 browser checks must stay green.

Manual desktop and mobile acceptance should also verify an actual *non-spawn* camera location after walking to a table (headless Chromium may use software WebGL/fallback). Confirm that repeated game returns resume smoothly with no unwanted audio loops or WebGL memory leaks.

**This is not an auto-play or automation system.** It resumes the *player's viewpoint*, not an unresolved card hand or a real-world financial transaction.
