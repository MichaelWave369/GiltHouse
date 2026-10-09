import { ITEMS, LOCATIONS, QUESTS, sceneY } from "./content.ts";
import { styleScore, withStyle } from "./logic.ts";
import {
  CHIP_SAVE_KEY,
  SCENES,
  WORLD_SAVE_KEY,
  WORLD_VERSION,
  type Appearance,
  type Prefs,
  type WorldState,
} from "./types.ts";

export { CHIP_SAVE_KEY, WORLD_SAVE_KEY };

const HAIR = ["crop", "wave", "bun", "spike"] as const;
const OUTFITS = ["tee", "suit", "dress"] as const;
const JACKETS = ["none", "leather", "champagne", "teal"] as const;
const PALETTES = ["oxblood", "gold", "teal", "violet"] as const;
const ACCESSORIES = ["none", "shades", "hat", "earring"] as const;
const SHOES = ["kicks", "two-tone"] as const;

export function defaultAppearance(): Appearance {
  return {
    hair: "wave",
    outfit: "tee",
    jacket: "none",
    palette: "oxblood",
    accessory: "none",
    shoes: "kicks",
    pin: false,
  };
}

export function defaultPrefs(): Prefs {
  return { music: 0.7, sfx: 0.8, mute: false, reduced: false };
}

export function defaultWorld(): WorldState {
  const appearance = defaultAppearance();
  return {
    version: WORLD_VERSION,
    scene: "neon-block",
    x: 128,
    y: sceneY("neon-block"),
    facing: 1,
    appearance,
    energy: 78,
    charm: 1,
    knowledge: 1,
    style: styleScore(appearance),
    reputation: { block: 0, diner: 0, gilt: 0, arcade: 0, night: 0 },
    tokens: 24,
    inventory: {},
    equipped: [],
    quests: { "q-welcome": { status: "active", step: 0 } },
    flags: {},
    seenEncounters: [],
    encounterCooldown: 28,
    jukebox: null,
    worldTime: 0,
    prefs: defaultPrefs(),
  };
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function readAppearance(value: unknown, fallback: Appearance): Appearance {
  const row = value && typeof value === "object" ? (value as Partial<Appearance>) : {};
  return {
    hair: pick(row.hair, HAIR, fallback.hair),
    outfit: pick(row.outfit, OUTFITS, fallback.outfit),
    jacket: pick(row.jacket, JACKETS, fallback.jacket),
    palette: pick(row.palette, PALETTES, fallback.palette),
    accessory: pick(row.accessory, ACCESSORIES, fallback.accessory),
    shoes: pick(row.shoes, SHOES, fallback.shoes),
    pin: row.pin === true,
  };
}

function sanitize(raw: Record<string, unknown>, base: WorldState): WorldState {
  const scene = pick(raw.scene, SCENES, base.scene);
  const appearance = readAppearance(raw.appearance, base.appearance);
  const inventory: Record<string, number> = {};
  if (raw.inventory && typeof raw.inventory === "object") {
    for (const [id, qty] of Object.entries(raw.inventory as Record<string, unknown>)) {
      if (!ITEMS[id] || typeof qty !== "number" || !Number.isFinite(qty) || qty <= 0) continue;
      inventory[id] = Math.min(99, Math.floor(qty));
    }
  }
  const equipped = Array.isArray(raw.equipped)
    ? raw.equipped.filter((id): id is string => typeof id === "string" && (inventory[id] ?? 0) > 0 && Boolean(ITEMS[id]?.equip))
    : [];
  const quests: WorldState["quests"] = {};
  if (raw.quests && typeof raw.quests === "object") {
    for (const [id, value] of Object.entries(raw.quests as Record<string, unknown>)) {
      if (!QUESTS[id] || !value || typeof value !== "object") continue;
      const row = value as { status?: unknown; step?: unknown };
      if (row.status !== "active" && row.status !== "complete") continue;
      quests[id] = { status: row.status, step: num(row.step, 0, 0, 12) };
    }
  }
  if (Object.keys(quests).length === 0) quests["q-welcome"] = { status: "active", step: 0 };
  const flags: WorldState["flags"] = {};
  if (raw.flags && typeof raw.flags === "object") {
    for (const [key, value] of Object.entries(raw.flags as Record<string, unknown>)) {
      if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") flags[key] = value;
    }
  }
  const reputation: Record<string, number> = { ...base.reputation };
  if (raw.reputation && typeof raw.reputation === "object") {
    for (const [key, value] of Object.entries(raw.reputation as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) reputation[key] = Math.max(0, Math.min(99, Math.round(value)));
    }
  }
  const prefsRaw = raw.prefs && typeof raw.prefs === "object" ? (raw.prefs as Partial<Prefs>) : {};
  const width = LOCATIONS[scene].width;
  const state: WorldState = {
    version: WORLD_VERSION,
    scene,
    x: num(raw.x, base.x, 18, width - 18),
    y: sceneY(scene),
    facing: raw.facing === -1 ? -1 : 1,
    appearance,
    energy: num(raw.energy, base.energy, 0, 100),
    charm: num(raw.charm, base.charm, 0, 12),
    knowledge: num(raw.knowledge, base.knowledge, 0, 12),
    style: 1,
    reputation,
    tokens: num(raw.tokens, base.tokens, 0, 99999),
    inventory,
    equipped,
    quests,
    flags,
    seenEncounters: Array.isArray(raw.seenEncounters)
      ? raw.seenEncounters.filter((id): id is string => typeof id === "string").slice(0, 64)
      : [],
    encounterCooldown: num(raw.encounterCooldown, base.encounterCooldown, 0, 600),
    jukebox: typeof raw.jukebox === "string" ? raw.jukebox : null,
    worldTime: num(raw.worldTime, 0, 0, 1_000_000),
    prefs: {
      music: num(prefsRaw.music, base.prefs.music, 0, 1),
      sfx: num(prefsRaw.sfx, base.prefs.sfx, 0, 1),
      mute: prefsRaw.mute === true,
      reduced: prefsRaw.reduced === true,
    },
  };
  return withStyle(state);
}

export function parseSave(raw: string | null): { state: WorldState; recovered: boolean } {
  const base = defaultWorld();
  if (!raw) return { state: base, recovered: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { state: base, recovered: true };
    let data = parsed as Record<string, unknown>;
    if (data.version === 0) {
      const appearance = data.appearance && typeof data.appearance === "object" ? { ...(data.appearance as object) } : {};
      data = { ...data, version: WORLD_VERSION, appearance: { ...appearance, shoes: "kicks", pin: false } };
    }
    if (data.version !== WORLD_VERSION) return { state: base, recovered: true };
    return { state: sanitize(data, base), recovered: false };
  } catch {
    return { state: base, recovered: true };
  }
}

export type KeyValueStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
};

export function loadWorld(storage: KeyValueStore): { state: WorldState; recovered: boolean } {
  try {
    return parseSave(storage.getItem(WORLD_SAVE_KEY));
  } catch {
    return { state: defaultWorld(), recovered: true };
  }
}

export function saveWorld(storage: KeyValueStore, state: WorldState): void {
  const payload: WorldState = { ...state, version: WORLD_VERSION };
  storage.setItem(WORLD_SAVE_KEY, JSON.stringify(payload));
}

export function clearWorld(storage: KeyValueStore): void {
  storage.removeItem?.(WORLD_SAVE_KEY);
}
