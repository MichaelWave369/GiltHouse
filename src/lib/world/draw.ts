import { FACADES, HOTSPOTS, LOCATIONS, NPCS, VIEW_H, VIEW_W, WORLD_W } from "./content.ts";
import { lookAt, npcX } from "./logic.ts";
import type { Appearance, SceneId, WorldState } from "./types.ts";

export { VIEW_H, VIEW_W };

const INK = "#100c0a";
const ASPHALT = "#2a2724";
const WALK = "#3a342e";
const CREAM = "#f3e6cf";
const GOLD = "#e6c36a";
const OXBLOOD = "#8c2436";
const TEAL = "#1f6f66";
const VIOLET = "#5c3d8a";
const PINK = "#ff4f86";
const AMBER = "#ffb020";

const PALETTE: Record<Appearance["palette"], { cloth: string; accent: string }> = {
  oxblood: { cloth: "#8c2436", accent: "#e6c36a" },
  gold: { cloth: "#c6a15a", accent: "#2a1814" },
  teal: { cloth: "#1c6e66", accent: "#f2d48a" },
  violet: { cloth: "#5c3d8a", accent: "#f2b6cf" },
};

const SKIN = "#e4b892";
const SKIN_SHADOW = "#c48b62";

const GLYPH: Record<string, string> = {
  A: "010101111101101",
  B: "110101110101110",
  C: "011100100100011",
  D: "110101101101110",
  E: "111100110100111",
  F: "111100110100100",
  G: "011100101101011",
  H: "101101111101101",
  I: "111010010010111",
  J: "001001001101011",
  K: "101101110101101",
  L: "100100100100111",
  M: "101111111101101",
  N: "110101101101101",
  O: "010101101101010",
  P: "110101110100100",
  R: "110101110101101",
  S: "011100010001110",
  T: "111010010010010",
  U: "101101101101011",
  V: "101101101010010",
  W: "101101111111101",
  Y: "101101010010010",
  "2": "110001010100111",
  " ": "000000000000000",
};

function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  const word = text.toUpperCase().replace(/[^A-Z2 ]/g, "");
  let cursor = x;
  for (const char of word) {
    const bits = GLYPH[char] ?? GLYPH[" "]!;
    for (let i = 0; i < 15; i++) {
      if (bits[i] === "1") px(ctx, cursor + (i % 3), y + Math.floor(i / 3), color);
    }
    cursor += 4;
  }
}

export function cameraX(sceneWidth: number, playerX: number): number {
  const max = Math.max(0, sceneWidth - VIEW_W);
  return Math.max(0, Math.min(max, playerX - VIEW_W * 0.42));
}

export type DrawOpts = {
  time: number;
  walking: boolean;
  walkPhase: number;
  reduced: boolean;
};

export function renderFrame(ctx: CanvasRenderingContext2D, world: WorldState, opts: DrawOpts) {
  const location = LOCATIONS[world.scene];
  const cam = cameraX(location.width, world.x);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const posing = !opts.walking && lookAt(world, "act") != null;
  if (world.scene === "neon-block") drawStreet(ctx, world, cam, opts, posing);
  else drawInterior(ctx, world, cam, opts, posing);
  const pulse = opts.reduced ? 0.12 : 0.22 + Math.sin(opts.time * 2) * 0.04;
  ctx.fillStyle = `rgba(0,0,0,${pulse})`;
  ctx.fillRect(0, 0, VIEW_W, 8);
  ctx.fillRect(0, VIEW_H - 6, VIEW_W, 6);
}

function drawStreet(
  ctx: CanvasRenderingContext2D,
  world: WorldState,
  cam: number,
  opts: DrawOpts,
  posing: boolean,
) {
  for (let i = 0; i < 8; i++) {
    const shade = 8 + i * 3;
    rect(ctx, 0, i * 9, VIEW_W, 9, `rgb(${shade + 10},${shade + 2},${shade + 18})`);
  }
  rect(ctx, 248, 16, 26, 26, "#f4e7c4");
  rect(ctx, 254, 22, 14, 14, "#f7f1df");
  rect(ctx, 258, 26, 6, 6, "#efe2b0");
  for (let i = 0; i < 36; i++) {
    const sx = (i * 97) % VIEW_W;
    const sy = (i * 53) % 62;
    if (hash(i + 3) > 0.55) px(ctx, sx, sy, "#f7edd6");
  }
  const skyCam = cam * 0.28;
  for (let i = 0; i < 22; i++) {
    const h = 16 + (i % 5) * 9;
    const x = i * 70 - (skyCam % 70);
    rect(ctx, x, 78 - h, 42, h, i % 2 === 0 ? "#161018" : "#20141c");
    if (hash(i + 9) > 0.4) rect(ctx, x + 6, 78 - h + 6, 4, 3, hash(i) > 0.5 ? AMBER : "#4a3024");
    if (hash(i + 2) > 0.6) rect(ctx, x + 16, 78 - h + 14, 4, 3, "#3a2a44");
  }
  rect(ctx, 0, 128, VIEW_W, 28, WALK);
  rect(ctx, 0, 128, VIEW_W, 2, "#4e453c");
  for (let x = -((cam * 0.2) % 16); x < VIEW_W; x += 16) rect(ctx, x, 142, 10, 1, "#463e36");
  rect(ctx, 0, 154, VIEW_W, 4, "#51483e");
  rect(ctx, 0, 158, VIEW_W, 22, ASPHALT);
  const dashOffset = opts.reduced ? 0 : (opts.time * 22) % 22;
  for (let x = -dashOffset; x < VIEW_W; x += 22) rect(ctx, x, 167, 8, 2, "#6a6258");

  for (const facade of FACADES) {
    const steady = Boolean(world.flags[`sign:${facade.id}`]);
    drawFacade(ctx, facade.x - cam, facade, opts.time, opts.reduced, steady);
  }

  for (let i = 0; i < 8; i++) {
    const lx = 80 + i * 520 - cam;
    if (lx < -20 || lx > VIEW_W + 20) continue;
    lamp(ctx, lx, opts.time, opts.reduced);
  }

  for (const hot of HOTSPOTS) {
    if (hot.scene !== "neon-block" || hot.kind !== "sign") continue;
    const read = Boolean(world.flags[hot.id]);
    const flicker = opts.reduced || read ? 1 : Math.sin(opts.time * 9 + hot.x) > -0.15 ? 1 : 0.2;
    const bulb = read ? GOLD : PINK;
    rect(ctx, hot.x - cam - 14, 100, 28, 8, "#140c10");
    ctx.globalAlpha = flicker;
    rect(ctx, hot.x - cam - 12, 102, 6, 4, bulb);
    rect(ctx, hot.x - cam - 4, 102, 6, 4, bulb);
    rect(ctx, hot.x - cam + 4, 102, 6, 4, bulb);
    ctx.globalAlpha = 0.35 * flicker;
    rect(ctx, hot.x - cam - 10, 148, 20, 3, bulb);
    ctx.globalAlpha = 1;
  }

  const actors = NPCS.filter((npc) => npc.scene === "neon-block")
    .map((npc) => ({ npc, x: npcX(npc.id, world.worldTime, npc.x, npc.wander) }))
    .sort((a, b) => a.x - b.x);
  for (const actor of actors) {
    drawPerson(ctx, actor.x - cam, 156, {
      body: actor.npc.body,
      hair: actor.npc.hair,
      hat: actor.npc.hat ?? false,
      facing: actor.x < world.x ? 1 : -1,
      frame: opts.reduced ? 0 : Math.floor(opts.time * 2 + actor.npc.x) % 4,
      walking: Boolean(actor.npc.wander) && !opts.reduced,
      appearance: null,
      cue: cueFor(actor.npc.id),
    });
  }

  drawPerson(ctx, world.x - cam, world.y, {
    body: PALETTE[world.appearance.palette].cloth,
    hair: "#1a120e",
    hat: world.appearance.accessory === "hat",
    facing: world.facing,
    frame: opts.walking ? Math.floor(opts.walkPhase) % 4 : 0,
    walking: opts.walking,
    appearance: world.appearance,
    posing,
  });

  if (!opts.reduced) {
    for (let i = 0; i < 4; i++) {
      const speed = 40 + i * 16;
      const span = WORLD_W + 90;
      const x = ((opts.time * speed + i * 540) % span) - 40 - cam;
      drawCar(ctx, x, 162, i % 2 === 0 ? OXBLOOD : "#1c3f4a", i % 2 === 0);
    }
  }
  const objX = objectiveMarkerX(world);
  if (objX != null && world.scene === "neon-block") {
    const bob = opts.reduced ? 0 : Math.sin(opts.time * 4) * 2;
    rect(ctx, objX - cam - 3, 88 + bob, 6, 4, GOLD);
    rect(ctx, objX - cam - 1, 92 + bob, 2, 4, GOLD);
  }
}

function objectiveMarkerX(world: WorldState): number | null {
  if (world.quests["q-welcome"]?.status === "active") return 150;
  if (world.quests["q-flicker"]?.status === "active") {
    const id = !world.flags["sign:diner"] ? "sign:diner" : !world.flags["sign:gilt"] ? "sign:gilt" : "sign:mirage";
    return HOTSPOTS.find((hot) => hot.id === id)?.x ?? null;
  }
  if (world.quests["q-frequency"]?.status === "active") return 1560 + 160;
  if (world.quests["q-signal"]?.status === "active") {
    const step = world.quests["q-signal"]?.step ?? 0;
    if (step <= 0) return 1880 + 180;
    if (step === 1) return 2240 + 150;
    return 3760 + 240;
  }
  return null;
}

function lamp(ctx: CanvasRenderingContext2D, x: number, time: number, reduced: boolean) {
  rect(ctx, x, 96, 2, 58, "#2a241c");
  rect(ctx, x - 4, 92, 10, 4, "#1a140e");
  const glow = reduced ? 1 : 0.75 + Math.sin(time * 3 + x) * 0.25;
  ctx.globalAlpha = glow;
  rect(ctx, x - 3, 94, 8, 3, AMBER);
  ctx.globalAlpha = 0.18 * glow;
  rect(ctx, x - 8, 100, 18, 28, AMBER);
  ctx.globalAlpha = 1;
}

function drawFacade(
  ctx: CanvasRenderingContext2D,
  x: number,
  facade: (typeof FACADES)[number],
  time: number,
  reduced: boolean,
  steady: boolean,
) {
  if (x > VIEW_W + 8 || x + facade.w < -8) return;
  const base = 154;
  const tall = facade.theme === "gilt" || facade.theme === "mirage" || facade.theme === "starlight";
  const h = tall ? 100 : facade.theme === "gate" ? 64 : 82;
  const top = base - h;
  const wall = wallColor(facade.theme);
  rect(ctx, x, top, facade.w, h, wall);
  rect(ctx, x, base - 4, facade.w, 4, "#1a1410");
  const trim = steady && (facade.id === "diner" || facade.id === "gilt" || facade.id === "mirage") ? GOLD : facade.neon;
  rect(ctx, x, top, facade.w, 3, trim);

  if (facade.theme === "gilt" || facade.theme === "mirage" || facade.theme === "starlight") {
    rect(ctx, x + facade.w / 2 - 10, top - 12, 20, 12, GOLD);
    rect(ctx, x + facade.w / 2 - 4, top - 18, 8, 6, facade.neon);
    rect(ctx, x + 6, top + 8, 5, h - 18, "#120c0c");
    rect(ctx, x + facade.w - 11, top + 8, 5, h - 18, "#120c0c");
  }
  if (facade.theme === "diner") {
    rect(ctx, x + 8, top + 18, facade.w - 16, 6, "#f4ead2");
    for (let i = 0; i < Math.floor((facade.w - 16) / 8); i++) {
      if (i % 2 === 0) rect(ctx, x + 8 + i * 8, top + 18, 8, 6, OXBLOOD);
    }
  }
  if (facade.theme === "velvet") {
    rect(ctx, x + 10, top + 16, 8, 40, "#2a1020");
    rect(ctx, x + facade.w - 18, top + 16, 8, 40, "#2a1020");
    rect(ctx, x + 18, top + 22, facade.w - 36, 22, "#6a2848");
  }
  if (facade.theme === "arcade") {
    rect(ctx, x + 16, top + 28, 14, 22, PINK);
    rect(ctx, x + 34, top + 24, 14, 26, TEAL);
    rect(ctx, x + 52, top + 30, 14, 20, AMBER);
    rect(ctx, x + 18, top + 30, 10, 6, "#140814");
    rect(ctx, x + 36, top + 26, 10, 6, "#081410");
  }
  if (facade.theme === "records") {
    for (let i = 0; i < 4; i++) rect(ctx, x + 14 + i * 12, top + 22, 8, 8, i % 2 ? "#111" : "#143838");
  }
  if (facade.theme === "books") {
    for (let i = 0; i < 6; i++) rect(ctx, x + 12 + i * 7, top + 20, 5, 16, ["#8c2436", "#1f6f66", GOLD, VIOLET, "#c4552a", CREAM][i] ?? GOLD);
  }
  if (facade.theme === "pawn") {
    rect(ctx, x + 12, top + 28, 28, 16, "#101010");
    rect(ctx, x + 16, top + 32, 8, 6, GOLD);
  }
  if (facade.theme === "comet") {
    rect(ctx, x + 12, top + 20, 22, 10, AMBER);
    rect(ctx, x + facade.w - 28, top + 36, 14, 8, "#7a3e12");
  }
  if (facade.theme === "lastcall") {
    rect(ctx, x + 14, top + 18, 10, 18, VIOLET);
    rect(ctx, x + 28, top + 40, facade.w - 48, 6, "#140818");
  }
  if (facade.theme === "gate") {
    rect(ctx, x + 20, top + 16, facade.w - 40, h - 28, "#1a1612");
    rect(ctx, x + facade.w / 2 - 2, top + 10, 4, h - 16, GOLD);
  }

  const cols = Math.max(2, Math.floor((facade.w - 28) / 18));
  const rows = tall ? 3 : 2;
  const skipWindows = facade.theme === "gate" || facade.theme === "arcade";
  if (!skipWindows) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const wx = x + 14 + col * 18;
        const wy = top + (facade.theme === "diner" ? 28 : 14) + row * 16;
        if (wy > base - 34) continue;
        const lit = hash(facade.x + col * 9 + row * 4) > 0.42;
        rect(ctx, wx, wy, 10, 11, lit ? "#f0d7a2" : "#120c10");
        if (lit) rect(ctx, wx + 4, wy, 2, 11, "rgba(255,255,255,0.28)");
      }
    }
  }

  const doorX = x + facade.door - 9;
  rect(ctx, doorX - 2, base - 32, 20, 32, "#0c0808");
  rect(ctx, doorX, base - 30, 16, 28, facade.theme === "diner" ? "#3a1418" : "#16100e");
  rect(ctx, doorX + 11, base - 16, 2, 2, GOLD);
  rect(ctx, doorX + 3, base - 24, 5, 7, "#2a2018");
  if (facade.theme === "diner") rect(ctx, doorX + 3, base - 10, 10, 2, CREAM);

  const flicker = reduced || steady ? 1 : 0.55 + Math.sin(time * 6 + facade.x) * 0.45;
  ctx.globalAlpha = Math.max(0.4, flicker);
  const marquee = facade.name.length > 10 ? facade.name.slice(0, 10) : facade.name;
  label(ctx, marquee, x + 8, top + 5, trim);
  ctx.globalAlpha = 0.22 * flicker;
  rect(ctx, doorX - 6, 148, 28, 3, trim);
  ctx.globalAlpha = 1;
}

function wallColor(theme: string): string {
  if (theme === "diner") return "#6e2430";
  if (theme === "velvet") return "#4a2038";
  if (theme === "gilt") return "#3a1420";
  if (theme === "records") return "#163238";
  if (theme === "arcade") return "#241428";
  if (theme === "books") return "#3a2a18";
  if (theme === "pawn") return "#2c2a28";
  if (theme === "comet") return "#4a2a12";
  if (theme === "lastcall") return "#241833";
  if (theme === "starlight") return "#3a2418";
  if (theme === "mirage") return "#12302c";
  return "#2a241c";
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, right: boolean) {
  rect(ctx, x, y, 40, 12, color);
  rect(ctx, x + 8, y - 7, 22, 7, "#d9c7a4");
  rect(ctx, x + 10, y - 5, 7, 4, "#9ec4d4");
  rect(ctx, x + 20, y - 5, 7, 4, "#9ec4d4");
  rect(ctx, x + 3, y + 9, 7, 4, "#111");
  rect(ctx, x + 30, y + 9, 7, 4, "#111");
  rect(ctx, right ? x + 36 : x + 1, y + 2, 3, 2, "#f7edd6");
  rect(ctx, right ? x : x + 37, y + 3, 2, 2, "#ff4a3a");
}

function drawInterior(
  ctx: CanvasRenderingContext2D,
  world: WorldState,
  cam: number,
  opts: DrawOpts,
  posing: boolean,
) {
  const theme = LOCATIONS[world.scene].theme;
  const floor = floorColor(theme);
  const wall = interiorWall(theme);
  rect(ctx, 0, 0, VIEW_W, 100, wall);
  if (theme === "gilt" || theme === "starlight") {
    for (let x = 0; x < VIEW_W; x += 20) rect(ctx, x, 0, 10, 100, "rgba(0,0,0,0.18)");
  }
  if (theme === "velvet") rect(ctx, 0, 0, VIEW_W, 100, "#3a1428");
  rect(ctx, 0, 100, VIEW_W, 80, floor);
  rect(ctx, 0, 100, VIEW_W, 3, theme === "mirage" ? "#7fd1c7" : GOLD);
  paintRoom(ctx, theme, opts.time, opts.reduced);
  rect(ctx, 8 - cam, 108, 16, 40, "#120c0c");
  rect(ctx, 11 - cam, 118, 6, 10, "#2a2018");
  rect(ctx, 18 - cam, 124, 2, 2, GOLD);

  for (const npc of NPCS) {
    if (npc.scene !== world.scene) continue;
    drawPerson(ctx, npc.x - cam, sceneFeet(world.scene), {
      body: npc.body,
      hair: npc.hair,
      hat: npc.hat ?? false,
      facing: npc.x < world.x ? 1 : -1,
      frame: opts.reduced ? 0 : Math.floor(opts.time * 1.6) % 4,
      walking: false,
      appearance: null,
      cue: cueFor(npc.id),
      posing: npc.x - world.x < 40,
    });
  }
  drawPerson(ctx, world.x - cam, world.y, {
    body: PALETTE[world.appearance.palette].cloth,
    hair: hairColor(world.appearance),
    hat: world.appearance.accessory === "hat",
    facing: world.facing,
    frame: opts.walking ? Math.floor(opts.walkPhase) % 4 : 0,
    walking: opts.walking,
    appearance: world.appearance,
    posing,
  });
}

function floorColor(theme: string): string {
  if (theme === "diner") return "#6a3030";
  if (theme === "arcade") return "#140818";
  if (theme === "gilt") return "#4a1820";
  if (theme === "velvet") return "#2a1420";
  if (theme === "records") return "#101c1e";
  if (theme === "books") return "#3a2c1c";
  if (theme === "mirage") return "#0e2420";
  if (theme === "comet") return "#3a2414";
  if (theme === "lastcall") return "#1a1020";
  if (theme === "starlight") return "#2a1c14";
  if (theme === "pawn") return "#242220";
  return "#241810";
}

function interiorWall(theme: string): string {
  if (theme === "records") return "#102024";
  if (theme === "books") return "#3a2c1c";
  if (theme === "mirage") return "#0c1c1a";
  if (theme === "comet") return "#3a2414";
  if (theme === "arcade") return "#1a1024";
  if (theme === "gilt") return "#4a1822";
  if (theme === "starlight") return "#3a2018";
  if (theme === "lastcall") return "#1c1028";
  if (theme === "pawn") return "#1a1816";
  return "#2a1614";
}

function paintRoom(ctx: CanvasRenderingContext2D, theme: string, time: number, reduced: boolean) {
  const blink = reduced ? 1 : 0.65 + Math.sin(time * 5) * 0.35;
  if (theme === "diner") {
    rect(ctx, 18, 112, 86, 22, "#f2e6d4");
    rect(ctx, 18, 130, 86, 8, "#8c2436");
    for (let i = 0; i < 4; i++) rect(ctx, 28 + i * 18, 138, 8, 10, "#5a2428");
    rect(ctx, 190, 48, 110, 18, "#140c0c");
    ctx.globalAlpha = blink;
    label(ctx, "OPEN", 214, 52, PINK);
    ctx.globalAlpha = 1;
    rect(ctx, 200, 78, 90, 8, "#c4554a");
    rect(ctx, 40, 70, 22, 14, "#1a1010");
    rect(ctx, 44, 62, 4, 6, CREAM);
    rect(ctx, 220, 118, 36, 22, "#7a2430");
    rect(ctx, 224, 122, 28, 8, "#f2e2c4");
  } else if (theme === "velvet") {
    rect(ctx, 28, 28, 26, 58, "#efe4d2");
    rect(ctx, 32, 34, 18, 40, "#2a201c");
    rect(ctx, 36, 48, 10, 16, GOLD);
    for (let i = 0; i < 6; i++) {
      rect(ctx, 150 + i * 14, 36, 10, 58, ["#6a2040", "#1a120e", "#1f6f66", "#c6a15a", "#8c2436", "#3a1428"][i] ?? PINK);
    }
    rect(ctx, 150, 30, 84, 4, GOLD);
    rect(ctx, 70, 110, 40, 28, "#4a2030");
    label(ctx, "RACK", 74, 116, CREAM);
  } else if (theme === "gilt") {
    rect(ctx, 18, 16, 8, 84, GOLD);
    rect(ctx, 292, 16, 8, 84, GOLD);
    rect(ctx, 150, 10, 120, 16, GOLD);
    label(ctx, "GILT HOUSE", 164, 14, "#3a1420");
    rect(ctx, 80, 108, 180, 10, "#6a2430");
    rect(ctx, 188, 78, 40, 22, "#140c0c");
    rect(ctx, 196, 70, 24, 8, GOLD);
    rect(ctx, 360, 78, 36, 22, "#140c0c");
    rect(ctx, 430, 78, 36, 22, "#0f3d34");
    label(ctx, "LAB", 436, 84, "#7fd1c7");
  } else if (theme === "records") {
    for (let i = 0; i < 12; i++) {
      rect(ctx, 20 + (i % 6) * 16, 28 + Math.floor(i / 6) * 22, 12, 12, i % 2 ? "#111" : "#143434");
      rect(ctx, 23 + (i % 6) * 16, 31 + Math.floor(i / 6) * 22, 6, 6, i % 3 ? GOLD : TEAL);
    }
    rect(ctx, 140, 86, 40, 14, "#1a1a1a");
    rect(ctx, 148, 78, 24, 8, TEAL);
    ctx.globalAlpha = blink;
    rect(ctx, 154, 80, 4, 4, PINK);
    ctx.globalAlpha = 1;
    label(ctx, "ON AIR", 150, 58, TEAL);
  } else if (theme === "arcade") {
    cabinet(ctx, 64, PINK, time, reduced);
    cabinet(ctx, 124, TEAL, time + 1.2, reduced);
    rect(ctx, 200, 40, 70, 30, "#100814");
    ctx.globalAlpha = blink;
    label(ctx, "TOKENS", 208, 50, AMBER);
    ctx.globalAlpha = 1;
  } else if (theme === "books") {
    for (let shelf = 0; shelf < 3; shelf++) {
      rect(ctx, 24, 24 + shelf * 22, 120, 18, "#2a2014");
      for (let i = 0; i < 12; i++) {
        rect(ctx, 28 + i * 9, 26 + shelf * 22, 7, 14, ["#8c2436", "#1f6f66", "#c6a15a", "#5c3d8a", CREAM, "#c4552a"][i % 6] ?? GOLD);
      }
    }
    rect(ctx, 180, 110, 50, 16, "#5a4030");
    label(ctx, "READ", 188, 114, CREAM);
  } else if (theme === "pawn") {
    rect(ctx, 30, 78, 90, 22, "#101010");
    rect(ctx, 36, 70, 78, 8, "#2a2a2a");
    rect(ctx, 40, 84, 14, 10, GOLD);
    rect(ctx, 60, 86, 10, 8, PINK);
    rect(ctx, 76, 82, 8, 12, CREAM);
    rect(ctx, 160, 24, 2, 40, "#888");
    ctx.globalAlpha = blink;
    rect(ctx, 154, 20, 14, 8, AMBER);
    ctx.globalAlpha = 1;
    label(ctx, "HELD", 40, 48, CREAM);
  } else if (theme === "comet") {
    rect(ctx, 24, 100, 90, 18, "#7a3e12");
    rect(ctx, 30, 88, 78, 12, AMBER);
    for (let i = 0; i < 5; i++) rect(ctx, 36 + i * 12, 70, 6, 16, ["#8c2436", TEAL, GOLD, CREAM, VIOLET][i] ?? GOLD);
    rect(ctx, 180, 96, 48, 28, "#3a2414");
    rect(ctx, 186, 90, 36, 8, "#1a120e");
    label(ctx, "TILT", 190, 92, PINK);
  } else if (theme === "lastcall") {
    rect(ctx, 40, 100, 140, 14, "#120818");
    rect(ctx, 48, 86, 120, 14, "#2a1840");
    for (let i = 0; i < 6; i++) rect(ctx, 56 + i * 16, 68, 6, 16, i % 2 ? VIOLET : "#6a3048");
    rect(ctx, 220, 30, 16, 40, "#1a1028");
    ctx.globalAlpha = blink;
    rect(ctx, 216, 24, 24, 8, PINK);
    ctx.globalAlpha = 1;
    label(ctx, "LAST", 48, 40, "#d4b4ff");
  } else if (theme === "starlight") {
    rect(ctx, 40, 28, 160, 18, OXBLOOD);
    rect(ctx, 50, 46, 140, 28, "#1a100c");
    rect(ctx, 110, 74, 4, 26, GOLD);
    rect(ctx, 104, 70, 16, 6, "#222");
    rect(ctx, 70, 110, 100, 6, "#5a4030");
    label(ctx, "STAGE", 90, 34, GOLD);
  } else if (theme === "mirage") {
    rect(ctx, 120, 96, 140, 16, "#12312c");
    rect(ctx, 130, 86, 120, 10, "#1c4038");
    rect(ctx, 36, 24, 46, 28, "#d7c4a4");
    label(ctx, "KEYS", 42, 32, "#10211e");
    for (let i = 0; i < 8; i++) rect(ctx, 150 + i * 12, 28, 8, 18, i % 2 ? GOLD : "#0e2420");
    rect(ctx, 250, 40, 12, 18, "#1d6b48");
    rect(ctx, 246, 34, 20, 8, "#2f8f55");
  }
}

function cabinet(ctx: CanvasRenderingContext2D, x: number, color: string, time: number, reduced: boolean) {
  rect(ctx, x, 78, 36, 48, color);
  rect(ctx, x + 4, 84, 28, 18, "#07040a");
  const bar = reduced ? 8 : 6 + Math.floor((Math.sin(time * 6) + 1) * 8);
  rect(ctx, x + 8, 90, bar, 4, GOLD);
  rect(ctx, x + 12, 112, 12, 6, "#140c10");
  rect(ctx, x + 8, 70, 20, 8, "#1a1014");
}

function sceneFeet(scene: SceneId): number {
  return scene === "neon-block" ? 156 : 148;
}

function hairColor(appearance: Appearance): string {
  if (appearance.hair === "spike") return "#f2f2f2";
  if (appearance.hair === "bun") return "#4a2c22";
  return "#1a120e";
}

type PersonOpts = {
  body: string;
  hair: string;
  hat: boolean;
  facing: 1 | -1;
  frame: number;
  walking: boolean;
  appearance: Appearance | null;
  cue?: "apron" | "phones" | "coat" | "spark" | "mustache" | "glasses";
  posing?: boolean;
};

function cueFor(id: string): PersonOpts["cue"] {
  if (id === "dottie") return "apron";
  if (id === "ruby" || id === "switch") return "phones";
  if (id === "gus" || id === "sable" || id === "ivo" || id === "nell") return "coat";
  if (id === "kit" || id === "wick") return "spark";
  if (id === "lou") return "mustache";
  if (id === "luckless" || id === "ace") return "glasses";
  return undefined;
}

function drawPerson(ctx: CanvasRenderingContext2D, x: number, feet: number, person: PersonOpts) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(feet));
  ctx.scale(person.facing, 1);
  const step = person.frame % 4;
  const bob = person.walking ? [0, -1, -2, -1][step] ?? 0 : step === 0 || step === 2 ? -1 : 0;
  ctx.translate(0, bob);
  rect(ctx, -6, -2, 12, 3, "rgba(0,0,0,0.38)");
  const stride = [
    [2, -3],
    [1, -1],
    [-3, 2],
    [-1, 1],
  ][person.walking ? step : 0] ?? [0, 0];
  const shoe = person.appearance?.shoes === "two-tone" ? CREAM : "#16120f";
  rect(ctx, -5, -14, 3, 10, "#241c16");
  rect(ctx, 1, -14, 3, 10, "#241c16");
  rect(ctx, -6 + (stride[0] ?? 0), -5, 5, 3, shoe);
  rect(ctx, 1 + (stride[1] ?? 0), -5, 5, 3, shoe);
  if (person.appearance?.shoes === "two-tone") {
    rect(ctx, -6 + (stride[0] ?? 0), -4, 5, 1, "#16120f");
    rect(ctx, 1 + (stride[1] ?? 0), -4, 5, 1, "#16120f");
  }
  const cloth = person.appearance ? PALETTE[person.appearance.palette].cloth : person.body;
  if (person.appearance?.outfit === "dress") {
    rect(ctx, -6, -26, 12, 16, cloth);
    rect(ctx, -7, -16, 14, 6, cloth);
  } else {
    rect(ctx, -5, -24, 10, 12, cloth);
    if (person.appearance?.outfit === "suit") {
      rect(ctx, -5, -24, 2, 12, "#1a120e");
      rect(ctx, -1, -22, 2, 8, CREAM);
    }
  }
  const jacket = person.appearance?.jacket;
  if (jacket && jacket !== "none") {
    const color = jacket === "leather" ? "#241910" : jacket === "champagne" ? "#d7c08a" : TEAL;
    rect(ctx, -7, -25, 14, 11, color);
    rect(ctx, -7, -18, 3, 7, color);
    rect(ctx, 4, -18, 3, 7, color);
    rect(ctx, -1, -23, 2, 7, "#1a120e");
  } else if (person.cue === "coat") {
    rect(ctx, -7, -25, 14, 10, "#1a120e");
    rect(ctx, -7, -18, 3, 6, "#1a120e");
    rect(ctx, 4, -18, 3, 6, "#1a120e");
  }
  if (person.cue === "apron") {
    rect(ctx, -4, -22, 8, 10, "#f4ead2");
    rect(ctx, -1, -22, 2, 10, "#d7c4a4");
  }
  const armY = person.posing ? -28 : -22;
  const swing = person.walking ? [2, 0, -2, 0][step] ?? 0 : 0;
  rect(ctx, -8, armY + swing, 3, 8, SKIN);
  rect(ctx, 5, -22 - swing, 3, 8, SKIN);
  rect(ctx, -4, -34, 8, 10, SKIN);
  rect(ctx, -4, -26, 8, 2, SKIN_SHADOW);
  px(ctx, -2, -30, "#2a1812");
  px(ctx, 2, -30, "#2a1812");
  if (step % 2 === 0 && !person.posing) px(ctx, 0, -27, "#a85a58");
  const hair = person.appearance ? hairColor(person.appearance) : person.hair;
  const style = person.appearance?.hair ?? (person.cue === "apron" ? "bun" : "wave");
  if (style === "crop") rect(ctx, -5, -37, 10, 4, hair);
  else if (style === "bun") {
    rect(ctx, -5, -37, 10, 4, hair);
    rect(ctx, -2, -41, 6, 4, hair);
  } else if (style === "spike") {
    rect(ctx, -5, -36, 10, 3, hair);
    rect(ctx, -2, -41, 2, 5, hair);
    rect(ctx, 2, -39, 2, 3, hair);
    rect(ctx, -5, -39, 2, 3, hair);
  } else {
    rect(ctx, -5, -38, 10, 6, hair);
    rect(ctx, 3, -32, 3, 8, hair);
  }
  if (person.hat || person.appearance?.accessory === "hat") {
    rect(ctx, -6, -39, 12, 2, "#1a120e");
    rect(ctx, -4, -43, 8, 4, "#1a120e");
  }
  if (person.appearance?.accessory === "shades" || person.cue === "phones" || person.cue === "glasses") {
    rect(ctx, -3, -31, 7, 2, person.cue === "glasses" ? "#cfd8e6" : "#111");
  }
  if (person.cue === "phones") {
    rect(ctx, -6, -31, 2, 4, GOLD);
    rect(ctx, 4, -31, 2, 4, GOLD);
    rect(ctx, -6, -34, 12, 2, GOLD);
  }
  if (person.cue === "mustache") rect(ctx, -3, -27, 6, 2, "#1b1b1b");
  if (person.appearance?.accessory === "earring") rect(ctx, 4, -28, 1, 3, PINK);
  if (person.appearance?.pin) rect(ctx, 2, -21, 2, 2, GOLD);
  if (person.cue === "spark") {
    const spark = step % 2 === 0 ? GOLD : PINK;
    rect(ctx, 6, -36, 2, 2, spark);
    if (!person.walking) rect(ctx, 8, -34, 1, 1, CREAM);
  }
  ctx.restore();
}

export function drawPortrait(ctx: CanvasRenderingContext2D, appearance: Appearance | { body: string; hair: string; hat?: boolean }) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#16100d";
  ctx.fillRect(0, 0, 48, 48);
  if ("palette" in appearance) {
    drawPerson(ctx, 24, 46, {
      body: PALETTE[appearance.palette].cloth,
      hair: hairColor(appearance),
      hat: appearance.accessory === "hat",
      facing: 1,
      frame: 0,
      walking: false,
      appearance,
    });
    return;
  }
  drawPerson(ctx, 24, 46, {
    body: appearance.body,
    hair: appearance.hair,
    hat: appearance.hat ?? false,
    facing: 1,
    frame: 0,
    walking: false,
    appearance: null,
  });
}
