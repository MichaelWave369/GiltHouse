/**
 * R15: read-only marker positions for a Three.js walking guide.
 * Derived exclusively from R14 wayfinding, never from game/chip state.
 * Does not control the camera, teleport, auto-enter games or persist data.
 */
import { collidesFloor3DTable } from "./floor3d.ts";
import type { FloorRoute } from "./floor3d-nav.ts";

export type FloorGuideMarker = Readonly<{ x: number; z: number; yaw: number }>;
export const FLOOR_GUIDE_SPACING = 0.72;
export const FLOOR_GUIDE_MAX_MARKERS = 72;

export function sampleFloor3DGuide(route: FloorRoute | null): readonly FloorGuideMarker[] {
  if (!route || route.points.length < 2 || !Number.isFinite(route.meters) || route.meters <= 0) return [];

  const markers: FloorGuideMarker[] = [];
  let travelled = 0;
  let nextDistance = FLOOR_GUIDE_SPACING;

  for (let i = 1; i < route.points.length && markers.length < FLOOR_GUIDE_MAX_MARKERS; i++) {
    const from = route.points[i - 1];
    const to = route.points[i];
    if (![from.x, from.z, to.x, to.z].every(Number.isFinite)) return [];
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = Math.hypot(dx, dz);
    if (length < 0.0001) continue;

    // Route geometry and marker orientation agree with R11 camera yaw:
    // zero means looking toward negative Z, positive turns toward positive X.
    const yaw = Math.atan2(dx, -dz);
    while (nextDistance <= travelled + length + 1e-8 &&
           nextDistance < route.meters - 0.08 &&
           markers.length < FLOOR_GUIDE_MAX_MARKERS) {
      const t = Math.min(1, Math.max(0, (nextDistance - travelled) / length));
      const x = from.x + dx * t;
      const z = from.z + dz * t;
      if (collidesFloor3DTable(x, z)) return [];
      markers.push({ x, z, yaw });
      nextDistance += FLOOR_GUIDE_SPACING;
    }
    travelled += length;
  }
  return markers;
}
