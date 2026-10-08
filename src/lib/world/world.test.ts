import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { doorX, ENCOUNTERS, HOTSPOTS } from "./content.ts";
import { reviewAgentAction } from "./agent.ts";
import {
  auditContent,
  equipItem,
  grantArcade,
  interact,
  maybeEncounter,
  movePlayer,
  pickChoice,
  purchase,
  useItem,
} from "./logic.ts";
import { CHIP_SAVE_KEY, WORLD_SAVE_KEY, defaultWorld, loadWorld, parseSave, saveWorld, type KeyValueStore } from "./save.ts";

test("content identifiers, shops, doors, and dialogue all resolve", () => {
  assert.deepEqual(auditContent(), []);
});

test("side-scroll A moves left and collision stops a body", () => {
  const start = defaultWorld();
  const left = movePlayer(start, -1, 0.5);
  assert.ok(left.x < start.x);
  assert.equal(left.facing, -1);
  const right = movePlayer(start, 1, 0.5);
  assert.ok(right.x > start.x);
  assert.equal(right.facing, 1);
  const blocked = movePlayer({ ...start, scene: "diner", x: 200, y: 150 }, 1, 5);
  assert.ok(blocked.x < 248);
  assert.equal(blocked.x, 241);
});

test("diner door enters and the exit returns to that sidewalk", () => {
  const atDoor = { ...defaultWorld(), x: doorX("diner") };
  const entered = interact(atDoor);
  assert.equal(entered.action.type, "toast");
  assert.equal(entered.state.scene, "diner");
  assert.equal(entered.state.flags["been:diner"], true);
  const left = interact({ ...entered.state, x: 28 });
  assert.equal(left.state.scene, "neon-block");
  assert.equal(left.state.x, doorX("diner"));
});

test("street purchases never touch a chip balance", () => {
  const rich = { ...defaultWorld(), scene: "diner" as const, tokens: 24 };
  const bought = purchase(rich, "coffee");
  assert.equal(bought.ok, true);
  assert.equal(bought.state.tokens, 16);
  assert.equal(bought.state.inventory.coffee, 1);
  assert.equal("bank" in bought.state, false);
  const broke = purchase({ ...rich, tokens: 3 }, "coffee");
  assert.equal(broke.ok, false);
  assert.equal(broke.state.tokens, 3);
  const wrongShop = purchase({ ...defaultWorld(), scene: "velvet", tokens: 50 }, "coffee");
  assert.equal(wrongShop.ok, false);
  assert.equal(wrongShop.state.tokens, 50);
  const jacket = purchase({ ...defaultWorld(), scene: "velvet", tokens: 80 }, "leather-jacket");
  assert.equal(jacket.ok, true);
  const duplicate = purchase(jacket.state, "leather-jacket");
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.state.tokens, jacket.state.tokens);
  const used = useItem(bought.state, "coffee");
  assert.equal(used.ok, true);
  assert.ok(used.state.energy > bought.state.energy);
  assert.equal(used.state.inventory.coffee ?? 0, 0);
  const worn = equipItem(jacket.state, "leather-jacket");
  assert.equal(worn.ok, true);
  assert.equal(worn.state.appearance.jacket, "leather");
  assert.ok(worn.state.style > jacket.state.style);
});

test("arrival, marquees, and arcade rewards progress without chips", () => {
  const greeted = pickChoice(defaultWorld(), "npc", "kit", "root", "job");
  assert.equal(greeted.state.quests["q-welcome"]?.status, "complete");
  assert.equal(greeted.state.quests["q-flicker"]?.status, "active");
  assert.equal(greeted.state.tokens, 39);
  let state = greeted.state;
  for (const id of ["sign:diner", "sign:gilt", "sign:mirage"]) {
    const spot = HOTSPOTS.find((hot) => hot.id === id);
    assert.ok(spot);
    const result = interact({ ...state, scene: "neon-block", x: spot!.x });
    state = result.state;
  }
  assert.equal(state.quests["q-flicker"]?.status, "complete");
  assert.equal(state.quests["q-frequency"]?.status, "active");
  const paid = grantArcade({ ...state, worldTime: 100 }, "pulse", 8, 8);
  assert.match(paid.message, /street tokens/i);
  assert.equal(paid.state.tokens, state.tokens + 10);
  const cooled = grantArcade(paid.state, "pulse", 8, 8);
  assert.match(cooled.message, /minute/);
  assert.equal(cooled.state.tokens, paid.state.tokens);
});

test("encounters respect cooldown and one-time flags", () => {
  const ready = { ...defaultWorld(), worldTime: 40, encounterCooldown: 0 };
  const fired = maybeEncounter(ready, () => 0);
  assert.ok(fired.encounterId);
  assert.ok(fired.state.encounterCooldown > 20);
  const blocked = maybeEncounter(fired.state, () => 0);
  assert.equal(blocked.encounterId, null);
  const seenAll = {
    ...ready,
    seenEncounters: ENCOUNTERS.map((encounter) => encounter.id),
    flags: { "ruby:heard": true },
  };
  const none = maybeEncounter(seenAll, () => 0);
  assert.equal(none.encounterId, null);
});

test("world saves migrate, reject corruption, and never write the chip key", async () => {
  const mem = new Map<string, string>();
  const storage: KeyValueStore = {
    getItem: (key) => mem.get(key) ?? null,
    setItem: (key, value) => {
      mem.set(key, value);
    },
    removeItem: (key) => {
      mem.delete(key);
    },
  };
  saveWorld(storage, defaultWorld());
  assert.equal(mem.has(CHIP_SAVE_KEY), false);
  assert.equal(mem.has("gilt-house-v1"), false);
  const storeSource = await readFile(new URL("../casino/store.ts", import.meta.url), "utf8");
  assert.match(storeSource, /export const CHIP_STORAGE_KEY = KEY/);
  assert.match(storeSource, /const KEY = "gilt-house-v1"/);
  assert.equal(CHIP_SAVE_KEY, "gilt-house-v1");
  assert.notEqual(WORLD_SAVE_KEY, "gilt-house-v1");
  const migrated = parseSave(JSON.stringify({ version: 0, tokens: 40, appearance: { hair: "bun" } }));
  assert.equal(migrated.state.version, 1);
  assert.equal(migrated.state.tokens, 40);
  assert.equal(migrated.state.appearance.hair, "bun");
  assert.equal(migrated.state.appearance.shoes, "kicks");
  assert.equal(migrated.state.appearance.pin, false);
  const broken = parseSave("{");
  assert.equal(broken.recovered, true);
  assert.equal(broken.state.tokens, 24);
  assert.equal(broken.state.scene, "neon-block");
  const messy = parseSave(JSON.stringify({ version: 1, tokens: 11, inventory: { coffee: 2, nope: 4, burger: -1, "leather-jacket": 1 } }));
  assert.equal(messy.state.inventory.coffee, 2);
  assert.equal(messy.state.inventory["leather-jacket"], 1);
  assert.equal("nope" in messy.state.inventory, false);
  assert.equal("burger" in messy.state.inventory, false);
  assert.equal(messy.state.tokens, 11);
  const loaded = loadWorld(storage);
  assert.equal(loaded.state.scene, "neon-block");
});

test("remote agents cannot act and local scripts cannot wager", () => {
  const remote = reviewAgentAction({ type: "talk" }, "remote");
  assert.equal(remote.allowed, false);
  const wager = reviewAgentAction({ type: "wager" }, "local-script");
  assert.equal(wager.allowed, false);
  const local = reviewAgentAction({ type: "move" }, "local-script");
  assert.equal(local.allowed, true);
});

test("existing casino routes remain mounted in the floor and the app", async () => {
  const app = await readFile(new URL("../../components/casino/app.tsx", import.meta.url), "utf8");
  const floor = await readFile(new URL("../../components/casino/floor.tsx", import.meta.url), "utf8");
  for (const view of ["blackjack", "roulette", "craps", "baccarat", "poker", "slots", "keno", "sports", "workshop", "training", "agents"]) {
    assert.match(app, new RegExp(view));
    assert.match(floor, new RegExp(view === "sports" ? "sports" : view));
  }
  const boundary = await readFile(new URL("../../../public/bridge/gilt-house.venue.v0.json", import.meta.url), "utf8");
  assert.match(boundary, /INDEPENDENT_PRODUCT/);
  assert.doesNotMatch(boundary, /city369/i);
});
