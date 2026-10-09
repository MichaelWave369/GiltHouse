/**
 * R9 optional Three.js casino promenade.
 * A VISUAL directory for the existing Gilt House casino UI, not a second casino
 * engine. These IDs must remain an explicit subset of the established portals.
 */
import { PORTALS } from "./content.ts";
import type { CasinoDoor } from "./types.ts";

export type LobbyStation = Readonly<{
  id: string;
  view: CasinoDoor;
  name: string;
  subtitle: string;
  x: number;
  color: number;
}>;

export const LOBBY_STATIONS: readonly LobbyStation[] = Object.freeze([
  { id: "gaming", view: "floor", name: "THE FLOOR", subtitle: "The casino games", x: -5.4, color: 0xe6c36a },
  { id: "pit", view: "workshop", name: "THE PIT", subtitle: "Probability workshop", x: -1.8, color: 0x66cabf },
  { id: "lab", view: "training", name: "TRAINING LAB", subtitle: "Practice with receipts", x: 1.8, color: 0xffa775 },
  { id: "arena", view: "agents", name: "THE AGENTS", subtitle: "Scripted sports arena", x: 5.4, color: 0xb8a0ff },
]);

export const LOBBY3D_SCENE = "gilt-lobby";
export const LOBBY3D_PANEL = "lobby-3d";

export function isLobby3DScene(scene: string): boolean {
  return scene === LOBBY3D_SCENE;
}

export function validLobbyStation(view: string): view is CasinoDoor {
  return LOBBY_STATIONS.some((s) => s.view === view) &&
    PORTALS.some((p) => p.scene === LOBBY3D_SCENE && p.casino === view);
}

export function clampLobbyCamera(x: number, z: number): { x: number; z: number } {
  const safeX = Number.isFinite(x) ? x : 0;
  const safeZ = Number.isFinite(z) ? z : 7;
  return { x: Math.max(-7.4, Math.min(7.4, safeX)), z: Math.max(-6.4, Math.min(8.2, safeZ)) };
}
