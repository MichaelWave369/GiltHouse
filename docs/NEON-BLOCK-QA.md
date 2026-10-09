# Neon Block QA

Honest split: a check is **verified** only if this pass actually ran it. Unit tests are not browser play.

## Automated

| Check | Result |
| --- | --- |
| `npm test` | Passed. Includes `src/lib/world/world.test.ts` and the Training Lab tests. |
| `npm run typecheck` | Passed. |
| `npx eslint . --quiet` | Passed. |
| `npm run build` | Passed. Migrate skipped with no `DATABASE_URL`. |
| Door vs person selection | Unit-tested, and clicked in the browser at the diner (Wick on the threshold, both prompts, diner opened). |
| Every street door and its exit | Unit-tested. Not each one clicked in the browser. |
| Midnight Signal full chain | Unit-tested through Kit, three signs, Ruby, the radio, Switch, Luckless, and Ivo, including the chapter flag and pin. **Not clicked end to end in the browser.** |
| Arcade payout, cooldown, forged score | Unit-tested. **Cabinets were not opened in the browser this pass.** |
| Save migration, corrupt JSON, chip key untouched | Unit-tested. |
| Agent malformed actions | Unit-tested. |
| Casino views still mounted | Unit-tested by reading the floor and app source. |

## Browser, this pass, dev server

| Journey | Result |
| --- | --- |
| A. New player | Title showed "The night is young." New Game, creator, Walk in, Kit's job. Tokens went from 24 to 39. Objective became Three Stutters. |
| B. Diner | Walked onto the door. E offered Wick. W offered Midnight Diner. Entered. Bought Counter Coffee for 8 tokens (39 → 31). Used it. Energy went to 100. |
| C. Velvet Vintage | **Not clicked this pass.** Purchase and equip are unit-tested. |
| D. Casino | The Floor opened the chip floor at 2,500. Back returned to Midnight Diner, still at 31 tokens, still in range of Dottie. |
| E. Full story | **Not played in the browser.** Covered by the unit chain above. |
| F. Arcade | **Not opened in the browser.** Start screens exist in the components. Payout rules are unit-tested. |
| G. Training Lab | Opened from the menu. The lab copy says eight challenges, nothing uploaded, no chips. **The eight questions were not answered this pass.** |
| H. Persistence | Reload showed the title. Continue restored Midnight Diner, 31 tokens, energy 100, Dottie in range. |
| I. Mobile 390×844 | No horizontal overflow. Left and Act were on screen. Landscape, tablet, and 1920×1080 were **not** checked. |
| J. Recovery | Unit-tested. A browser attempt to plant `{` was overwritten by the tab-hide save before the next boot, so that browser attempt is **not** evidence. |
| Audio | **Not listened to.** Buses are in code. Do not call playback verified. |
| Focus loss / stuck keys | Blur, hidden tab, and pointer cancel clear held keys in code. **Not device-tested.** |

Console during the browser pass: Vite connect logs and the React DevTools note. No uncaught page errors.

## Known limits

- Sprites are a clearer 4-frame procedural walk, not a drawn sprite sheet.
- Interiors are still painted rooms with different props, not unique illustrated backgrounds.
- The east gate is still a closed edge.
- Remote agents stay off.
- Generated `.vercel/output` is build product. This pass stops tracking it. Deploy still runs `npm run build`.
