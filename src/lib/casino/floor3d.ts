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
