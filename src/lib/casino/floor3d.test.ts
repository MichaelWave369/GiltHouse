import test from "node:test";
import assert from "node:assert/strict";
import {
  canOpenFloor3DTable,
  clampFloor3DCamera,
  FLOOR3D_INTERACT_R,
  FLOOR3D_SPAWN,
  FLOOR3D_STATIONS,
  nearestFloor3DTable,
  validFloor3DGame,
  normalizeFloor3DPose,
  FLOOR3D_START_POSE,
  FLOOR3D_MAX_YAW,
} from "./floor3d.ts";

test("Eight original 3D tables map only to existing Gilt House games", () => {
  assert.deepEqual(FLOOR3D_STATIONS.map((s) => s.game), [
    "blackjack", "roulette", "craps", "baccarat",
    "poker", "slots", "keno", "afterhours",
  ]);
  assert.equal(new Set(FLOOR3D_STATIONS.map((s) => s.game)).size, FLOOR3D_STATIONS.length);
  assert.equal(new Set(FLOOR3D_STATIONS.map((s) => s.id)).size, FLOOR3D_STATIONS.length);
  assert.ok(FLOOR3D_STATIONS.every((s) => validFloor3DGame(s.game)));
  for (const invalid of ["floor", "sports", "training", "agents", "wager", "cashout", "", "roulette;hack"]) {
    assert.equal(validFloor3DGame(invalid), false);
  }
});

test("3D table activation requires genuine position proximity", () => {
  assert.equal(nearestFloor3DTable(FLOOR3D_SPAWN.x, FLOOR3D_SPAWN.z), null);
  assert.equal(canOpenFloor3DTable("blackjack", FLOOR3D_SPAWN.x, FLOOR3D_SPAWN.z), false);
  for (const table of FLOOR3D_STATIONS) {
    assert.equal(nearestFloor3DTable(table.x, table.z)?.game, table.game);
    assert.equal(canOpenFloor3DTable(table.game, table.x, table.z), true);
    assert.equal(canOpenFloor3DTable(table.game, 0, 0), false);
    assert.equal(canOpenFloor3DTable(table.game, table.x + FLOOR3D_INTERACT_R + 0.2, table.z), false);
    for (const other of FLOOR3D_STATIONS) {
      if (other.game !== table.game) {
        assert.equal(canOpenFloor3DTable(other.game, table.x, table.z), false);
      }
    }
  }
  assert.equal(canOpenFloor3DTable("wager", -5, 6), false);
  assert.equal(nearestFloor3DTable(Number.NaN, 0), null);
  assert.equal(nearestFloor3DTable(0, Infinity), null);
});

test("Showroom camera bounds are finite and do not affect game balances", () => {
  assert.deepEqual(clampFloor3DCamera(0, 10.5), FLOOR3D_SPAWN);
  assert.deepEqual(clampFloor3DCamera(500, -200), { x: 8, z: -11.8 });
  assert.deepEqual(clampFloor3DCamera(-100, 100), { x: -8, z: 11.5 });
  assert.deepEqual(clampFloor3DCamera(NaN, Infinity), FLOOR3D_SPAWN);
  // Only coordinates and navigation IDs, no gameplay, economic or authority fields.
  const keys = Object.keys(FLOOR3D_STATIONS[0]).sort();
  assert.deepEqual(keys, ["color", "game", "hint", "id", "name", "shape", "x", "z"]);
});

test("R12 showroom return pose stays bounded, deterministic and independent of chips", () => {
  assert.deepEqual(normalizeFloor3DPose(null), FLOOR3D_START_POSE);
  assert.deepEqual(normalizeFloor3DPose(undefined), FLOOR3D_START_POSE);
  const position = { x: 5, z: -4, yaw: 0.65 };
  const copy = structuredClone(position);
  assert.deepEqual(normalizeFloor3DPose(position), copy);
  assert.deepEqual(position, copy);
  assert.deepEqual(normalizeFloor3DPose({ x: 999, z: -999, yaw: Infinity }),
    { x: 8, z: -11.8, yaw: 0 });
  assert.deepEqual(normalizeFloor3DPose({ x: NaN, z: NaN, yaw: -999 }),
    { x: FLOOR3D_START_POSE.x, z: FLOOR3D_START_POSE.z, yaw: -FLOOR3D_MAX_YAW });
  assert.deepEqual(normalizeFloor3DPose({ x: -7, z: 11, yaw: 999 }),
    { x: -7, z: 11, yaw: FLOOR3D_MAX_YAW });
  assert.deepEqual(Object.keys(normalizeFloor3DPose(position)).sort(), ["x", "yaw", "z"]);
  assert.equal("bank" in normalizeFloor3DPose(position), false);
  assert.equal("chips" in normalizeFloor3DPose(position), false);
});
