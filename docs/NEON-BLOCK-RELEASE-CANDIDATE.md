# Neon Block release candidate

Status: **playable first-chapter candidate. Not a commercial release. Not VR-ready. Not a real-money casino.**

Baseline this pass started from: `79b82e85ec85d1370d2de06cf0ef00cea09a2ba1` on `main`. This completion work is a pull request. It was not merged from this session.

## What a player can do

- Read the title, start or continue a walk, open the casino without walking there, and change music, mute, and motion.
- Walk the one district, talk, and enter doors even when someone is standing on the threshold.
- Shop with street tokens, wear clothes, eat, play two arcade cabinets, and finish The Midnight Signal.
- Enter the existing casino, including the Training Lab, and come back to the same sidewalk or room.
- Keep chips and the street journal in different browser keys.

## What this candidate is not

- A second district. The east gate still says the block is the map.
- A headset build. The WebGL arena is still the experimental casino view.
- A remote agent. PhiBots stay off. No model calls were added.
- A guarantee that every shop was clicked in a browser this pass. See the QA file for the split between unit tests and browser journeys.

## Commands run in this pass

- `npm test` — passed (script tests and the world, training, auth, and app-data tests).
- `npm run typecheck` — passed.
- `npx eslint . --quiet` — passed (no errors). `npm run lint` is the CI lint step and treats warnings as non-failing.
- `npm run build` — passed. Database migrate skipped because `DATABASE_URL` was unset.

GitHub Actions workflow `.github/workflows/neon-block.yml` runs those four commands on pull requests and on `main`. It had not been observed green on GitHub at the time this note was written.
