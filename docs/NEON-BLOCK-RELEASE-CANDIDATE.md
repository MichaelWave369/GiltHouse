# Neon Block release candidate

Status: **playable first-chapter candidate. Not a commercial release. Not VR-ready. Not a real-money casino.**

Work lives on `feat/r3-neon-block-release` as [pull request #3](https://github.com/MichaelWave369/GiltHouse/pull/3). It was not merged.

## What a player can do

- Read the title, start or continue a walk, open the casino without walking there, and change music, mute, and motion.
- Walk one district, talk, and enter doors even when someone is standing on the threshold.
- Shop with street tokens, wear clothes, eat, play two arcade cabinets, and finish The Midnight Signal, including the chapter card.
- Finish the side errands that are already written: Dottie's record, Lou's system, Cleo's locket, and the lost photograph.
- Enter the existing casino and the Training Lab, and come back to the same room.
- Keep chips and the street journal in different browser keys.

## What this candidate is not

- A second district. The east gate still says the block is the map.
- A headset build.
- A remote agent. PhiBots stay off.
- Proof that the music was heard. The buses are in the code. Playback was not listened to.

## Commands this polish pass

- `npm test` — passed.
- `npx tsx --test src/lib/world/world.test.ts` — included in that run; 13 world tests passed.
- `npm run typecheck` — passed.
- `npx eslint` on the edited world, arcade, and overlay files with `--quiet` — passed.
- `npm run build` — not re-run locally. The previous commits on this branch built in GitHub Actions. This commit will run the workflow again.

GitHub Actions on the previous commits of this branch were green (`Neon Block / qualify`, `training lab R1 / practice-contract`). This polish commit needs that workflow again. Do not treat a local typecheck as a substitute for that run until it finishes.

## Browser evidence this pass

New game through Kit, Velvet purchase and equip, both arcade cabinets (including Pulse cooldown), the full Midnight Signal through the chapter card, Training Lab 8/8 with a local JSON export, casino floor at 2,500 and return without losing street tokens, reload Continue, and three viewport sizes with no horizontal overflow. Details are in `docs/NEON-BLOCK-QA.md`.
