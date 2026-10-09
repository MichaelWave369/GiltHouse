import test from "node:test";
import assert from "node:assert/strict";
import {
  FLOOR3D_SPAWN, FLOOR3D_STATIONS,
  collidesFloor3DTable, canOpenFloor3DTable,
} from "./floor3d.ts";
import { floor3DTarget, findFloor3DRoute, floor3DHeading } from "./floor3d-nav.ts";

function clearSegment(a: { x: number; z: number }, b: { x: number; z: number }): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.05));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (collidesFloor3DTable(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

test("R14 all eight table map targets are reachable from the entry without crossing solids", () => {
  const spawn = { ...FLOOR3D_SPAWN, yaw: 0 };
  for (const station of FLOOR3D_STATIONS) {
    const target = floor3DTarget(station.game);
    assert.ok(target, station.id);
    assert.equal(collidesFloor3DTable(target.x, target.z), false, station.id);
    assert.equal(canOpenFloor3DTable(station.game, target.x, target.z), true, station.id);
    const route = findFloor3DRoute(spawn, station.game);
    assert.ok(route, station.id);
    assert.equal(route.game, station.game);
    assert.deepEqual(route.points[0], FLOOR3D_SPAWN);
    assert.deepEqual(route.destination, target);
    assert.deepEqual(route.points.at(-1), target);
    assert.ok(route.meters > 0 && route.meters < 45, station.id);
    for (let i = 1; i < route.points.length; i++) {
      assert.ok(clearSegment(route.points[i - 1], route.points[i]),
        `${station.id}: map route crosses a table between steps ${i-1} and ${i}`);
    }
  }
});

test("R14 route from every table approach to every other table stays open", () => {
  for (const start of FLOOR3D_STATIONS) {
    const target = floor3DTarget(start.game);
    assert.ok(target);
    for (const end of FLOOR3D_STATIONS) {
      const route = findFloor3DRoute({ ...target, yaw: 0 }, end.game);
      assert.ok(route, `${start.id} → ${end.id}`);
      assert.equal(route.game, end.game);
      assert.deepEqual(route.points.at(-1), floor3DTarget(end.game));
      for (let i = 1; i < route.points.length; i++) {
        assert.ok(clearSegment(route.points[i-1], route.points[i]),
          `${start.id} → ${end.id}: unsafe segment`);
      }
    }
  }
});

test("R14 invalid input is denied rather than inventing routes or control authority", () => {
  assert.equal(floor3DTarget("cashout"), null);
  assert.equal(floor3DTarget("agents"), null);
  assert.equal(findFloor3DRoute({ x: 0, z: 10.5, yaw: 0 }, "cashout"), null);
  assert.equal(findFloor3DRoute({ x: Number.NaN, z: 10.5, yaw: 0 }, "blackjack"), null);
  assert.equal(findFloor3DRoute({ x: -5, z: 6, yaw: 0 }, "blackjack"), null, "no start inside table");
  assert.equal(findFloor3DRoute({ x: 0, z: 10.5, yaw: Infinity }, "blackjack"), null);
  const route = findFloor3DRoute({ x: 0, z: 10.5, yaw: 0 }, "blackjack");
  assert.ok(route);
  assert.deepEqual(Object.keys(route).sort(), ["destination", "game", "meters", "points"]);
  assert.equal("bank" in route, false);
  assert.equal("chips" in route, false);
  assert.equal("playerMove" in route, false);
});

test("R14 relative directions reflect camera heading without mutating it", () => {
  const pose = { x: 0, z: 10.5, yaw: 0 };
  const original = structuredClone(pose);
  const route = findFloor3DRoute(pose, "blackjack");
  assert.ok(route);
  assert.match(floor3DHeading(pose, route), /Turn|Continue|ahead/);
  assert.equal(floor3DHeading(pose, null), "Choose a table for walking directions.");
  const arrived = { ...floor3DTarget("blackjack"), yaw: 0 };
  assert.match(floor3DHeading(arrived, findFloor3DRoute(arrived, "blackjack")), /at the table/i);
  assert.deepEqual(pose, original);
});
