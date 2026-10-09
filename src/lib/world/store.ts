import { create } from "zustand";
import { useCasino, type View } from "@/lib/casino/store";
import type { Appearance, CasinoDoor, TalkKind } from "./types.ts";
import {
  clearWorld,
  defaultWorld,
  loadWorld,
  saveWorld,
  type KeyValueStore,
} from "./save.ts";
import {
  currentObjective,
  equipItem,
  grantArcade,
  interact as interactWorld,
  journal,
  lookAt,
  maybeEncounter,
  movePlayer,
  pickChoice,
  playRecord,
  purchase,
  speakerName,
  tick,
  useItem,
  withStyle,
  type Aim,
} from "./logic.ts";
import { encounterById } from "./content.ts";

export type Panel = "none" | "title" | "create" | "intro" | "chapter" | "pause" | "inventory" | "journal" | "map" | "help" | "shop" | "agent-desk";

type Talk = { kind: TalkKind; id: string; nodeId: string };

type WorldStore = {
  world: ReturnType<typeof defaultWorld>;
  mode: "street" | "casino";
  booted: boolean;
  recovered: boolean;
  panel: Panel;
  talk: Talk | null;
  arcade: null | "pulse" | "memory";
  toast: string | null;
  boot: () => void;
  save: () => void;
  setAppearance: (patch: Partial<Appearance>) => void;
  confirmLook: () => void;
  dismissIntro: () => void;
  continueNight: () => void;
  beginNewGame: () => void;
  dismissChapter: () => void;
  openPanel: (panel: Panel) => void;
  closePanel: () => void;
  move: (dir: -1 | 0 | 1, dt: number) => void;
  step: (dt: number, walking: boolean) => void;
  interact: (aim?: Aim) => void;
  choose: (choiceId: string) => void;
  closeTalk: () => void;
  buy: (itemId: string) => void;
  use: (itemId: string) => void;
  equip: (itemId: string) => void;
  listen: (itemId: string) => void;
  setToast: (toast: string | null) => void;
  setPrefs: (patch: Partial<ReturnType<typeof defaultWorld>["prefs"]>) => void;
  enterCasino: (view: CasinoDoor) => void;
  leaveCasino: () => void;
  finishArcade: (score: number, total: number) => void;
  closeArcade: () => void;
  resetWorld: () => void;
  tryEncounter: (rng?: () => number) => void;
};

function memory(): KeyValueStore {
  return localStorage;
}

function casinoView(door: CasinoDoor): View {
  if (door === "floor") return "floor";
  if (door === "training") return "training";
  if (door === "workshop") return "workshop";
  if (door === "sports") return "sports";
  return "agents";
}

function resumeAfterTitle(world: ReturnType<typeof defaultWorld>): Panel {
  if (world.flags.created !== true) return "create";
  if (world.flags["chapter:one"] === true && world.flags["chapter:seen"] !== true) return "chapter";
  if (world.flags.intro !== true) return "intro";
  return "none";
}

export const useWorld = create<WorldStore>((set, get) => ({
  world: defaultWorld(),
  mode: "street",
  booted: false,
  recovered: false,
  panel: "none",
  talk: null,
  arcade: null,
  toast: null,
  boot: () => {
    if (get().booted || typeof window === "undefined") return;
    const loaded = loadWorld(memory());
    set({
      world: loaded.state,
      booted: true,
      recovered: loaded.recovered,
      panel: "title",
      toast: loaded.recovered ? "The street journal was unreadable, so this is a fresh walk. Your chips were left alone." : null,
    });
  },
  save: () => {
    if (typeof window === "undefined") return;
    try {
      saveWorld(memory(), get().world);
    } catch {
      set({ toast: "Couldn't write the street journal. Progress stays in this session." });
    }
  },
  setAppearance: (patch) => {
    const appearance = { ...get().world.appearance, ...patch };
    set({ world: withStyle({ ...get().world, appearance }) });
  },
  confirmLook: () => {
    const world = {
      ...get().world,
      flags: { ...get().world.flags, created: true },
    };
    set({ world: withStyle(world), panel: get().world.flags.intro ? "none" : "intro" });
    get().save();
  },
  dismissIntro: () => {
    const world = { ...get().world, flags: { ...get().world.flags, intro: true, created: true } };
    set({ world, panel: "none" });
    get().save();
  },
  continueNight: () => {
    set({ panel: resumeAfterTitle(get().world) });
  },
  beginNewGame: () => {
    if (typeof window !== "undefined") clearWorld(memory());
    set({
      world: defaultWorld(),
      mode: "street",
      panel: "create",
      talk: null,
      arcade: null,
      recovered: false,
      toast: "A new walk. The casino purse was not touched.",
    });
  },
  dismissChapter: () => {
    const world = { ...get().world, flags: { ...get().world.flags, "chapter:seen": true } };
    set({ world, panel: "none", talk: null });
    get().save();
  },
  openPanel: (panel) => set({ panel, talk: panel === "none" ? get().talk : null }),
  closePanel: () => set({ panel: "none" }),
  move: (dir, dt) => {
    const blocked = get().panel !== "none" && get().panel !== "intro";
    if (blocked || get().talk || get().arcade || get().mode !== "street") return;
    set({ world: movePlayer(get().world, dir, dt) });
  },
  step: (dt, walking) => {
    if (get().mode !== "street") return;
    set({ world: tick(get().world, dt, walking && !get().talk && get().panel === "none") });
  },
  interact: (aim: Aim = "act") => {
    if (get().talk || get().arcade || get().mode !== "street") return;
    if (get().panel !== "none" && get().panel !== "intro") return;
    let result = interactWorld(get().world, aim);
    if (aim === "door" && result.action.type === "none") result = interactWorld(get().world, "act");
    const sceneChanged = result.state.scene !== get().world.scene;
    set({ world: result.state });
    const action = result.action;
    if (action.type === "dialogue") set({ talk: { kind: action.kind, id: action.id, nodeId: action.nodeId }, panel: "none" });
    else if (action.type === "shop") set({ panel: "shop" });
    else if (action.type === "arcade") set({ arcade: action.game, panel: "none" });
    else if (action.type === "casino") get().enterCasino(action.view);
    else if (action.type === "toast" && !sceneChanged) set({ toast: action.text });
    else if (action.type === "none") set({ toast: "Nothing here but neon and good intentions." });
    if (sceneChanged || action.type === "dialogue" || action.type === "casino") get().save();
  },
  choose: (choiceId) => {
    const talk = get().talk;
    if (!talk) return;
    const result = pickChoice(get().world, talk.kind, talk.id, talk.nodeId, choiceId);
    if (result.missing) return;
    set({ world: result.state });
    const showChapter = result.state.flags["chapter:one"] === true && result.state.flags["chapter:seen"] !== true;
    if (result.shop) {
      set({ talk: null, panel: "shop" });
    } else if (result.casino) {
      set({ talk: null });
      get().enterCasino(result.casino);
    } else if (result.next) {
      set({ talk: { ...talk, nodeId: result.next } });
    } else if (showChapter) {
      set({ talk: null, panel: "chapter" });
    } else {
      set({ talk: null });
    }
    get().save();
  },
  closeTalk: () => set({ talk: null }),
  buy: (itemId) => {
    const result = purchase(get().world, itemId);
    set({ world: result.state, toast: result.reason });
    if (result.ok) get().save();
  },
  use: (itemId) => {
    const result = useItem(get().world, itemId);
    set({ world: result.state, toast: result.reason });
    if (result.ok) get().save();
  },
  equip: (itemId) => {
    const result = equipItem(get().world, itemId);
    set({ world: result.state, toast: result.reason });
    if (result.ok) get().save();
  },
  listen: (itemId) => {
    const result = playRecord(get().world, itemId);
    set({ world: result.state, toast: result.reason });
    if (result.ok) get().save();
  },
  setToast: (toast) => set({ toast }),
  setPrefs: (patch) => {
    const world = { ...get().world, prefs: { ...get().world.prefs, ...patch } };
    set({ world });
    get().save();
  },
  enterCasino: (view) => {
    useCasino.getState().setView(casinoView(view));
    set({ mode: "casino", panel: "none", talk: null, arcade: null });
    get().save();
  },
  leaveCasino: () => {
    useCasino.getState().setView("floor");
    set({ mode: "street" });
  },
  finishArcade: (score, total) => {
    const game = get().arcade;
    if (!game) return;
    set({ arcade: null });
    const result = grantArcade(get().world, game, score, total);
    set({ world: result.state, toast: result.message });
    get().save();
  },
  closeArcade: () => set({ arcade: null }),
  resetWorld: () => {
    if (typeof window !== "undefined") clearWorld(memory());
    const world = defaultWorld();
    world.flags = { ...world.flags, created: true, intro: true };
    set({
      world,
      mode: "street",
      panel: "none",
      talk: null,
      arcade: null,
      toast: "The block forgot this walk. Chips in the casino were not touched.",
    });
    get().save();
  },
  tryEncounter: (rng = Math.random) => {
    if (get().talk || get().arcade || get().panel !== "none" || get().mode !== "street") return;
    const result = maybeEncounter(get().world, rng);
    if (!result.encounterId) {
      set({ world: result.state });
      return;
    }
    const encounter = encounterById(result.encounterId);
    set({
      world: result.state,
      talk: encounter ? { kind: "encounter", id: encounter.id, nodeId: encounter.root } : null,
    });
    get().save();
  },
}));

export function objectiveNow() {
  return currentObjective(useWorld.getState().world);
}

export function journalNow() {
  return journal(useWorld.getState().world);
}

export function lookNow() {
  return lookAt(useWorld.getState().world);
}

export function talkingName(talk: Talk | null): string {
  if (!talk) return "";
  return speakerName(talk.kind, talk.id);
}

