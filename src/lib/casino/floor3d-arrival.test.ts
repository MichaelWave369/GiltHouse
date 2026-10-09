import test from "node:test";
import assert from "node:assert/strict";
import {
  FLOOR3D_SPAWN, FLOOR3D_STATIONS, canOpenFloor3DTable,
  collidesFloor3DTable, type Floor3DPose,
} from "./floor3d.ts";
import { floor3DArrival } from "./floor3d-arrival.ts";
import { findFloor3DRoute, floor3DTarget } from "./floor3d-nav.ts";

test("R16: each destination beacon is safe and uses the existing F interaction guard", () => {
  for (const table of FLOOR3D_STATIONS) {
    const destination = floor3DTarget(table.game);
    assert.ok(destination);
    assert.equal(collidesFloor3DTable(destination.x, destination.z), false, table.id);
    const pose: Floor3DPose = { ...destination, yaw: 0 };
    const arrived = floor3DArrival(pose, table.game);
    assert.ok(arrived, table.id);
    assert.equal(arrived.canEnter, true, table.id);
    assert.equal(arrived.distance, 0);
    assert.equal(arrived.label, table.name);
    assert.deepEqual(arrived.destination, destination);
    assert.equal(arrived.canEnter, canOpenFloor3DTable(table.game, pose.x, pose.z));

    const spawn: Floor3DPose = { ...FLOOR3D_SPAWN, yaw: 0 };
    const fromEntry = floor3DArrival(spawn, table.game);
    assert.ok(fromEntry);
    assert.equal(fromEntry.canEnter, false, table.id);
    assert.ok(fromEntry.distance > 0);
    assert.ok(findFloor3DRoute(spawn, table.game), table.id);
  }
});

test("R16: nearby wrong-table access remains forbidden", () => {
  for (const selected of FLOOR3D_STATIONS) {
    for (const at of FLOOR3D_STATIONS) {
      const actual = floor3DArrival({ x: at.x < 0 ? -3 : 3, z: at.z, yaw: 0 }, selected.game);
      assert.ok(actual);
      assert.equal(actual.canEnter, at.game === selected.game, `${at.game} vs ${selected.game}`);
    }
  }
});

test("R16: bad coordinates and unknown destinations fail closed", () => {
  const origin: Floor3DPose = { ...FLOOR3D_SPAWN, yaw: 0 };
  assert.equal(floor3DArrival(origin, null), null);
  for (const denied of ["", "wager", "cashout", "agents", "roulette;pay"]) {
    assert.equal(floor3DArrival(origin, denied), null);
  }
  assert.equal(floor3DArrival({ x: NaN, z: 0, yaw: 0 }, "roulette"), null);
  assert.equal(floor3DArrival({ x: 0, z: Infinity, yaw: 0 }, "roulette"), null);
  assert.equal(floor3DArrival({ x: 0, z: 0, yaw: Infinity }, "roulette"), null);
  const arrived = floor3DArrival({ x: -3, z: 6, yaw: 0 }, "blackjack");
  assert.ok(arrived);
  assert.deepEqual(Object.keys(arrived).sort(), ["canEnter", "destination", "distance", "game", "label"]);
  for (const key of ["chips", "bank", "bet", "wager", "action", "auth"]) {
    assert.equal(key in arrived, false);
  }
});
