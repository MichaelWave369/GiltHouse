import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { doorX, ENCOUNTERS, HOTSPOTS, PORTALS } from "./content.ts";
import { reviewAgentAction } from "./agent.ts";
import {
  auditContent,
  equipItem,
  grantArcade,
  interact,
  lookAt,
  maybeEncounter,
  movePlayer,
  pickChoice,
  purchase,
  selectLook,
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

test("diner door stays open even when Wick is standing on it", () => {
  const atDoor = { ...defaultWorld(), x: doorX("diner") };
  const talked = interact(atDoor, "act");
  assert.equal(talked.action.type, "dialogue");
  if (talked.action.type === "dialogue") assert.equal(talked.action.id, "wick");
  assert.equal(talked.state.scene, "neon-block");
  const entered = interact(atDoor, "door");
  assert.equal(entered.state.scene, "diner");
  assert.equal(entered.state.flags["been:diner"], true);
  const left = interact({ ...entered.state, x: 28 }, "door");
  assert.equal(left.state.scene, "neon-block");
  assert.equal(left.state.x, doorX("diner"));
});

test("talk and enter stay distinct when both are in range", () => {
  const talk = { kind: "talk" as const, id: "wick", name: "Wick Candle", label: "Talk to Wick Candle" };
  const door = { kind: "door" as const, id: "door-diner", label: "Enter Midnight Diner" };
  assert.equal(selectLook([talk, door], "act")?.kind, "talk");
  assert.equal(selectLook([talk, door], "door")?.kind, "door");
  assert.equal(selectLook([door], "act")?.kind, "door");
  assert.equal(selectLook([talk], "door"), null);
  const atDoor = { ...defaultWorld(), x: doorX("diner") };
  assert.equal(lookAt(atDoor, "act")?.kind, "talk");
  assert.equal(lookAt(atDoor, "door")?.kind, "door");
});

test("every street door enters its room and the exit returns", () => {
  const streetDoors = PORTALS.filter((portal) => portal.scene === "neon-block" && portal.to);
  assert.ok(streetDoors.length >= 11);
  for (const portal of streetDoors) {
    const entered = interact({ ...defaultWorld(), x: portal.x }, "door");
    assert.equal(entered.state.scene, portal.to, portal.id);
    const back = interact({ ...entered.state, x: 28 }, "door");
    assert.equal(back.state.scene, "neon-block");
    assert.equal(back.state.x, portal.x);
  }
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
  const forged = grantArcade({ ...state, worldTime: 400 }, "pulse", 99, 8);
  assert.equal(forged.state.tokens, state.tokens);
  const again = grantArcade({ ...paid.state, worldTime: paid.state.worldTime + 21 }, "pulse", 8, 8);
  assert.equal(again.state.tokens, paid.state.tokens + 4);
});

test("the midnight signal can be finished without a casino win", () => {
  let state = pickChoice(defaultWorld(), "npc", "kit", "root", "job").state;
  for (const id of ["sign:diner", "sign:gilt", "sign:mirage"]) {
    const spot = HOTSPOTS.find((hot) => hot.id === id);
    assert.ok(spot);
    state = interact({ ...state, scene: "neon-block", x: spot!.x }, "act").state;
  }
  state = pickChoice(state, "npc", "ruby", "root", "heard").state;
  assert.equal(state.flags["ruby:heard"], true);
  const radio = HOTSPOTS.find((hot) => hot.id === "radio");
  assert.ok(radio);
  state = interact({ ...state, scene: "records", x: radio!.x }, "act").state;
  assert.equal(state.quests["q-signal"]?.status, "active");
  state = pickChoice(state, "npc", "switch", "root", "count").state;
  state = pickChoice(state, "npc", "luckless", "root", "signal").state;
  const done = pickChoice(state, "npc", "ivo", "root", "signal");
  assert.equal(done.state.quests["q-signal"]?.status, "complete");
  assert.equal(done.state.flags["chapter:one"], true);
  assert.equal(done.state.inventory["gilt-pin"], 1);
  assert.ok(done.state.tokens > state.tokens);
  assert.equal("bank" in done.state, false);
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
  const chips = new Map<string, string>([[CHIP_SAVE_KEY, "{\"bank\":2500}"]]);
  const failing: KeyValueStore = {
    getItem: (key) => chips.get(key) ?? null,
    setItem: () => {
      throw new Error("storage blocked");
    },
  };
  assert.throws(() => saveWorld(failing, defaultWorld()));
  assert.equal(chips.get(CHIP_SAVE_KEY), "{\"bank\":2500}");
  assert.equal(chips.has(WORLD_SAVE_KEY), false);
});

test("remote agents cannot act and local scripts must be well formed", () => {
  const remote = reviewAgentAction({ type: "talk", npcId: "kit" }, "remote");
  assert.equal(remote.allowed, false);
  const wager = reviewAgentAction({ type: "wager" }, "local-script");
  assert.equal(wager.allowed, false);
  const missingDir = reviewAgentAction({ type: "move" }, "local-script");
  assert.equal(missingDir.allowed, false);
  const badDir = reviewAgentAction({ type: "move", dir: "left" }, "local-script");
  assert.equal(badDir.allowed, false);
  const local = reviewAgentAction({ type: "move", dir: -1 }, "local-script");
  assert.equal(local.allowed, true);
  if (local.allowed && local.action.type === "move") assert.equal(local.action.dir, -1);
  const ghost = reviewAgentAction({ type: "talk", npcId: "not-a-person" }, "local-script");
  assert.equal(ghost.allowed, false);
  const talk = reviewAgentAction({ type: "talk", npcId: "kit" }, "local-script");
  assert.equal(talk.allowed, true);
  const emote = reviewAgentAction({ type: "emote", npcId: "kit", emote: "wave" }, "local-script");
  assert.equal(emote.allowed, true);
  const weird = reviewAgentAction({ type: "emote", npcId: "kit", emote: "hack" }, "local-script");
  assert.equal(weird.allowed, false);
  const privileged = reviewAgentAction({ type: "move", dir: 1, wager: true }, "local-script");
  assert.equal(privileged.allowed, false);
  const outsider = reviewAgentAction({ type: "move", dir: 1 }, "phibot");
  assert.equal(outsider.allowed, false);
});

test("side errands finish: griddle, lou, locket, and the lost photograph", () => {
  let state = pickChoice(defaultWorld(), "npc", "kit", "root", "job").state;
  state = pickChoice({ ...state, scene: "diner" }, "npc", "dottie", "root", "errand").state;
  assert.equal(state.quests["q-griddle"]?.status, "active");
  assert.equal(state.tokens, 49);
  const bought = purchase({ ...state, scene: "records" }, "griddle-jazz");
  assert.equal(bought.ok, true);
  state = bought.state;
  const back = pickChoice({ ...state, scene: "diner" }, "npc", "dottie", "root", "deliver");
  assert.equal(back.state.quests["q-griddle"]?.status, "complete");
  assert.equal(back.state.inventory["griddle-jazz"] ?? 0, 0);
  assert.equal(back.state.inventory["giant-platter"], 1);
  assert.ok(back.state.tokens > state.tokens);

  const lou = pickChoice(pickChoice(defaultWorld(), "npc", "lou", "root", "hear").state, "npc", "lou", "pitch", "reject");
  assert.equal(lou.state.quests["q-lou"]?.status, "complete");
  assert.equal(lou.state.flags["lou:done"], true);
  assert.equal(lou.state.knowledge, 2);
  assert.equal("bank" in lou.state, false);

  const held = pickChoice({ ...defaultWorld(), scene: "pawn" }, "npc", "cleo", "root", "locket").state;
  assert.equal(held.inventory.locket, 1);
  const returned = pickChoice({ ...held, scene: "mirage" }, "npc", "ivo", "root", "locket");
  assert.equal(returned.state.quests["q-locket"]?.status, "complete");
  assert.equal(returned.state.inventory.locket ?? 0, 0);

  const photo = pickChoice(defaultWorld(), "encounter", "photo", "root", "keep").state;
  assert.equal(photo.quests["q-photo"]?.status, "active");
  const filed = pickChoice({ ...photo, scene: "mirage" }, "npc", "ivo", "root", "photo");
  assert.equal(filed.state.quests["q-photo"]?.status, "complete");
  assert.equal(filed.state.inventory.photo ?? 0, 0);
  assert.equal(filed.state.tokens, photo.tokens + 8);

  const dressed = equipItem(
    purchase({ ...defaultWorld(), scene: "velvet", tokens: 80 }, "leather-jacket").state,
    "leather-jacket",
  );
  assert.ok(dressed.state.style >= 2);
  const noticed = pickChoice(dressed.state, "npc", "sable", "root", "noticed");
  assert.equal(noticed.missing, undefined);
  assert.match(noticed.text, /jacket/i);
  const plain = pickChoice(defaultWorld(), "npc", "sable", "root", "noticed");
  assert.equal(plain.missing, true);
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
