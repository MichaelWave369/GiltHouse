import { FACADES, HOTSPOTS, LOCATIONS, NPCS, VIEW_H, VIEW_W, WORLD_W } from "./content.ts";
import { npcX } from "./logic.ts";
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

function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
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
  if (world.scene === "neon-block") drawStreet(ctx, world, cam, opts);
  else drawInterior(ctx, world, cam, opts);
  const pulse = opts.reduced ? 0.18 : 0.28 + Math.sin(opts.time * 2) * 0.05;
  ctx.fillStyle = `rgba(0,0,0,${pulse})`;
  ctx.fillRect(0, 0, VIEW_W, 10);
  ctx.fillRect(0, VIEW_H - 8, VIEW_W, 8);
}

function drawStreet(ctx: CanvasRenderingContext2D, world: WorldState, cam: number, opts: DrawOpts) {
  for (let i = 0; i < 8; i++) {
    const shade = 10 + i * 3;
    rect(ctx, 0, i * 8, VIEW_W, 8, `rgb(${shade + 8},${shade},${shade + 14})`);
  }
  rect(ctx, 250, 18, 22, 22, "#f4e7c4");
  rect(ctx, 256, 24, 10, 10, "#f7f1df");
  for (let i = 0; i < 28; i++) {
    const sx = (i * 97) % VIEW_W;
    const sy = (i * 53) % 70;
    if (hash(i + 3) > 0.4) rect(ctx, sx, sy, 1, 1, "#f7edd6");
  }
  const skyCam = cam * 0.35;
  for (let i = 0; i < 18; i++) {
    const h = 18 + (i % 5) * 8;
    const x = i * 78 - (skyCam % 78);
    rect(ctx, x, 78 - h, 46, h, i % 2 === 0 ? "#1a1420" : "#241820");
    rect(ctx, x + 4, 78 - h + 4, 6, 3, hash(i) > 0.5 ? AMBER : "#3a2a22");
  }
  rect(ctx, 0, 132, VIEW_W, 26, WALK);
  rect(ctx, 0, 156, VIEW_W, 4, "#4a4038");
  rect(ctx, 0, 160, VIEW_W, 20, ASPHALT);
  const dashOffset = opts.reduced ? 0 : (opts.time * 28) % 20;
  for (let x = -dashOffset; x < VIEW_W; x += 20) rect(ctx, x, 168, 8, 2, "#6a6258");

  for (const facade of FACADES) {
    drawFacade(ctx, facade.x - cam, facade, opts.time, opts.reduced, Boolean(world.flags[`sign:${facade.id}`] || (facade.id === "diner" && world.flags["sign:diner"]) || (facade.id === "gilt" && world.flags["sign:gilt"]) || (facade.id === "mirage" && world.flags["sign:mirage"])));
  }

  for (const hot of HOTSPOTS) {
    if (hot.scene !== "neon-block" || hot.kind !== "sign") continue;
    const read = Boolean(world.flags[hot.id]);
    const flicker = opts.reduced || read ? 1 : Math.sin(opts.time * 9 + hot.x) > -0.2 ? 1 : 0.25;
    rect(ctx, hot.x - cam - 10, 108, 20, 6, read ? GOLD : PINK);
    ctx.globalAlpha = flicker;
    rect(ctx, hot.x - cam - 8, 109, 4, 4, CREAM);
    rect(ctx, hot.x - cam - 1, 109, 4, 4, CREAM);
    rect(ctx, hot.x - cam + 6, 109, 4, 4, CREAM);
    ctx.globalAlpha = 1;
  }

  const actors = NPCS.filter((npc) => npc.scene === "neon-block")
    .map((npc) => ({ npc, x: npcX(npc.id, world.worldTime, npc.x, npc.wander) }))
    .sort((a, b) => a.x - b.x);
  for (const actor of actors) {
    drawPerson(ctx, actor.x - cam, 158, {
      body: actor.npc.body,
      hair: actor.npc.hair,
      hat: actor.npc.hat ?? false,
      facing: 1,
      frame: opts.reduced ? 0 : Math.floor(opts.time * 2 + actor.npc.x) % 4,
      walking: Boolean(actor.npc.wander) && !opts.reduced,
      appearance: null,
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
  });

  if (!opts.reduced) {
    for (let i = 0; i < 4; i++) {
      const speed = 36 + i * 14;
      const span = WORLD_W + 80;
      const x = ((opts.time * speed + i * 520) % span) - 40 - cam;
      drawCar(ctx, x, 164, i % 2 === 0 ? OXBLOOD : "#1c3f4a");
    }
  }
  const objX = objectiveMarkerX(world);
  if (objX != null && world.scene === "neon-block") {
    const bob = opts.reduced ? 0 : Math.sin(opts.time * 4) * 2;
    rect(ctx, objX - cam - 2, 96 + bob, 4, 4, GOLD);
  }
}

function objectiveMarkerX(world: WorldState): number | null {
  if (world.quests["q-welcome"]?.status === "active") return 150;
  if (world.quests["q-flicker"]?.status === "active") {
    const id = !world.flags["sign:diner"] ? "sign:diner" : !world.flags["sign:gilt"] ? "sign:gilt" : "sign:mirage";
    return HOTSPOTS.find((hot) => hot.id === id)?.x ?? null;
  }
  return null;
}

function drawFacade(
  ctx: CanvasRenderingContext2D,
  x: number,
  facade: (typeof FACADES)[number],
  time: number,
  reduced: boolean,
  steady: boolean,
) {
  if (x > VIEW_W || x + facade.w < 0) return;
  const base = 150;
  const h = facade.theme === "gilt" || facade.theme === "mirage" ? 96 : facade.theme === "gate" ? 70 : 78;
  const top = base - h;
  const wall =
    facade.theme === "diner"
      ? "#6e2430"
      : facade.theme === "velvet"
        ? "#4a2038"
        : facade.theme === "gilt"
          ? "#3a1420"
          : facade.theme === "records"
            ? "#1c3338"
            : facade.theme === "arcade"
              ? "#241428"
              : facade.theme === "books"
                ? "#3a2a18"
                : facade.theme === "pawn"
                  ? "#2c2a28"
                  : facade.theme === "comet"
                    ? "#4a2a12"
                    : facade.theme === "lastcall"
                      ? "#241833"
                      : facade.theme === "starlight"
                        ? "#3a2418"
                        : facade.theme === "mirage"
                          ? "#163430"
                          : "#2a241c";
  rect(ctx, x, top, facade.w, h, wall);
  rect(ctx, x, top, facade.w, 4, facade.neon);
  if (facade.theme === "gilt" || facade.theme === "mirage" || facade.theme === "starlight") {
    rect(ctx, x + facade.w / 2 - 8, top - 10, 16, 10, GOLD);
    rect(ctx, x + 8, top + 8, 4, h - 16, "#1a1010");
    rect(ctx, x + facade.w - 12, top + 8, 4, h - 16, "#1a1010");
  }
  const cols = Math.max(2, Math.floor((facade.w - 24) / 18));
  const rows = facade.theme === "mirage" || facade.theme === "gilt" ? 3 : 2;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const wx = x + 12 + col * 18;
      const wy = top + 12 + row * 16;
      const lit = hash(facade.x + col * 9 + row * 4) > 0.38;
      rect(ctx, wx, wy, 10, 12, lit ? "#f0d7a2" : "#140e12");
      if (lit) rect(ctx, wx + 4, wy, 2, 12, "rgba(255,255,255,0.25)");
    }
  }
  const doorX = x + facade.door - 8;
  rect(ctx, doorX, base - 28, 16, 28, "#140c0c");
  rect(ctx, doorX + 6, base - 16, 2, 2, GOLD);
  if (facade.theme === "diner") {
    rect(ctx, x + 16, base - 8, facade.w - 32, 4, "#f2f2f2");
    rect(ctx, x + 16, base - 6, 8, 2, OXBLOOD);
  }
  const flicker = reduced || steady ? 1 : 0.65 + Math.sin(time * 6 + facade.x) * 0.35;
  ctx.globalAlpha = Math.max(0.35, flicker);
  rect(ctx, x + 10, top + 6, Math.min(facade.w - 20, 72), 5, facade.neon);
  ctx.globalAlpha = 1;
  if (facade.theme === "arcade") {
    rect(ctx, x + 20, top + 28, 8, 8, PINK);
    rect(ctx, x + 32, top + 28, 8, 8, TEAL);
    rect(ctx, x + 44, top + 28, 8, 8, AMBER);
  }
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  rect(ctx, x, y, 36, 10, color);
  rect(ctx, x + 6, y - 6, 20, 6, "#d9c7a4");
  rect(ctx, x + 4, y + 8, 6, 4, "#111");
  rect(ctx, x + 26, y + 8, 6, 4, "#111");
  rect(ctx, x + 32, y + 2, 3, 2, "#f7edd6");
}

function drawInterior(ctx: CanvasRenderingContext2D, world: WorldState, cam: number, opts: DrawOpts) {
  const theme = LOCATIONS[world.scene].theme;
  const floor = theme === "diner" ? "#6a3030" : theme === "arcade" ? "#1a1024" : theme === "gilt" ? "#3a1818" : "#241810";
  const wall = theme === "records" ? "#142226" : theme === "books" ? "#3a2c1c" : theme === "mirage" ? "#10211e" : theme === "comet" ? "#3a2414" : "#2a1614";
  rect(ctx, 0, 0, VIEW_W, 96, wall);
  rect(ctx, 0, 96, VIEW_W, 84, floor);
  rect(ctx, 0, 96, VIEW_W, 3, GOLD);
  if (theme === "diner") {
    rect(ctx, 16, 108, 70, 28, "#8c2436");
    rect(ctx, 20, 112, 28, 16, "#f2e2c4");
    rect(ctx, 200, 70, 90, 26, "#1a1010");
    rect(ctx, 206, 86, 78, 8, "#c4554a");
  } else if (theme === "velvet") {
    for (let i = 0; i < 5; i++) rect(ctx, 150 + i * 16, 40, 12, 56, i % 2 ? "#6a2040" : "#3a1428");
    rect(ctx, 40, 36, 28, 48, "#d9cbb2");
  } else if (theme === "gilt") {
    rect(ctx, 0, 0, VIEW_W, 96, "#4a1822");
    rect(ctx, 20, 20, 8, 76, GOLD);
    rect(ctx, 200, 8, 70, 18, GOLD);
    rect(ctx, 210, 78, 28, 18, "#140c0c");
    rect(ctx, 360, 78, 28, 18, "#140c0c");
    rect(ctx, 430, 78, 28, 18, "#0f3d34");
  } else if (theme === "records") {
    for (let i = 0; i < 8; i++) rect(ctx, 24 + (i % 4) * 18, 40 + Math.floor(i / 4) * 20, 14, 14, i % 2 ? "#111" : "#1a3a3a");
    rect(ctx, 90, 78, 28, 16, "#222");
    rect(ctx, 96, 74, 16, 6, TEAL);
  } else if (theme === "arcade") {
    rect(ctx, 70, 78, 28, 36, PINK);
    rect(ctx, 120, 78, 28, 36, TEAL);
    rect(ctx, 78, 70, 12, 8, AMBER);
    rect(ctx, 128, 70, 12, 8, VIOLET);
  } else if (theme === "books") {
    for (let i = 0; i < 10; i++) rect(ctx, 30 + i * 8, 48, 6, 28, ["#8c2436", "#1f6f66", "#c6a15a", "#5c3d8a"][i % 4] ?? GOLD);
  } else if (theme === "pawn") {
    rect(ctx, 36, 70, 70, 26, "#1a1a1a");
    rect(ctx, 42, 76, 16, 10, GOLD);
    rect(ctx, 64, 78, 8, 8, PINK);
  } else if (theme === "comet") {
    rect(ctx, 40, 80, 64, 28, "#7a3e12");
    rect(ctx, 48, 74, 48, 8, AMBER);
  } else if (theme === "lastcall") {
    rect(ctx, 150, 78, 80, 16, "#1a1020");
    rect(ctx, 40, 30, 20, 30, VIOLET);
  } else if (theme === "starlight") {
    rect(ctx, 70, 88, 80, 8, "#5a4030");
    rect(ctx, 104, 60, 6, 28, GOLD);
    rect(ctx, 20, 24, 30, 16, CREAM);
  } else if (theme === "mirage") {
    rect(ctx, 150, 84, 100, 14, "#12312c");
    rect(ctx, 40, 28, 40, 24, "#d7c4a4");
    for (let i = 0; i < 6; i++) rect(ctx, 180 + i * 10, 30, 6, 16, i % 2 ? GOLD : "#0e2420");
  }
  rect(ctx, 8 - cam, 104, 18, 36, "#140c0c");
  rect(ctx, 248 - cam, 100, 64, 18, "#1a120e");

  for (const npc of NPCS) {
    if (npc.scene !== world.scene) continue;
    drawPerson(ctx, npc.x - cam, sceneFeet(world.scene), {
      body: npc.body,
      hair: npc.hair,
      hat: npc.hat ?? false,
      facing: -1,
      frame: 0,
      walking: false,
      appearance: null,
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
  });
}

function sceneFeet(scene: SceneId): number {
  return scene === "neon-block" ? 158 : 150;
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
};

function drawPerson(ctx: CanvasRenderingContext2D, x: number, feet: number, person: PersonOpts) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(feet));
  ctx.scale(person.facing, 1);
  const bob = person.walking ? (person.frame % 2 === 0 ? -1 : 0) : 0;
  ctx.translate(0, bob);
  rect(ctx, -5, -2, 10, 3, "rgba(0,0,0,0.35)");
  const leg = person.walking ? (person.frame % 2 === 0 ? 2 : -2) : 0;
  const shoe = person.appearance?.shoes === "two-tone" ? CREAM : "#16120f";
  rect(ctx, -4, -10, 3, 8 + (leg > 0 ? 0 : 0), "#2a241c");
  rect(ctx, 1, -10, 3, 8, "#2a241c");
  rect(ctx, -5, -4 + leg, 4, 3, shoe);
  rect(ctx, 1, -4 - leg, 4, 3, shoe);
  if (person.appearance?.shoes === "two-tone") {
    rect(ctx, -5, -3 + leg, 4, 1, "#16120f");
    rect(ctx, 1, -3 - leg, 4, 1, "#16120f");
  }
  const cloth = person.appearance ? PALETTE[person.appearance.palette].cloth : person.body;
  if (person.appearance?.outfit === "dress") {
    rect(ctx, -5, -22, 10, 14, cloth);
    rect(ctx, -6, -14, 12, 6, cloth);
  } else {
    rect(ctx, -5, -20, 10, 11, cloth);
    if (person.appearance?.outfit === "suit") rect(ctx, -5, -20, 2, 11, "#1a120e");
  }
  const jacket = person.appearance?.jacket;
  if (jacket && jacket !== "none") {
    const color = jacket === "leather" ? "#2a211c" : jacket === "champagne" ? "#d7c08a" : TEAL;
    rect(ctx, -6, -21, 12, 10, color);
    rect(ctx, -6, -16, 2, 6, color);
    rect(ctx, 4, -16, 2, 6, color);
  }
  rect(ctx, -3, -28, 6, 8, SKIN);
  rect(ctx, -3, -22, 6, 2, SKIN_SHADOW);
  const hair = person.appearance ? hairColor(person.appearance) : person.hair;
  const style = person.appearance?.hair ?? "wave";
  if (style === "crop") rect(ctx, -4, -31, 8, 4, hair);
  else if (style === "bun") {
    rect(ctx, -4, -31, 8, 4, hair);
    rect(ctx, -2, -35, 5, 4, hair);
  } else if (style === "spike") {
    rect(ctx, -4, -31, 8, 3, hair);
    rect(ctx, -1, -36, 2, 5, hair);
    rect(ctx, 2, -34, 2, 3, hair);
  } else {
    rect(ctx, -4, -32, 8, 5, hair);
    rect(ctx, 2, -28, 3, 6, hair);
  }
  if (person.hat || person.appearance?.accessory === "hat") {
    rect(ctx, -5, -33, 10, 2, "#1a120e");
    rect(ctx, -3, -36, 6, 3, "#1a120e");
  }
  if (person.appearance?.accessory === "shades") rect(ctx, -3, -26, 6, 2, "#111");
  if (person.appearance?.accessory === "earring") rect(ctx, 3, -24, 1, 2, PINK);
  if (person.appearance?.pin) rect(ctx, 1, -18, 2, 2, GOLD);
  rect(ctx, -7, -18, 2, 6, SKIN);
  rect(ctx, 5, -18, 2, 6, SKIN);
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
