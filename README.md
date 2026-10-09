# Gilt House — The Neon Block

Gilt House is a standalone supper-club of **play chips** plus a walkable fictional district called **The Neon Block**. Chips and street tokens have no cash value. They are not interchangeable. This app is not the commercial Neon Royal city explorer and does not depend on it.

## Play

Open the app. Pick a look, then walk the sidewalk.

- **A / D** or **Left / Right** move. On a phone, use Left, Act, Door, and Right. Door appears when an entrance is close.
- **E** or **Act** talks, reads, or plays. **W** uses a door. If someone is standing in the doorway, both lines show.
- **Esc** closes the open panel, then opens the menu. The title and the character creator ignore Esc on purpose.
- **The Floor** jumps straight to the classic casino: blackjack, roulette, craps, baccarat, poker, slots, keno, the wire, the Pit, the Training Lab, and the agent arena.
- The grand door on **Gilt House** enters the lobby first. From there you can still reach every table.

Street tokens pay for the diner, Velvet Vintage, records, books, and the pawn case. Arcade cabinets pay a few more tokens for skill. None of that changes casino odds, and none of it can be cashed out.

## The night

The opening walk is **The Midnight Signal**: count three stuttering marquees, follow the count through Ruby Static, the Record Cellar radio, Switch, Professor Luckless, and the night desk at the Grand Mirage. Side paths include Dottie's record errand, Lucky Lou's bad system, Cleo's locket, and a lost photograph.

## Saves

- Casino purse: `localStorage["gilt-house-v1"]` (unchanged).
- Street journal: `localStorage["gilt-house-world-v1"]`.
- Resetting the walk does not clear chips. A corrupt street save falls back to a fresh walk and leaves chips alone.

## Scripts

`npm run dev` serves the app. `npm test` includes the street rules and the existing training-lab checks. `npm run typecheck` and `npm run build` are the release gates.

## Limits

Browser storage is not secure and not a wallet. The 2D district is the game. The WebXR arena is still the experimental casino view; a headset was not part of this build. Remote agents stay off. See `docs/NEON-BLOCK-HANDOFF.md`.

## GitHub Pages static edition

The separate **Gilt House Live** build reuses the real React/Canvas Neon Block and client-side casino rooms without changing the hosted TanStack Start application. The server-dependent live sportsbook is unavailable on GitHub Pages; it still works in the original hosted edition. Local saves are independent per origin. The static release URL, **once Pages is enabled and deployed**, is expected to be [michaelwave369.github.io/GiltHouse](https://michaelwave369.github.io/GiltHouse/). See [the R7 deployment guide](docs/GILT-HOUSE-LIVE-PAGES-R7.md).

```bash
npm run build:pages
npm run check:pages
```
