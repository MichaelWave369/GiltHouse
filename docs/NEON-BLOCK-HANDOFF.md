# Neon Block handoff

## Completed

- Playable side-scrolling Neon Block at 320×180, integer-scaled, with sidewalk, traffic, marquees, and walk-cycle characters.
- Twelve interiors: diner, Velvet Vintage, Gilt House lobby, Record Cellar, Arcade Annex, Paperback Palace, Second Chance Pawn, Copper Comet, Last Call, Starlight Palace, Grand Mirage, plus the street and both gates.
- Shops priced only in street tokens. Food, clothes (worn on the sprite), records (jukebox id), books, and a few quest objects.
- Dialogue for the opening cast, five sidewalk encounters, quest journal, objective line, reputation.
- Story: Arrival, Three Stutters, Low Band, The Midnight Signal, plus Griddle Jazz, Lucky Lou, the locket, and the lost photograph.
- Two skill cabinets: Pulse Line and Marquee Memory. Payouts are street tokens with a cooldown.
- Existing casino, Pit, Training Lab, sports wire, and agent arena stay on their routes. The Floor and the lobby doors open them. A back button returns to the street position you left.
- Separate save `gilt-house-world-v1` with version, migration from a hypothetical v0, and corrupt fallback. Resetting the walk does not clear chips.
- Remote agent adapter is refused. Local scripts may only talk, move, or emote.
- Docs: this file, architecture, content guide, QA.

## Incomplete

- Second district past the east gate. The gate tells you the block is the map tonight.
- Full browser playthrough of every interior and both arcade cabinets.
- Deeper walk cycles (the sprite bobs and steps; it is not a multi-frame illustrated sheet).
- Weather, a secret jazz door beyond Starlight's rope, and a real rooftop scene. The roof is story, not a room.
- Remote PhiBot play. Types exist. The switch stays off.
- A pulled request on GitHub. This environment built the game in the live app workspace. No branch or PR was opened from here, and no commit hash should be invented.

## Files

See `docs/NEON-BLOCK-ARCHITECTURE.md` for the module table. Casino gameplay files under `src/components/casino` and `src/lib/casino` were preserved. Additive edits: `src/lib/casino/audio.ts` (separate street bus), `src/lib/casino/store.ts` (exported chip storage key only), `src/routes/index.tsx` (shell instead of mounting the casino directly), `src/routes/__root.tsx` (description), `src/styles.css` (pixel scaling helpers).

## Tests

Recorded in `docs/NEON-BLOCK-QA.md`. World tests and training-lab tests passed. Boundary manifest test passed. Typecheck passed. Production build passed. Dev and built browser smokes passed with no console errors.

## Known bugs

- Standing inside talk radius of a person always beats a door. NPCs are placed off the doors; a new one dropped on a threshold will block it.
- Street music and lounge music share an unlock gesture. A reload is silent until a click or key.
- The chip purse is not written to disk until the existing casino store persists a change. That predates the street.
- Encounters can still feel early if you pace the sidewalk for a long time. Cooldown is about 70 seconds after one fires, and many are once.

## Security

No real-money wagering, no chip-to-token conversion, no paid-app imports, no remote model calls. Browser saves are editable. Do not treat them as authority.

## Dependencies

Existing app stack plus `three`, already required by the casino arena. No new backend. No new auth.

## Performance

The street redraws a few hundred rectangles a frame into a small buffer, then blits once. The casino WebGL room mounts only while you are inside the casino. The production bundle still carries the three.js chunk because the arena is still in the app.

## Deployment

The dev server for this workspace is the preview. `npm run build` completed. Publishing is the owner's deploy step. The discovery JSON was not rewritten.

## Next rungs

1. Walk the remaining interiors in the browser and tighten any door that overlaps a character.
2. Draw a real 4-frame walk sheet if you want the people less geometric.
3. Add one more block only after this one feels hand-walked, using the content guide.
4. If a 3D scene is built, reuse scene and NPC ids. Do not fold in the paid city app.
5. Any real agent belongs behind `reviewAgentAction`, with a budget that stays at zero until a person raises it.

## Branch and PR

Not created in this session.
