/**
 * R16: read-only guidance arrival state for the optional Three.js casino.
 * Arrival uses the EXACT existing R11 interaction guard. A map destination
 * grants no ability to enter a remote, closed or cash-bearing system.
 */
import {
  canOpenFloor3DTable,
  FLOOR3D_STATIONS,
  type Floor3DPose,
  type FloorGame,
} from "./floor3d.ts";
import { floor3DTarget, type FloorPoint } from "./floor3d-nav.ts";

export type Floor3DArrival = Readonly<{
  game: FloorGame;
  label: string;
  destination: FloorPoint;
  distance: number;
  canEnter: boolean;
}>;

export function floor3DArrival(
  pose: Floor3DPose,
  game: string | null,
): Floor3DArrival | null {
  if (game === null || !Number.isFinite(pose.x) ||
      !Number.isFinite(pose.z) || !Number.isFinite(pose.yaw)) return null;
  const station = FLOOR3D_STATIONS.find((s) => s.game === game);
  const destination = floor3DTarget(game);
  if (!station || !destination) return null;
  return {
    game: station.game,
    label: station.name,
    destination,
    distance: Math.hypot(pose.x - destination.x, pose.z - destination.z),
    canEnter: canOpenFloor3DTable(game, pose.x, pose.z),
  };
}
