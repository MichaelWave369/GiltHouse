# Neon Block handoff

## Completed in the release-candidate pass

- Title card with New Game, Continue, quick casino, controls, music, mute, and reduced motion. Chapter-one card after Ivo finishes The Midnight Signal.
- E talks or uses a hotspot. W uses a door. Both prompts show when Wick (or anyone) stands on a threshold. Touch gets a Door button when a door is in range.
- Held keys release on blur, a hidden tab, and pointer cancel. Game keys do not scroll the page unless you are typing in a field.
- Agent review checks direction, NPC id, emote, source, and privileged fields. Remote play stays off.
- Arcade cabinets have a start screen. Leaving clears a pending Pulse Line payout timer. Forged scores do not pay.
- Dottie has a "usual" line after you have tasted coffee.
- Walks use four stride frames. A few people wear an apron, phones, a coat, or a spark so they are easier to tell apart. Still procedural pixels, not a licensed sheet.
- CI workflow `.github/workflows/neon-block.yml` runs `npm ci`, `npm test`, typecheck, lint, and build.
- `.vercel/output` is treated as generated and ignored. It is not required source.

## Still incomplete

- Browser play of Velvet, the arcade cabinets, every interior, and the full Midnight Signal chain.
- Listening proof for the street bus.
- Landscape, tablet, and 1920×1080 passes.
- Answering all eight Training Lab challenges in a browser.
- A second district, weather, and a rooftop room.
- Remote PhiBot play.

## Files touched for this pass

World rules and UI: `src/lib/world/*`, `src/components/world/*`. Small casino-side fixes so lint is clean: `src/lib/casino/agents.ts`, `src/lib/casino/training-lab.test.ts`, `src/casino-ambient.d.ts`, `src/lib/app-data/client.server.ts`, `src/lib/world/save.ts` unused import. PWA tests now pass an isolated cwd so Gilt House's real `site.json` does not leak into template assertions. Docs in `docs/NEON-BLOCK-*.md`.

Casino odds, payouts, and the chip key were not changed. City369 was not touched.

## Tests

See `docs/NEON-BLOCK-QA.md` for the command results and which journeys were actually clicked.

## Known bugs

- A person on a door no longer hides the door, but you do have to use W or the Door line. E talks.
- Street music still waits for a click or key after a reload.
- The chip purse is still not written until the casino store saves a change. That predates the street.
- Encounters can still feel early if you pace the sidewalk. Cooldown is about 70 seconds after one fires.

## Security

No real-money wagering, no chip-to-token conversion, no paid-app imports, no remote model calls. Browser saves are editable. Do not treat them as authority.

## Next rungs

1. Click Velvet, both cabinets, and the Midnight Signal chain in a browser and fix whatever that walk finds.
2. Listen to the street bus on a real machine and mark audio verified only after that.
3. Add one more block only after this one has been hand-walked.
4. Any real agent belongs behind `reviewAgentAction`, with a budget that stays at zero until a person raises it.
