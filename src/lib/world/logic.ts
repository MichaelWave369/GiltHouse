import {
  ENCOUNTERS,
  HOTSPOTS,
  ITEMS,
  LOCATIONS,
  NPCS,
  PLAYER_HALF,
  PORTALS,
  QUESTS,
  SIGN_IDS,
  TALK_R,
  HOT_R,
  DOOR_R,
  actorById,
  encounterById,
  sceneY,
} from "./content.ts";
import type {
  Appearance,
  ChoiceDef,
  Effect,
  QuestProgress,
  SceneId,
  TalkKind,
  WorldState,
} from "./types.ts";

export type Look =
  | { kind: "talk"; id: string; name: string; label: string }
  | { kind: "hot"; id: string; label: string }
  | { kind: "door"; id: string; label: string };

export type InteractAction =
  | { type: "none" }
  | { type: "dialogue"; kind: TalkKind; id: string; nodeId: string }
  | { type: "toast"; text: string }
  | { type: "shop" }
  | { type: "arcade"; game: "pulse" | "memory" }
  | { type: "casino"; view: "floor" | "training" | "workshop" | "sports" | "agents" };

export type InteractResult = {
  state: WorldState;
  action: InteractAction;
};

const FACTIONS = ["block", "diner", "gilt", "arcade", "night"] as const;

export function styleScore(appearance: Appearance): number {
  let score = 1;
  if (appearance.jacket === "leather" || appearance.jacket === "teal") score += 2;
  if (appearance.jacket === "champagne") score += 3;
  if (appearance.outfit !== "tee") score += 1;
  if (appearance.accessory !== "none") score += 1;
  if (appearance.shoes === "two-tone") score += 1;
  if (appearance.pin) score += 1;
  return score;
}

export function withStyle(state: WorldState): WorldState {
  return { ...state, style: styleScore(state.appearance) };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function applyEffect(state: WorldState, effect: Effect): WorldState {
  if (effect.op === "tokens") return { ...state, tokens: Math.max(0, Math.round(state.tokens + effect.n)) };
  if (effect.op === "energy") return { ...state, energy: clamp(state.energy + effect.n, 0, 100) };
  if (effect.op === "charm") return { ...state, charm: clamp(state.charm + effect.n, 0, 12) };
  if (effect.op === "knowledge") return { ...state, knowledge: clamp(state.knowledge + effect.n, 0, 12) };
  if (effect.op === "rep") {
    const reputation = { ...state.reputation };
    reputation[effect.faction] = Math.max(0, (reputation[effect.faction] ?? 0) + effect.n);
    return { ...state, reputation };
  }
  if (effect.op === "flag") return { ...state, flags: { ...state.flags, [effect.key]: effect.value } };
  if (effect.op === "jukebox") return { ...state, jukebox: effect.track };
  if (effect.op === "quest") {
    const quests = { ...state.quests, [effect.id]: { status: effect.status, step: effect.step } satisfies QuestProgress };
    return { ...state, quests };
  }
  if (effect.op === "item") {
    if (!ITEMS[effect.id] || effect.n <= 0) return state;
    const have = state.inventory[effect.id] ?? 0;
    if (ITEMS[effect.id]?.unique && have > 0) return state;
    return { ...state, inventory: { ...state.inventory, [effect.id]: have + effect.n } };
  }
  if (effect.op === "take") {
    const have = state.inventory[effect.id] ?? 0;
    if (have < effect.n) return state;
    const inventory = { ...state.inventory };
    const left = have - effect.n;
    if (left <= 0) delete inventory[effect.id];
    else inventory[effect.id] = left;
    const equipped = state.equipped.filter((id) => id !== effect.id || left > 0);
    return { ...state, inventory, equipped };
  }
  return state;
}

export function applyEffects(state: WorldState, effects: Effect[] | undefined): WorldState {
  let next = state;
  for (const effect of effects ?? []) next = applyEffect(next, effect);
  return withStyle(next);
}

export function npcX(id: string, time: number, base: number, wander = 0): number {
  if (!wander) return base;
  return base + Math.sin(time * 0.45 + base * 0.01) * wander;
}

export function npcWorldX(id: string, time: number): number | null {
  const npc = actorById(id);
  if (!npc) return null;
  return npcX(id, time, npc.x, npc.wander);
}

type Solid = { x: number; w: number };

export function solidsFor(scene: SceneId): Solid[] {
  if (scene === "neon-block" || scene === "gilt-lobby") return [];
  return [{ x: 248, w: 64 }];
}

export function movePlayer(state: WorldState, dir: -1 | 0 | 1, dt: number): WorldState {
  const y = sceneY(state.scene);
  if (dir === 0) return state.y === y ? state : { ...state, y };
  const speed = state.energy < 18 ? 54 : 86;
  const bounds = LOCATIONS[state.scene];
  let x = state.x + dir * speed * dt;
  x = clamp(x, 18, bounds.width - 18);
  for (const solid of solidsFor(state.scene)) {
    const left = x - PLAYER_HALF;
    const right = x + PLAYER_HALF;
    if (right > solid.x && left < solid.x + solid.w) {
      x = dir > 0 ? solid.x - PLAYER_HALF : solid.x + solid.w + PLAYER_HALF;
    }
  }
  x = clamp(x, 18, bounds.width - 18);
  return { ...state, x, y, facing: dir < 0 ? -1 : 1 };
}

export function tick(state: WorldState, dt: number, walking: boolean): WorldState {
  const drain = walking ? dt * 0.32 : 0;
  const idle = walking ? 0 : dt * 0.04;
  return {
    ...state,
    worldTime: state.worldTime + dt,
    energy: clamp(state.energy - drain + idle, 0, 100),
    encounterCooldown: Math.max(0, state.encounterCooldown - dt),
  };
}

function distance(a: number, b: number): number {
  return Math.abs(a - b);
}

export function lookAt(state: WorldState): Look | null {
  let bestNpc: { id: string; name: string; d: number } | null = null;
  for (const npc of NPCS) {
    if (npc.scene !== state.scene) continue;
    const x = npcX(npc.id, state.worldTime, npc.x, npc.wander);
    const d = distance(x, state.x);
    if (d <= TALK_R && (!bestNpc || d < bestNpc.d)) bestNpc = { id: npc.id, name: npc.name, d };
  }
  if (bestNpc) return { kind: "talk", id: bestNpc.id, name: bestNpc.name, label: `Talk to ${bestNpc.name}` };

  let bestHot: { id: string; label: string; d: number } | null = null;
  for (const hot of HOTSPOTS) {
    if (hot.scene !== state.scene) continue;
    const d = distance(hot.x, state.x);
    if (d <= HOT_R && (!bestHot || d < bestHot.d)) bestHot = { id: hot.id, label: hot.label, d };
  }
  if (bestHot) {
    const hot = HOTSPOTS.find((row) => row.id === bestHot?.id);
    const verb = hot?.kind === "arcade" ? "Play" : hot?.kind === "sign" ? "Read" : "Look at";
    return { kind: "hot", id: bestHot.id, label: `${verb} ${bestHot.label}` };
  }

  let bestDoor: { id: string; label: string; d: number } | null = null;
  for (const portal of PORTALS) {
    if (portal.scene !== state.scene) continue;
    const d = distance(portal.x, state.x);
    if (d <= DOOR_R && (!bestDoor || d < bestDoor.d)) bestDoor = { id: portal.id, label: portal.label, d };
  }
  if (bestDoor) {
    const entering = bestDoor.label.startsWith("To the");
    return { kind: "door", id: bestDoor.id, label: entering ? bestDoor.label : `Enter ${bestDoor.label}` };
  }
  return null;
}

function enterScene(state: WorldState, scene: SceneId, x: number): WorldState {
  return {
    ...state,
    scene,
    x,
    y: sceneY(scene),
    facing: 1,
    flags: { ...state.flags, [`been:${scene}`]: true },
  };
}

function readSign(state: WorldState, id: string): InteractResult {
  if (state.flags[id]) {
    return { state, action: { type: "toast", text: "You already counted this marquee. It still will not sit still." } };
  }
  let next = applyEffects(state, [{ op: "flag", key: id, value: true }]);
  const count = SIGN_IDS.filter((sign) => next.flags[sign]).length;
  let text = `The bulbs stutter — a short run, a longer one, a longer one still. ${count} of 3.`;
  if (next.quests["q-flicker"]?.status === "active" && count >= 3) {
    next = applyEffects(next, [
      { op: "quest", id: "q-flicker", status: "complete", step: 1 },
      { op: "quest", id: "q-frequency", status: "active", step: 0 },
      { op: "tokens", n: 8 },
      { op: "rep", faction: "block", n: 1 },
    ]);
    text = "Three signs, same stutter: three, then six, then nine. Ruby's radio cart is down by the cellar.";
  }
  return { state: next, action: { type: "toast", text } };
}

function readRadio(state: WorldState): InteractResult {
  if (state.quests["q-frequency"]?.status === "active") {
    const next = applyEffects(state, [
      { op: "quest", id: "q-frequency", status: "complete", step: 2 },
      { op: "quest", id: "q-signal", status: "active", step: 0 },
      { op: "flag", key: "radio:heard", value: true },
      { op: "rep", faction: "block", n: 1 },
    ]);
    return {
      state: next,
      action: {
        type: "toast",
        text: "Under the static the radio counts: three, six, nine. Harvey pretends not to hear it. Switch will.",
      },
    };
  }
  if (state.flags["radio:heard"]) {
    return { state, action: { type: "toast", text: "Still that same low count. The mystery has a maintenance manual somewhere." } };
  }
  return {
    state,
    action: { type: "toast", text: "A radio that should be off is softly counting. Come back when you are listening for it." },
  };
}

export function interact(state: WorldState): InteractResult {
  const look = lookAt(state);
  if (!look) return { state, action: { type: "none" } };
  if (look.kind === "talk") {
    const npc = actorById(look.id);
    if (!npc) return { state, action: { type: "none" } };
    return { state, action: { type: "dialogue", kind: "npc", id: npc.id, nodeId: npc.root } };
  }
  if (look.kind === "hot") {
    const hot = HOTSPOTS.find((row) => row.id === look.id);
    if (!hot) return { state, action: { type: "none" } };
    if (hot.kind === "sign") return readSign(state, hot.id);
    if (hot.kind === "radio") return readRadio(state);
    if (hot.kind === "arcade" && hot.game) return { state, action: { type: "arcade", game: hot.game } };
    return { state, action: { type: "toast", text: hot.line ?? "Nothing new." } };
  }
  const portal = PORTALS.find((row) => row.id === look.id);
  if (!portal) return { state, action: { type: "none" } };
  if (portal.casino) return { state, action: { type: "casino", view: portal.casino } };
  if (portal.to != null && portal.spawnX != null) {
    return { state: enterScene(state, portal.to, portal.spawnX), action: { type: "toast", text: portal.label } };
  }
  return { state, action: { type: "none" } };
}

export function dialogueNodes(kind: TalkKind, id: string): Record<string, { text: string; choices: ChoiceDef[] }> | null {
  if (kind === "npc") return actorById(id)?.nodes ?? null;
  return encounterById(id)?.nodes ?? null;
}

export function speakerName(kind: TalkKind, id: string): string {
  if (kind === "npc") return actorById(id)?.name ?? "Someone";
  return encounterById(id)?.name ?? "Someone";
}

export function speakerTitle(kind: TalkKind, id: string): string {
  if (kind === "npc") return actorById(id)?.title ?? "";
  return encounterById(id)?.title ?? "";
}

export function choiceVisible(state: WorldState, choice: ChoiceDef): boolean {
  if (choice.requireFlag && !state.flags[choice.requireFlag]) return false;
  if (choice.absentFlag && state.flags[choice.absentFlag]) return false;
  if (choice.minKnowledge != null && state.knowledge < choice.minKnowledge) return false;
  if (choice.minCharm != null && state.charm < choice.minCharm) return false;
  if (choice.minStyle != null && state.style < choice.minStyle) return false;
  if (choice.hasItem && (state.inventory[choice.hasItem] ?? 0) < 1) return false;
  if (choice.quest) {
    const quest = state.quests[choice.quest];
    if (!quest || quest.status !== "active") return false;
    if (choice.questStep != null && quest.step !== choice.questStep) return false;
  }
  return true;
}

export function pickChoice(
  state: WorldState,
  kind: TalkKind,
  id: string,
  nodeId: string,
  choiceId: string,
): {
  state: WorldState;
  next: string | null;
  text: string;
  casino?: ChoiceDef["casino"];
  shop?: boolean;
  missing?: boolean;
} {
  const nodes = dialogueNodes(kind, id);
  const node = nodes?.[nodeId];
  const choice = node?.choices.find((row) => row.id === choiceId);
  if (!node || !choice || !choiceVisible(state, choice)) {
    return { state, next: nodeId, text: node?.text ?? "", missing: true };
  }
  const nextState = applyEffects(state, choice.effects);
  return {
    state: nextState,
    next: choice.next ?? null,
    text: choice.next ? (nodes?.[choice.next]?.text ?? node.text) : node.text,
    casino: choice.casino,
    shop: choice.shop,
  };
}

export type ShopResult = { state: WorldState; ok: boolean; reason: string };

export function purchase(state: WorldState, itemId: string): ShopResult {
  const item = ITEMS[itemId];
  if (!item) return { state, ok: false, reason: "That isn't for sale." };
  const location = LOCATIONS[state.scene];
  if (!location.shop.includes(itemId)) return { state, ok: false, reason: "Not in this shop." };
  if (item.unique && (state.inventory[itemId] ?? 0) > 0) return { state, ok: false, reason: "You already own that." };
  if (item.price < 0) return { state, ok: false, reason: "That price is nonsense." };
  if (state.tokens < item.price) return { state, ok: false, reason: "Not enough street tokens." };
  let next = applyEffects(state, [
    { op: "tokens", n: -item.price },
    { op: "item", id: itemId, n: 1 },
  ]);
  if (item.jukebox) next = { ...next, jukebox: item.jukebox };
  return { state: withStyle(next), ok: true, reason: `Bought ${item.name} for ${item.price} tokens.` };
}

export function useItem(state: WorldState, itemId: string): ShopResult {
  const item = ITEMS[itemId];
  if (!item?.use) return { state, ok: false, reason: "That doesn't get used. It gets worn, played, or carried." };
  if ((state.inventory[itemId] ?? 0) < 1) return { state, ok: false, reason: "You don't have that." };
  if (item.use.flag && state.flags[item.use.flag]) return { state, ok: false, reason: "You already got what that had." };
  let next = state;
  if (item.kind === "food") next = applyEffects(next, [{ op: "take", id: itemId, n: 1 }]);
  const effects: Effect[] = [];
  if (item.use.energy) effects.push({ op: "energy", n: item.use.energy });
  if (item.use.charm) effects.push({ op: "charm", n: item.use.charm });
  if (item.use.knowledge) effects.push({ op: "knowledge", n: item.use.knowledge });
  if (item.use.flag) effects.push({ op: "flag", key: item.use.flag, value: true });
  next = applyEffects(next, effects);
  return { state: next, ok: true, reason: item.use.note };
}

export function equipItem(state: WorldState, itemId: string): ShopResult {
  const item = ITEMS[itemId];
  if (!item?.equip) return { state, ok: false, reason: "That cannot be worn." };
  if ((state.inventory[itemId] ?? 0) < 1) return { state, ok: false, reason: "You don't have that." };
  const appearance: Appearance = { ...state.appearance };
  const slot = item.equip.slot;
  if (slot === "pin") appearance.pin = item.equip.value === true;
  else if (slot === "outfit" && (item.equip.value === "tee" || item.equip.value === "suit" || item.equip.value === "dress")) {
    appearance.outfit = item.equip.value;
  } else if (slot === "jacket" && (item.equip.value === "none" || item.equip.value === "leather" || item.equip.value === "champagne" || item.equip.value === "teal")) {
    appearance.jacket = item.equip.value;
  } else if (slot === "accessory" && (item.equip.value === "none" || item.equip.value === "shades" || item.equip.value === "hat" || item.equip.value === "earring")) {
    appearance.accessory = item.equip.value;
  } else if (slot === "shoes" && (item.equip.value === "kicks" || item.equip.value === "two-tone")) {
    appearance.shoes = item.equip.value;
  } else {
    return { state, ok: false, reason: "That piece doesn't fit the look." };
  }
  const equipped = state.equipped.filter((id) => ITEMS[id]?.equip?.slot !== slot);
  equipped.push(itemId);
  return {
    state: withStyle({ ...state, appearance, equipped }),
    ok: true,
    reason: `Wearing ${item.name}.`,
  };
}

export function playRecord(state: WorldState, itemId: string): ShopResult {
  const item = ITEMS[itemId];
  if (!item?.jukebox) return { state, ok: false, reason: "That isn't a record." };
  if ((state.inventory[itemId] ?? 0) < 1 && state.jukebox !== item.jukebox) {
    return { state, ok: false, reason: "You don't have that record." };
  }
  return { state: { ...state, jukebox: item.jukebox }, ok: true, reason: `The block hums along with ${item.name}.` };
}

export function grantArcade(
  state: WorldState,
  game: "pulse" | "memory",
  score: number,
  total: number,
): { state: WorldState; message: string } {
  const success = score >= Math.ceil(total * 0.6);
  const at = `arcade:${game}:at`;
  const clears = `arcade:${game}:clears`;
  const last = typeof state.flags[at] === "number" ? state.flags[at] : -999;
  if (state.worldTime - last < 20) {
    return { state, message: "The cabinet needs a minute to cool down." };
  }
  if (!success) {
    return {
      state: applyEffects(state, [{ op: "flag", key: at, value: state.worldTime }]),
      message: "Close. The lights remember the attempt, not a payout.",
    };
  }
  const prev = typeof state.flags[clears] === "number" ? state.flags[clears] : 0;
  const payout = prev === 0 ? 10 : 4;
  return {
    state: applyEffects(state, [
      { op: "tokens", n: payout },
      { op: "rep", faction: "arcade", n: 1 },
      { op: "flag", key: at, value: state.worldTime },
      { op: "flag", key: clears, value: prev + 1 },
    ]),
    message: `The cabinet pays ${payout} street tokens. Not chips. Not cash.`,
  };
}

export function maybeEncounter(state: WorldState, rng: () => number): { state: WorldState; encounterId: string | null } {
  if (state.scene !== "neon-block") return { state, encounterId: null };
  if (state.encounterCooldown > 0) return { state, encounterId: null };
  if (state.worldTime < 16) return { state, encounterId: null };
  const pool = ENCOUNTERS.filter((encounter) => {
    if (encounter.once && state.seenEncounters.includes(encounter.id)) return false;
    if (encounter.requireFlag && !state.flags[encounter.requireFlag]) return false;
    if (encounter.absentFlag && state.flags[encounter.absentFlag]) return false;
    return true;
  });
  if (pool.length === 0) return { state, encounterId: null };
  if (rng() > 0.55) return { state: { ...state, encounterCooldown: 16 }, encounterId: null };
  const total = pool.reduce((sum, encounter) => sum + encounter.weight, 0);
  let roll = rng() * total;
  let pick = pool[0]!;
  for (const encounter of pool) {
    roll -= encounter.weight;
    if (roll <= 0) {
      pick = encounter;
      break;
    }
  }
  const seen = pick.once ? [...state.seenEncounters, pick.id] : state.seenEncounters;
  return {
    state: { ...state, seenEncounters: seen, encounterCooldown: 72 },
    encounterId: pick.id,
  };
}

export type Objective = { title: string; detail: string; scene: SceneId; x: number };

export function currentObjective(state: WorldState): Objective | null {
  const quests = state.quests;
  if (quests["q-welcome"]?.status === "active") {
    return { title: "Arrival", detail: "Speak to Kit Marquee under the west gate.", scene: "neon-block", x: 150 };
  }
  if (quests["q-flicker"]?.status === "active") {
    const next = !state.flags["sign:diner"]
      ? (HOTSPOTS.find((hot) => hot.id === "sign:diner")?.x ?? 300)
      : !state.flags["sign:gilt"]
        ? (HOTSPOTS.find((hot) => hot.id === "sign:gilt")?.x ?? 1100)
        : (HOTSPOTS.find((hot) => hot.id === "sign:mirage")?.x ?? 3900);
    const count = SIGN_IDS.filter((id) => state.flags[id]).length;
    return { title: "Three Stutters", detail: `Read the stuttering marquees (${count}/3).`, scene: "neon-block", x: next };
  }
  if (quests["q-frequency"]?.status === "active") {
    if (!state.flags["ruby:heard"]) {
      return { title: "Low Band", detail: "Find Ruby Static by the Record Cellar.", scene: "neon-block", x: doorXSafe("records") - 80 };
    }
    return { title: "Low Band", detail: "Listen to the radio inside the Record Cellar.", scene: "records", x: 108 };
  }
  if (quests["q-signal"]?.status === "active") {
    const step = quests["q-signal"].step;
    if (step <= 0) return { title: "The Midnight Signal", detail: "Tell Switch the count.", scene: "arcade", x: 230 };
    if (step === 1) return { title: "The Midnight Signal", detail: "Ask Professor Luckless what the count is for.", scene: "books", x: 214 };
    return { title: "The Midnight Signal", detail: "Ask the Night Clerk what the roof remembers.", scene: "mirage", x: 220 };
  }
  if (quests["q-griddle"]?.status === "active") {
    if ((state.inventory["griddle-jazz"] ?? 0) > 0) {
      return { title: "Griddle Jazz", detail: "Bring the record back to Dottie.", scene: "diner", x: 214 };
    }
    return { title: "Griddle Jazz", detail: "Harvey Wax has Griddle Jazz.", scene: "records", x: 214 };
  }
  if (quests["q-locket"]?.status === "active") {
    return { title: "Chrome Locket", detail: "Show the locket to the Night Clerk.", scene: "mirage", x: 220 };
  }
  if (quests["q-photo"]?.status === "active") {
    return { title: "Lost Frame", detail: "Leave the photograph at the Grand Mirage desk.", scene: "mirage", x: 220 };
  }
  if (quests["q-lou"]?.status === "active") {
    return { title: "Almost a System", detail: "Decide what Lucky Lou's wheel can actually remember.", scene: "neon-block", x: 1480 };
  }
  return null;
}

function doorXSafe(id: string): number {
  const hot = NPCS.find((npc) => npc.id === "ruby");
  if (id === "records" && hot) return hot.x + 80;
  return 1720;
}

export type JournalEntry = { id: string; title: string; status: "active" | "complete"; detail: string };

export function journal(state: WorldState): JournalEntry[] {
  const rows: JournalEntry[] = [];
  for (const [id, def] of Object.entries(QUESTS)) {
    const progress = state.quests[id];
    if (!progress) continue;
    const detail = progress.status === "complete" ? def.done : (def.steps[progress.step] ?? def.steps[0] ?? def.done);
    rows.push({ id, title: def.title, status: progress.status, detail });
  }
  return rows;
}

export function auditContent(): string[] {
  const problems: string[] = [];
  const npcIds = new Set<string>();
  for (const npc of NPCS) {
    if (npcIds.has(npc.id)) problems.push(`duplicate npc ${npc.id}`);
    npcIds.add(npc.id);
    if (!LOCATIONS[npc.scene]) problems.push(`npc ${npc.id} bad scene`);
    if (!npc.nodes[npc.root]) problems.push(`npc ${npc.id} missing root`);
    for (const [nodeId, node] of Object.entries(npc.nodes)) {
      for (const choice of node.choices) {
        if (choice.next && !npc.nodes[choice.next]) problems.push(`${npc.id}.${nodeId} → ${choice.next}`);
        for (const effect of choice.effects ?? []) {
          if (effect.op === "item" || effect.op === "take") {
            if (!ITEMS[effect.id]) problems.push(`missing item ${effect.id}`);
          }
          if (effect.op === "quest" && !QUESTS[effect.id]) problems.push(`missing quest ${effect.id}`);
        }
        if (choice.hasItem && !ITEMS[choice.hasItem]) problems.push(`choice item ${choice.hasItem}`);
      }
    }
  }
  for (const encounter of ENCOUNTERS) {
    if (!encounter.nodes[encounter.root]) problems.push(`encounter ${encounter.id} root`);
    for (const node of Object.values(encounter.nodes)) {
      for (const choice of node.choices) {
        if (choice.next && !encounter.nodes[choice.next]) problems.push(`encounter ${encounter.id} → ${choice.next}`);
      }
    }
  }
  const itemIds = new Set<string>();
  for (const item of Object.values(ITEMS)) {
    if (itemIds.has(item.id)) problems.push(`duplicate item ${item.id}`);
    itemIds.add(item.id);
    if (item.price < 0) problems.push(`negative price ${item.id}`);
  }
  for (const location of Object.values(LOCATIONS)) {
    for (const itemId of location.shop) {
      if (!ITEMS[itemId]) problems.push(`${location.id} sells missing ${itemId}`);
    }
  }
  const portalIds = new Set<string>();
  for (const portal of PORTALS) {
    if (portalIds.has(portal.id)) problems.push(`duplicate portal ${portal.id}`);
    portalIds.add(portal.id);
    if (!LOCATIONS[portal.scene]) problems.push(`portal scene ${portal.scene}`);
    if (portal.to && !LOCATIONS[portal.to]) problems.push(`portal to ${portal.to}`);
  }
  for (const scene of Object.keys(LOCATIONS) as SceneId[]) {
    if (scene === "neon-block") continue;
    if (!PORTALS.some((portal) => portal.scene === scene && portal.to === "neon-block")) {
      problems.push(`no exit from ${scene}`);
    }
  }
  if (!PORTALS.some((portal) => portal.casino === "floor")) problems.push("no casino floor door");
  for (const faction of FACTIONS) {
    if (!(faction in { block: 1, diner: 1, gilt: 1, arcade: 1, night: 1 })) problems.push(faction);
  }
  return problems;
}
