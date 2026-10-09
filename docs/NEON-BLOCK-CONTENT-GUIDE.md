# Neon Block content guide

Add places and people in `src/lib/world/content.ts`. Keep rules in `src/lib/world/logic.ts` unless the new verb truly needs new behavior. Run `auditContent()` — `src/lib/world/world.test.ts` already fails the build if ids, doors, shop items, or dialogue links drift.

## A new shop on the existing street

1. Add a `Theme` name if the interior should look different, and teach `drawInterior` in `draw.ts` one or two landmark rects. Reusing a theme is fine.
2. Add a `FACADES` row: `x`, `w`, `door` (center, relative), `name`, `neon`, `label`. Keep it inside `WORLD_W` (4440) or extend `WORLD_W` and the east gate together.
3. Add the scene id to `SCENES` in `types.ts` and a `LOCATIONS` entry with `width: 320` (or wider), `shop: ["item-id"]`, and `keeper`.
4. Map the facade id in `ENTER`. Street doors and sidewalk exits are generated from that map. Do not hand-copy portal coordinates.
5. Add the keeper to `NPCS` with `scene` set to the interior and `x` around 214 so the counter solid at x 248 still lets the player reach them.
6. Add items to `ITEMS`. `price` is street tokens. `unique: true` blocks a second buy. `kind: "food"` is consumed. `equip` updates appearance. `jukebox` is a track id the pause-bag can play. `use.flag` makes a book grant knowledge once.
7. Put the item id on that location's `shop` array only. A price of 0 is for quest items that are not sold.

Stand at least 70px away from a door if you add a sidewalk NPC. Talk radius is 36 and door radius is 30; closer than that and the person eats the door.

## Dialogue

Each NPC has `root` and `nodes`. A choice `next` must be a node on the **same** character. Omit `next` to close the conversation.

Useful gates:

- `quest` / `questStep` — only while that quest is active at that step
- `requireFlag` / `absentFlag`
- `hasItem`
- `minStyle`, `minCharm`, `minKnowledge`
- `shop: true` opens the room's price list
- `casino: "floor" | "training" | "workshop" | "sports" | "agents"` opens the existing casino view

Effects are data (`tokens`, `energy`, `charm`, `knowledge`, `rep`, `flag`, `item`, `take`, `quest`, `jukebox`). They must not grant chips.

People already react to the walk: Dottie offers "The usual" after `tasted:coffee`. Sable's "Did the sidewalk notice?" requires `minStyle` 2 (a jacket is enough). Harvey mentions Alley Brass only if it is in the bag. Ivo's warm-pin line requires `signal:known`. Wick Candle stands on the Midnight Diner door on purpose. Do not delete that overlap. E talks to Wick. W still enters.

## Quests

Add a `QUESTS` entry (title, step strings, done line) and set it active with a quest effect. If the objective marker needs a specific spot, extend `currentObjective` in `logic.ts`. Journal rows appear automatically once the quest exists on the save.

## Encounters

Add to `ENCOUNTERS`. `once` plus `seenEncounters` keeps it from looping. `requireFlag` waits for story. The roller only runs on the sidewalk, after a short cooldown, and only while the player is walking with no panel open. Do not fire anything that spends chips.

## Hotspots

`kind: "sign"` participates in the three-marquee count if its id is in `SIGN_IDS`. `kind: "radio"` advances the cellar beat. `kind: "arcade"` needs `game: "pulse" | "memory"`. `kind: "inspect"` shows `line`.

## Art

The frame is 320×180 logical pixels, drawn with `fillRect` and scaled by an integer in the canvas bitmap. Do not scale sprites with CSS. New costumes belong in `drawPerson` as another `appearance` branch, not a new rendering stack.

## Saves

Wick Candle stands on the Midnight Diner threshold on purpose. E talks to Wick. W enters. Do not "fix" that by deleting the door prompt.

Bump `WORLD_VERSION` only when old journals would crash. Add a migration arm in `parseSave` (v0 → v1 is the pattern) and keep unknown items, negative stacks, and bad scenes from loading. Never write `gilt-house-v1` from world code.

## 3D later

Reuse `scene` ids, NPC ids, and portal labels. Send `interact` results as commands. Do not import City369 or the paid explorer. The discovery file `public/bridge/gilt-house.venue.v0.json` still describes a future separate virtual world as proposed; leave that contract alone unless its tests are updated on purpose.
