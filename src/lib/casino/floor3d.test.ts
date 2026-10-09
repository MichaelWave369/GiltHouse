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
  FLOOR3D_TABLE_CLEARANCE_X,
  FLOOR3D_TABLE_CLEARANCE_Z,
  FLOOR3D_MAX_FRAME_MOVE,
  collidesFloor3DTable,
  advanceFloor3DCamera,
  safeFloor3DReturnPose,
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

test("R13 solid felt footprint includes visitor radius, with usable interaction lanes", () => {
  assert.ok(FLOOR3D_TABLE_CLEARANCE_X > 1.5);
  assert.ok(FLOOR3D_TABLE_CLEARANCE_Z > 1.075);
  assert.equal(collidesFloor3DTable(0, 10.5), false);
  assert.equal(collidesFloor3DTable(0, 0), false, "the central aisle must be clear");
  for (const station of FLOOR3D_STATIONS) {
    assert.equal(collidesFloor3DTable(station.x, station.z), true, station.id);
    assert.equal(collidesFloor3DTable(station.x + 1.2, station.z), true);
    assert.equal(collidesFloor3DTable(station.x, station.z + 0.8), true);
    const aisleX = station.x < 0 ? -3 : 3;
    assert.equal(collidesFloor3DTable(aisleX, station.z), false,
      `${station.id}: the aisle side must remain walkable`);
    assert.equal(canOpenFloor3DTable(station.game, aisleX, station.z), true,
      `${station.id}: player must still be able to enter the game`);
  }
  assert.equal(collidesFloor3DTable(Infinity, 6), true);
  assert.equal(collidesFloor3DTable(NaN, NaN), true);
});

test("R13 swept movement never tunnels through table rails even for giant deltas", () => {
  let pos = { x: -3, z: 6 };
  for (let i = 0; i < 100; i++) {
    pos = advanceFloor3DCamera(pos.x, pos.z, -1000, 0);
    assert.equal(collidesFloor3DTable(pos.x, pos.z), false);
  }
  assert.ok(pos.x > -5 + FLOOR3D_TABLE_CLEARANCE_X,
    "camera must not cross the inner edge of Blackjack table");
  assert.ok(pos.x < -3, "camera should move as close as clearance permits");
  assert.deepEqual(advanceFloor3DCamera(NaN, Infinity, 0, 0), FLOOR3D_SPAWN);
  assert.deepEqual(advanceFloor3DCamera(0, 10.5, Infinity, 1), FLOOR3D_SPAWN);
  const step = advanceFloor3DCamera(0, 10.5, -999, 0);
  assert.ok(Math.abs(step.x) <= FLOOR3D_MAX_FRAME_MOVE + 1e-9);
});

test("R13 slides along solid table edges rather than freezing diagonal movement", () => {
  const start = { x: -3.09, z: 6 };
  assert.equal(collidesFloor3DTable(start.x, start.z), false);
  const after = advanceFloor3DCamera(start.x, start.z, -0.25, -0.25);
  assert.equal(collidesFloor3DTable(after.x, after.z), false);
  assert.ok(after.x > -5 + FLOOR3D_TABLE_CLEARANCE_X,
    "blocking x movement prevents walking through the rail");
  assert.ok(after.z < start.z, "z movement should slide alongside the rail");
  assert.deepEqual(advanceFloor3DCamera(0, 10.5, 0, 0), FLOOR3D_SPAWN);
});

test("R13 keeps all central aisles traversable with wall clamping", () => {
  let pos: { x: number; z: number } = { ...FLOOR3D_SPAWN };
  for (let i = 0; i < 260; i++) {
    pos = advanceFloor3DCamera(pos.x, pos.z, 0, -0.12);
    assert.equal(collidesFloor3DTable(pos.x, pos.z), false);
  }
  assert.equal(pos.x, 0);
  assert.equal(pos.z, -11.8);
  for (let i = 0; i < 200; i++) {
    pos = advanceFloor3DCamera(pos.x, pos.z, 0, 0.12);
  }
  assert.ok(Math.abs(pos.z - 11.5) < 1e-8);
});

test("R13 corrects legacy R12 camera returns inside decorative tables", () => {
  assert.deepEqual(safeFloor3DReturnPose(null), FLOOR3D_START_POSE);
  const ordinary = { x: -3, z: 6, yaw: 0.6 };
  assert.deepEqual(safeFloor3DReturnPose(ordinary), ordinary);
  for (const station of FLOOR3D_STATIONS) {
    const pose = { x: station.x, z: station.z, yaw: -0.43 };
    const original = structuredClone(pose);
    const restored = safeFloor3DReturnPose(pose);
    assert.equal(collidesFloor3DTable(restored.x, restored.z), false, station.id);
    assert.equal(restored.yaw, -0.43);
    assert.deepEqual(pose, original, "input remains unchanged");
    assert.equal(canOpenFloor3DTable(station.game, restored.x, restored.z), true,
      `${station.id}: legacy correction must retain table proximity`);
  }
});
