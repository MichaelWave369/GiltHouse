# Neon Block QA

Checked in this build. Not a claim about a VR headset.

## Automated

- `node --experimental-strip-types --test src/lib/world/world.test.ts src/lib/casino/training-lab.test.ts` — pass (movement sign, collision, diner door round-trip, token shop rules, marquee quest, arcade payout cooldown, encounter cooldown, save migration and corruption, agent denial, casino view strings still present).
- `node --test scripts/gilt-venue-manifest.test.mjs` — pass. Discovery manifest still says the future separate virtual world is proposed, and it still names no paid city app.
- `npx tsc --noEmit` — pass.
- `npm run build` — pass.
- Dev smoke `scripts/browser-smoke.mjs` on port 8080 — desktop and mobile 200, canvas present, no console errors, no horizontal overflow.
- Built smoke on the production preview — same verdict, `divergesFromBaseline: false`.
- `@tanstack/react-start` is 1.168.60.

## Browser journeys

| Journey | Result |
| --- | --- |
| A Arrival | Pass. Creator, intro, sidewalk, talk to Kit Marquee, quest advances to Three Stutters, +15 tokens (24 → 39). |
| B Shopping | Pass. Enter Midnight Diner, talk to Dottie, buy Counter Coffee for 8 tokens (39 → 31), use it from the bag, energy rises to about 100. |
| C Customization | Partial. The creator changes hair, outfit, jacket, palette, and accessory before you walk. Wearing a purchased jacket is covered by unit test, not by a browser click inside Velvet Vintage. |
| D Casino | Pass. The Floor opens the existing Gilt House menu (Shoe, Wheel, Rail, Salon, and the rest) with the 2,500 play-chip display. Training Lab opens and labels itself no-chips. Back to the Neon Block returns to the diner. World tokens stay 31. |
| E Mystery | Partial. The marquee quest is active in the HUD after Kit. Reading all three signs and the later chain are unit-tested. The browser session did not walk Ruby → Switch → Luckless → the night desk. |
| F Arcade | Not clicked in the browser. `grantArcade` pays street tokens once, then cools down, in unit tests. Pulse Line and Marquee Memory render as cabinets in the arcade interior code. |
| G Learning | Pass for the door. Training Lab opens from the casino floor. Ace's coin question and the Pit were not played through in the browser. |
| H Persistence | Pass. Reload restores Midnight Diner, 31 tokens, energy, and the Three Stutters objective. |
| Controls | Pass. Holding D increases x. Holding A decreases x. Probe: `window.__controlsTest`. |
| Mobile | Pass on a 390×844 viewport. No horizontal overflow. Left / Act / Right are on screen. Diner interior remains readable. |

## Not tested

- A physical VR headset. The existing arena still requests WebXR; that is not evidence it runs on a device.
- Every interior (Velvet, cellar, arcade, books, pawn, Comet, Last Call, Starlight, Mirage) by walking there in the browser. They share the door and shop code exercised by the diner.
- Sound output from the sandbox speakers. The music nodes start after a gesture; they were not listened to.
- Saving a chip wager and proving the chip key on disk. The purse still starts at 2,500 in memory and the street save never writes `gilt-house-v1`. The chip key is only written when the existing casino store persists a change, which is previous behavior.
