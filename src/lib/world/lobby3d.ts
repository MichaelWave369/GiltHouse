/**
 * R9 optional Three.js casino promenade.
 * A VISUAL directory for the existing Gilt House casino UI, not a second casino
 * engine. These IDs must remain an explicit subset of the established portals.
 */
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
  return LOBBY_STATIONS.some((s) => s.view === view);
}

export function clampLobbyCamera(x: number, z: number): { x: number; z: number } {
  const safeX = Number.isFinite(x) ? x : 0;
  const safeZ = Number.isFinite(z) ? z : 7;
  return { x: Math.max(-7.4, Math.min(7.4, safeX)), z: Math.max(-6.4, Math.min(8.2, safeZ)) };
}

/**
 * R10 physical door proximity. The 3D camera can approach the north wall only
 * as far as z=-6.4, so an interaction band around the doorway is intentional.
 * A pure nearest-station selector lets both keyboard and pointer use identical
 * authorization checks. This is UI navigation, never a wager.
 */
export const LOBBY_DOOR_INTERACT_Z = -5.25;
export const LOBBY_DOOR_HALF_WIDTH = 1.48;

export function nearbyLobbyStation(x: number, z: number): LobbyStation | null {
  if (!Number.isFinite(x) || !Number.isFinite(z) || z > LOBBY_DOOR_INTERACT_Z) return null;
  let nearest: LobbyStation | null = null;
  let distance = Infinity;
  for (const station of LOBBY_STATIONS) {
    const dx = Math.abs(station.x - x);
    if (dx <= LOBBY_DOOR_HALF_WIDTH && dx < distance) {
      nearest = station;
      distance = dx;
    }
  }
  return nearest;
}

export function canEnterLobbyPortal(view: string, x: number, z: number): boolean {
  return validLobbyStation(view) && nearbyLobbyStation(x, z)?.view === view;
}

/**
 * R17: deterministic, browser-local promenade collision.
 * Model the ORIGINAL R9 scene objects, rather than inventing walls/props.
 * Pillars match x=±7.9 and z=-7,-2,3,8; brass queue posts match
 * x=±4.7 and z=0,4,7. The narrow carpet seams are NOT obstacles.
 * Margins add a modest 0.34 m player radius to visible object dimensions.
 */
export const LOBBY_COLLISION_RADIUS = 0.34;
export const LOBBY_MAX_FRAME_MOVE = 0.8;
const LOBBY_SWEEP_STEP = 0.07;

export function collidesLobby3DObstacle(x: number, z: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return true;
  for (const px of [-7.9, 7.9]) {
    for (const pz of [-7, -2, 3, 8]) {
      if (Math.abs(x - px) < 0.29 + LOBBY_COLLISION_RADIUS &&
          Math.abs(z - pz) < 0.31 + LOBBY_COLLISION_RADIUS) return true;
    }
  }
  for (const px of [-4.7, 4.7]) {
    for (const pz of [0, 4, 7]) {
      if (Math.abs(x - px) < 0.0425 + LOBBY_COLLISION_RADIUS &&
          Math.abs(z - pz) < 0.0425 + LOBBY_COLLISION_RADIUS) return true;
    }
  }
  return false;
}

/**
 * Substepped, axis-separated slide collision. A stalled frame cannot
 * teleport the camera through a post; if one axis is blocked the other
 * remains free. Movement remains bounded by the original R9 room edges.
 */
export function advanceLobby3DCamera(
  x: number, z: number, deltaX: number, deltaZ: number,
): { x: number; z: number } {
  const start = clampLobbyCamera(x, z);
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaZ) ||
      collidesLobby3DObstacle(start.x, start.z)) return start;
  const distance = Math.hypot(deltaX, deltaZ);
  if (distance <= 0) return start;
  const travel = Math.min(distance, LOBBY_MAX_FRAME_MOVE);
  const steps = Math.max(1, Math.ceil(travel / LOBBY_SWEEP_STEP));
  const stepX = deltaX / distance * travel / steps;
  const stepZ = deltaZ / distance * travel / steps;

  let cx = start.x;
  let cz = start.z;
  for (let i = 0; i < steps; i++) {
    const nextX = clampLobbyCamera(cx + stepX, cz).x;
    if (!collidesLobby3DObstacle(nextX, cz)) cx = nextX;
    const nextZ = clampLobbyCamera(cx, cz + stepZ).z;
    if (!collidesLobby3DObstacle(cx, nextZ)) cz = nextZ;
  }
  return { x: cx, z: cz };
}

/**
 * R18: ephemeral route provenance, not an account privilege. The only
 * authorized automatic 3D floor entrance comes from the *already-open*
 * Gilt House Three.js lobby. The classic 2D floor remains the default.
 */
export type Lobby3DTransferContext = Readonly<{
  scene: string;
  mode: string;
  panel: string;
  hasTalk: boolean;
  hasArcade: boolean;
}>;

export function canStart3DFloorFromLobby(context: Lobby3DTransferContext): boolean {
  return context.scene === LOBBY3D_SCENE &&
    context.mode === "street" && context.panel === "lobby-3d" &&
    !context.hasTalk && !context.hasArcade;
}

export function canReturnTo3DLobby(
  context: Lobby3DTransferContext,
  enteredFrom3DLobby: boolean,
): boolean {
  return enteredFrom3DLobby && context.scene === LOBBY3D_SCENE &&
    context.mode === "casino" && context.panel === "none" &&
    !context.hasTalk && !context.hasArcade;
}
