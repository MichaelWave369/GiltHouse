export const WORLD_SAVE_KEY = "gilt-house-world-v1";
export const CHIP_SAVE_KEY = "gilt-house-v1";
export const WORLD_VERSION = 1;

export const SCENES = [
  "neon-block",
  "diner",
  "velvet",
  "gilt-lobby",
  "records",
  "arcade",
  "books",
  "pawn",
  "comet",
  "last-call",
  "starlight",
  "mirage",
] as const;

export type SceneId = (typeof SCENES)[number];

export type CasinoDoor = "floor" | "training" | "workshop" | "sports" | "agents";

export type Appearance = {
  hair: "crop" | "wave" | "bun" | "spike";
  outfit: "tee" | "suit" | "dress";
  jacket: "none" | "leather" | "champagne" | "teal";
  palette: "oxblood" | "gold" | "teal" | "violet";
  accessory: "none" | "shades" | "hat" | "earring";
  shoes: "kicks" | "two-tone";
  pin: boolean;
};

export type QuestStatus = "active" | "complete";

export type QuestProgress = {
  status: QuestStatus;
  step: number;
};

export type Prefs = {
  music: number;
  sfx: number;
  mute: boolean;
  reduced: boolean;
};

export type WorldState = {
  version: number;
  scene: SceneId;
  x: number;
  y: number;
  facing: 1 | -1;
  appearance: Appearance;
  energy: number;
  charm: number;
  knowledge: number;
  style: number;
  reputation: Record<string, number>;
  tokens: number;
  inventory: Record<string, number>;
  equipped: string[];
  quests: Record<string, QuestProgress>;
  flags: Record<string, boolean | number | string>;
  seenEncounters: string[];
  encounterCooldown: number;
  jukebox: string | null;
  worldTime: number;
  prefs: Prefs;
};

export type Effect =
  | { op: "tokens"; n: number }
  | { op: "energy"; n: number }
  | { op: "charm"; n: number }
  | { op: "knowledge"; n: number }
  | { op: "rep"; faction: string; n: number }
  | { op: "flag"; key: string; value: boolean | number | string }
  | { op: "item"; id: string; n: number }
  | { op: "take"; id: string; n: number }
  | { op: "quest"; id: string; status: QuestStatus; step: number }
  | { op: "jukebox"; track: string };

export type ChoiceDef = {
  id: string;
  text: string;
  next?: string;
  effects?: Effect[];
  casino?: CasinoDoor;
  shop?: boolean;
  requireFlag?: string;
  absentFlag?: string;
  minKnowledge?: number;
  minCharm?: number;
  minStyle?: number;
  hasItem?: string;
  quest?: string;
  questStep?: number;
};

export type NodeDef = {
  text: string;
  choices: ChoiceDef[];
};

export type ItemKind = "food" | "wear" | "record" | "book" | "key" | "souvenir";

export type ItemDef = {
  id: string;
  name: string;
  price: number;
  kind: ItemKind;
  unique?: boolean;
  blurb: string;
  use?: { energy?: number; charm?: number; knowledge?: number; flag?: string; note: string };
  equip?: { slot: "outfit" | "jacket" | "accessory" | "shoes" | "pin"; value: string | boolean };
  jukebox?: string;
};

export type TalkKind = "npc" | "encounter";
