/**
 * R11: fixed, presentation-only casino table catalogue.
 * Gameplay remains in the original Gilt House casino components.
 * A 3D table has no authority to place a wager or update chips.
 */
import type { View } from "./store.ts";

export type FloorGame = Extract<View,
  "blackjack" | "roulette" | "craps" | "baccarat" |
  "poker" | "slots" | "keno" | "afterhours">;

export type FloorStation = Readonly<{
  id: string;
  game: FloorGame;
  name: string;
  hint: string;
  x: number;
  z: number;
  color: number;
  shape: "cards" | "wheel" | "rail" | "reels" | "cage";
}>;

export const FLOOR3D_STATIONS: readonly FloorStation[] = Object.freeze([
  { id: "shoe", game: "blackjack", name: "THE SHOE", hint: "Blackjack · six decks", x: -5, z: 6, color: 0xe9c267, shape: "cards" },
  { id: "wheel", game: "roulette", name: "THE WHEEL", hint: "Roulette · single zero", x: 5, z: 6, color: 0xe29a65, shape: "wheel" },
  { id: "rail", game: "craps", name: "THE RAIL", hint: "Craps · pass line", x: -5, z: 1, color: 0x68cec3, shape: "rail" },
  { id: "salon", game: "baccarat", name: "THE SALON", hint: "Baccarat · punto banco", x: 5, z: 1, color: 0xd6aacb, shape: "cards" },
  { id: "draw", game: "poker", name: "THE DRAW", hint: "Draw poker · jacks or better", x: -5, z: -4, color: 0xffb36d, shape: "cards" },
  { id: "vesper", game: "slots", name: "VESPER REELS", hint: "Slot reels · entertainment only", x: 5, z: -4, color: 0x9a9dff, shape: "reels" },
  { id: "cage", game: "keno", name: "THE CAGE", hint: "Keno · number picks", x: -5, z: -9, color: 0xf0d78c, shape: "cage" },
  { id: "hours", game: "afterhours", name: "AFTER HOURS", hint: "Three-reel bonus room", x: 5, z: -9, color: 0xff77a7, shape: "reels" },
]);

export const FLOOR3D_SPAWN = Object.freeze({ x: 0, z: 10.5 });
export const FLOOR3D_INTERACT_R = 2.7;

export function validFloor3DGame(game: string): game is FloorGame {
  return FLOOR3D_STATIONS.some((s) => s.game === game);
}

export function clampFloor3DCamera(x: number, z: number): { x: number; z: number } {
  return {
    x: Number.isFinite(x) ? Math.max(-8, Math.min(8, x)) : FLOOR3D_SPAWN.x,
    z: Number.isFinite(z) ? Math.max(-11.8, Math.min(11.5, z)) : FLOOR3D_SPAWN.z,
  };
}

export function nearestFloor3DTable(x: number, z: number): FloorStation | null {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  let closest: FloorStation | null = null;
  let distanceSquared = FLOOR3D_INTERACT_R ** 2;
  for (const s of FLOOR3D_STATIONS) {
    const d = (x - s.x) ** 2 + (z - s.z) ** 2;
    if (d <= distanceSquared) {
      distanceSquared = d;
      closest = s;
    }
  }
  return closest;
}

export function canOpenFloor3DTable(game: string, x: number, z: number): boolean {
  return validFloor3DGame(game) && nearestFloor3DTable(x, z)?.game === game;
}

/**
 * R12 ephemeral showroom camera handoff. This object is held only in
 * CasinoApp React memory while travelling to/from a game table.
 * It is never stored in the casino, world or browser save.
 */
export type Floor3DPose = Readonly<{ x: number; z: number; yaw: number }>;
export const FLOOR3D_START_POSE: Floor3DPose =
  Object.freeze({ x: FLOOR3D_SPAWN.x, z: FLOOR3D_SPAWN.z, yaw: 0 });
export const FLOOR3D_MAX_YAW = 1.4;

export function normalizeFloor3DPose(pose: Floor3DPose | null | undefined): Floor3DPose {
  if (!pose) return { ...FLOOR3D_START_POSE };
  const pos = clampFloor3DCamera(pose.x, pose.z);
  return {
    ...pos,
    yaw: Number.isFinite(pose.yaw)
      ? Math.max(-FLOOR3D_MAX_YAW, Math.min(FLOOR3D_MAX_YAW, pose.yaw))
      : 0,
  };
}

/**
 * R13: walkable floor physics. Each decorative table is a real 3.0m x
 * 2.15m solid platform. The extra margin is the visitor's approximate
 * body radius, so the camera cannot clip its felt surface or brass rails.
 * AABB collision is deliberately simple, deterministic and browser-local.
 */
export const FLOOR3D_TABLE_CLEARANCE_X = 1.88;
export const FLOOR3D_TABLE_CLEARANCE_Z = 1.46;
export const FLOOR3D_MAX_FRAME_MOVE = 0.4;
const FLOOR3D_SWEEP_STEP = 0.08;
const COLLISION_EPS = 0.02;

export function collidesFloor3DTable(x: number, z: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return true;
  return FLOOR3D_STATIONS.some((table) =>
    Math.abs(x - table.x) < FLOOR3D_TABLE_CLEARANCE_X &&
    Math.abs(z - table.z) < FLOOR3D_TABLE_CLEARANCE_Z);
}

/**
 * Per-frame swept movement with wall clamping and axis-separated sliding.
 * Even if a caller requests a giant delta, bounded substeps never teleport
 * across a table. Diagonal normalization occurs at the input layer.
 */
export function advanceFloor3DCamera(
  x: number, z: number, deltaX: number, deltaZ: number,
): { x: number; z: number } {
  const start = clampFloor3DCamera(x, z);
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaZ)) return start;
  if (collidesFloor3DTable(start.x, start.z)) return start;

  const distance = Math.hypot(deltaX, deltaZ);
  if (distance === 0) return start;
  const allowed = Math.min(distance, FLOOR3D_MAX_FRAME_MOVE);
  const steps = Math.ceil(allowed / FLOOR3D_SWEEP_STEP);
  const stepX = deltaX / distance * allowed / steps;
  const stepZ = deltaZ / distance * allowed / steps;

  let cx = start.x;
  let cz = start.z;
  for (let i = 0; i < steps; i++) {
    const targetX = clampFloor3DCamera(cx + stepX, cz).x;
    if (!collidesFloor3DTable(targetX, cz)) cx = targetX;

    const targetZ = clampFloor3DCamera(cx, cz + stepZ).z;
    if (!collidesFloor3DTable(cx, targetZ)) cz = targetZ;
  }
  return { x: cx, z: cz };
}

/**
 * R12 previously allowed returning from anywhere inside a decorative
 * tabletop. Preserve normal poses exactly; sanitize any legacy/interior
 * pose to the nearest clear aisle edge before starting the 3D renderer.
 */
export function safeFloor3DReturnPose(pose: Floor3DPose | null): Floor3DPose {
  const restored = normalizeFloor3DPose(pose);
  if (!collidesFloor3DTable(restored.x, restored.z)) return restored;

  const candidates: { x: number; z: number }[] = [];
  for (const table of FLOOR3D_STATIONS) {
    if (Math.abs(restored.x - table.x) >= FLOOR3D_TABLE_CLEARANCE_X ||
        Math.abs(restored.z - table.z) >= FLOOR3D_TABLE_CLEARANCE_Z) continue;
    candidates.push(
      { x: table.x - FLOOR3D_TABLE_CLEARANCE_X - COLLISION_EPS, z: restored.z },
      { x: table.x + FLOOR3D_TABLE_CLEARANCE_X + COLLISION_EPS, z: restored.z },
      { x: restored.x, z: table.z - FLOOR3D_TABLE_CLEARANCE_Z - COLLISION_EPS },
      { x: restored.x, z: table.z + FLOOR3D_TABLE_CLEARANCE_Z + COLLISION_EPS },
    );
  }
  candidates.sort((a, b) =>
    (a.x - restored.x) ** 2 + (a.z - restored.z) ** 2 -
    ((b.x - restored.x) ** 2 + (b.z - restored.z) ** 2));
  for (const candidate of candidates) {
    const bounded = clampFloor3DCamera(candidate.x, candidate.z);
    if (!collidesFloor3DTable(bounded.x, bounded.z)) return { ...bounded, yaw: restored.yaw };
  }
  return { ...FLOOR3D_START_POSE, yaw: restored.yaw };
}
