import test from "node:test";
import assert from "node:assert/strict";
import {
  FLOOR3D_STATIONS, FLOOR3D_SPAWN, collidesFloor3DTable, type Floor3DPose,
} from "./floor3d.ts";
import { findFloor3DRoute, type FloorRoute } from "./floor3d-nav.ts";
import { sampleFloor3DGuide, FLOOR_GUIDE_SPACING, FLOOR_GUIDE_MAX_MARKERS } from "./floor3d-guide.ts";

test("R15 glowing trail samples all eight real routes without entering solid tables", () => {
  const camera = { ...FLOOR3D_SPAWN, yaw: 0 };
  for (const station of FLOOR3D_STATIONS) {
    const route = findFloor3DRoute(camera, station.game);
    assert.ok(route, station.id);
    const markers = sampleFloor3DGuide(route);
    assert.ok(markers.length > 0 && markers.length <= FLOOR_GUIDE_MAX_MARKERS, station.id);
    assert.deepEqual(Object.keys(markers[0]).sort(), ["x", "yaw", "z"]);
    const path = route.points;
    for (const marker of markers) {
      assert.ok(Number.isFinite(marker.x) && Number.isFinite(marker.z) && Number.isFinite(marker.yaw));
      assert.equal(collidesFloor3DTable(marker.x, marker.z), false, station.id);
      const along = path.slice(1).some((next, i) => {
        const from = path[i];
        const dx = next.x - from.x;
        const dz = next.z - from.z;
        const lengthSquared = dx * dx + dz * dz;
        if (lengthSquared < 1e-10) return false;
        const t = Math.max(0, Math.min(1, ((marker.x - from.x) * dx + (marker.z - from.z) * dz) / lengthSquared));
        const px = from.x + dx * t;
        const pz = from.z + dz * t;
        return Math.hypot(marker.x - px, marker.z - pz) < 1e-5;
      });
      assert.ok(along, `${station.id}: guide marker wandered away from the verified R14 route`);
    }
  }
});

test("R15 route sample is deterministic, capped, and preserves original route", () => {
  const start: Floor3DPose = { ...FLOOR3D_SPAWN, yaw: 0 };
  const route = findFloor3DRoute(start, "blackjack");
  assert.ok(route);
  const copy = structuredClone(route);
  const a = sampleFloor3DGuide(route);
  const b = sampleFloor3DGuide(route);
  assert.deepEqual(a, b);
  assert.deepEqual(route, copy, "rendering a trail must never mutate the route");
  assert.ok(FLOOR_GUIDE_SPACING >= 0.5);
  const long: FloorRoute = {
    ...route, meters: 99999,
    points: [{ x: 0, z: 11 }, { x: 0, z: -11 }],
  };
  assert.equal(sampleFloor3DGuide(long).length, 30, "markers are bounded by geometric line length, not false metadata");
  assert.deepEqual(sampleFloor3DGuide(null), []);
  assert.deepEqual(sampleFloor3DGuide({ ...route, meters: Infinity }), []);
  const malicious: FloorRoute = {
    ...route, meters: 2,
    points: [{ x: -3, z: 6 }, { x: -5, z: 6 }],
  };
  assert.deepEqual(sampleFloor3DGuide(malicious), [],
    "reject 3D guide segments that enter solid table collision footprints");
});

test("R15 guide includes no economy or player-control instructions", () => {
  const route = findFloor3DRoute({ ...FLOOR3D_SPAWN, yaw: 0 }, "roulette");
  assert.ok(route);
  const marker = sampleFloor3DGuide(route)[0];
  assert.ok(marker);
  for (const field of ["chips", "bank", "bet", "wager", "move", "authorization", "agent"]) {
    assert.equal(field in marker, false);
  }
});
