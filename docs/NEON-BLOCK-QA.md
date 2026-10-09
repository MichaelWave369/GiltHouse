# Neon Block QA

Honest split: a check is **verified** only if this pass actually ran it. Unit tests are not browser play.

## Automated

| Check | Result |
| --- | --- |
| `npm test` | Passed this polish pass. Includes the world suite (13) and the rest of the typed tests (72 total in that file group) plus the script tests in the same `npm test` run. Exit 0. |
| `npm run typecheck` | Passed after the art and dialogue edits. |
| `npx eslint` on the edited world and arcade files, `--quiet` | Passed. |
| `npm run build` | Not re-run locally this polish pass. The previous commits on this branch built green in GitHub Actions. |
| Door vs person | Unit-tested, and used in the browser at the diner (Wick on the threshold, E talks, the door still exists). |

## Browser, this pass, dev server

| Journey | Result |
| --- | --- |
| A. New player | Title, New Game, creator (spike, leather, oxblood, shades), step onto the block, intro, Kit's job. Tokens 24 → 39. Objective became Three Stutters. |
| B. Diner | Prior pass bought and used coffee. This pass read the diner marquee (quest 1/3) and talked to Wick without losing the door. |
| C. Velvet | Entered. Sable noticed the jacket. Bought Night Shades (39 → 25) and Two-Tone Shoes (25 → 5). Owned buttons disabled a second buy. Wore both. Save showed shades, leather, two-tone. |
| D. Casino | After the chapter, The Floor opened at 2,500 chips. Back to the Neon Block returned to the Grand Mirage at 57 street tokens. |
| E. Story | Clicked the whole first chapter: three marquees, Ruby, cellar radio, Switch, Professor Luckless, Ivo. Chapter card "Still open". Tokens ended at 57. Pin in the bag. Quest `q-signal` complete. |
| F. Arcade | Pulse Line paid 10 street tokens. An immediate replay said the cabinet needed a minute and did not pay again (19 stayed 19). Marquee Memory then paid 10 (19 → 29). |
| G. Training Lab | All 8 questions on seed 369, score 8/8. Exported `gilt-house-training-369` JSON: schema `gilt-house.training-observation.v1`, evidence `UNVERIFIED_CLIENT_PRACTICE`. Chips stayed 2,500. |
| H. Persistence | Reload showed Continue. Continue restored the Grand Mirage, 57 tokens, jacket, shades, shoes, pin, and completed signal. Intro came back once because Close had not set the seen flag; that close path now does. |
| I. Viewports | 390×844, 844×390, and 1920×1080: no horizontal overflow. Mobile showed Left/Right/Act/Door. Landscape showed the same. A separate tablet size was not checked. |
| J. Recovery | Still unit-tested only. A live corrupt-save reload was not repeated. |
| Audio | **Not listened to.** |

Console during the browser pass: Vite connect logs and the React DevTools note. No uncaught page errors.

## Known limits

- Art is original procedural pixel work, not a drawn sprite sheet and not a second engine.
- The east gate is still a closed edge.
- Remote agents stay off.
- Generated `.vercel/output` is build product and is not tracked.
