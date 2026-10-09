# Neon Block handoff

## Completed

- Title, continue, creator, chapter card after Ivo. Closing the intro now records that it was seen, so a later Continue does not replay it.
- E talks or uses a hotspot. W uses a door. Both prompts show when someone stands on a threshold.
- Held keys release on blur, a hidden tab, and pointer cancel.
- Agent review checks direction, NPC id, emote, source, and privileged fields. Remote play stays off.
- Pulse Line counts down 3-2-1. Marquee Memory shows Ready before the bulbs. Cooldown and forged scores are enforced.
- Street and rooms are still original procedural pixels at 320×180, now with readable marquees, awnings, lamps, wet neon, and faces you can tell apart (apron, phones, coat, spark, glasses, mustache).
- Sable notices a jacket. Harvey notices Alley Brass in the bag. Ivo comments if the pin is already known. Dottie remembers coffee.
- Side errands (Griddle Jazz, Lou, the locket, the lost photograph) have unit coverage. The main chapter was also clicked through in a browser.
- CI workflow `.github/workflows/neon-block.yml` runs `npm ci`, `npm test`, typecheck, lint, and build. On PR #3 it was green before this polish commit; this commit will run it again.
- `.vercel/output` is generated and ignored.

## Still incomplete

- Street audio has not been listened to on speakers. Buses exist. Do not call them verified.
- Tablet size was not given its own pass. 390×844, 844×390, and 1920×1080 were.
- A second district, weather, and a rooftop room.
- Remote PhiBot play.

## Files

World rules and UI: `src/lib/world/*`, `src/components/world/*`. Docs in `docs/NEON-BLOCK-*.md`.

Casino odds, payouts, and the chip key were not changed. City369 was not touched.

## Known bugs

- E still talks when a person and a door overlap. Use W or the Door line to enter.
- Street music waits for a click or key after a reload.
- The chip purse is not written until the casino store saves a change. That predates the street.
- Encounters can open while you are walking. Escape leaves them. Cooldown is about 70 seconds after one fires.

## Next rungs

1. Listen to the street bus and mark audio verified only after that.
2. Add one more block only after this one has been hand-walked. It has.
3. Any real agent belongs behind `reviewAgentAction`, with a budget that stays at zero until a person raises it.
