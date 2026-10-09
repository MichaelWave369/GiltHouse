import test from "node:test";
import assert from "node:assert/strict";
import {
  LOBBY3D_SCENE,
  LOBBY_STATIONS,
  clampLobbyCamera,
  isLobby3DScene,
  validLobbyStation,
  canEnterLobbyPortal,
  nearbyLobbyStation,
  LOBBY_DOOR_HALF_WIDTH,
  LOBBY_DOOR_INTERACT_Z,
  collidesLobby3DObstacle,
  advanceLobby3DCamera,
  LOBBY_COLLISION_RADIUS,
  LOBBY_MAX_FRAME_MOVE,
  canStart3DFloorFromLobby,
  canReturnTo3DLobby,
} from "./lobby3d.ts";
import { PORTALS } from "./content.ts";

test("3D lobby stays behind the existing Gilt House lobby scene", () => {
  assert.equal(LOBBY3D_SCENE, "gilt-lobby");
  assert.equal(isLobby3DScene("gilt-lobby"), true);
  for (const elsewhere of ["neon-block", "diner", "mirage", "casino", ""]) {
    assert.equal(isLobby3DScene(elsewhere), false);
  }
});

test("every displayed 3D lobby destination maps to the existing casino", () => {
  assert.equal(LOBBY_STATIONS.length, 4);
  assert.deepEqual(LOBBY_STATIONS.map((s) => s.view), ["floor", "workshop", "training", "agents"]);
  assert.equal(new Set(LOBBY_STATIONS.map((s) => s.id)).size, LOBBY_STATIONS.length);
  assert.equal(new Set(LOBBY_STATIONS.map((s) => s.view)).size, LOBBY_STATIONS.length);
  for (const entry of LOBBY_STATIONS) {
    assert.equal(validLobbyStation(entry.view), true);
    assert.ok(Number.isFinite(entry.x) && entry.x >= -7.4 && entry.x <= 7.4);
    assert.match(entry.name, /[A-Z]/);
  }
  for (const denied of ["blackjack", "wager", "cashout", "roulette", "street", ""]) {
    assert.equal(validLobbyStation(denied), false);
  }
  // Three existing lobby doors remain unmodified: no navigation regression.
  for (const view of ["floor", "workshop", "training"]) {
    assert.equal(PORTALS.some((p) => p.scene === "gilt-lobby" && p.casino === view), true);
  }
});

test("hypothetical camera movement remains finite and inside the lobby", () => {
  assert.deepEqual(clampLobbyCamera(0, 8), { x: 0, z: 8 });
  assert.deepEqual(clampLobbyCamera(100, -100), { x: 7.4, z: -6.4 });
  assert.deepEqual(clampLobbyCamera(-100, 100), { x: -7.4, z: 8.2 });
  assert.deepEqual(clampLobbyCamera(Number.NaN, Infinity), { x: 0, z: 7 });
});

test("physical 3D doors require actual nearby camera position", () => {
  assert.equal(nearbyLobbyStation(0, 8), null, "no entry from the spawn point");
  assert.equal(nearbyLobbyStation(0, LOBBY_DOOR_INTERACT_Z - 0.1), null, "aisle between doors isn't an accidental shortcut");
  for (const station of LOBBY_STATIONS) {
    const nearby = nearbyLobbyStation(station.x, -6);
    assert.equal(nearby?.view, station.view);
    assert.equal(canEnterLobbyPortal(station.view, station.x, -6), true);
    assert.equal(canEnterLobbyPortal(station.view, station.x, 8), false);
    assert.equal(canEnterLobbyPortal(station.view, station.x + LOBBY_DOOR_HALF_WIDTH + 0.1, -6), false);
    for (const other of LOBBY_STATIONS) {
      if (other.view !== station.view) assert.equal(canEnterLobbyPortal(other.view, station.x, -6), false);
    }
  }
  assert.equal(canEnterLobbyPortal("wager", -5.4, -6), false);
  assert.equal(nearbyLobbyStation(NaN, -6), null);
  assert.equal(nearbyLobbyStation(1.8, Infinity), null);
});

test("R17 solid scene pillars and queue posts match the rendered objects", () => {
  assert.ok(LOBBY_COLLISION_RADIUS >= 0.3);
  assert.equal(collidesLobby3DObstacle(0, 8), false, "player spawn must be open");
  assert.equal(collidesLobby3DObstacle(0, -6.4), false, "center door corridor must be open");
  for (const x of [-7.9, 7.9]) {
    for (const z of [-7, -2, 3, 8]) {
      assert.equal(collidesLobby3DObstacle(x, z), true, `column ${x},${z}`);
    }
  }
  for (const x of [-4.7, 4.7]) {
    for (const z of [0, 4, 7]) {
      assert.equal(collidesLobby3DObstacle(x, z), true, `queue post ${x},${z}`);
      assert.equal(collidesLobby3DObstacle(x > 0 ? 4 : -4, z), false, "post leaves wide aisles");
    }
  }
  assert.equal(collidesLobby3DObstacle(NaN, 8), true);
  assert.equal(collidesLobby3DObstacle(0, Infinity), true);
});

test("R17 swept walking never tunnels through columns or queue posts", () => {
  let pos: { x: number; z: number } = { x: -4.1, z: 7 };
  for (let i = 0; i < 80; i++) {
    pos = advanceLobby3DCamera(pos.x, pos.z, -1000, 0);
    assert.equal(collidesLobby3DObstacle(pos.x, pos.z), false);
  }
  assert.ok(pos.x < -4.1 && pos.x > -4.7 + 0.0425 + LOBBY_COLLISION_RADIUS,
    `queue-post edge must stop movement at x=${pos.x}`);

  pos = { x: -7, z: 8 };
  for (let i = 0; i < 80; i++) {
    pos = advanceLobby3DCamera(pos.x, pos.z, -999, 0);
    assert.equal(collidesLobby3DObstacle(pos.x, pos.z), false);
  }
  assert.ok(pos.x > -7.9 + 0.29 + LOBBY_COLLISION_RADIUS,
    `the gilded wall pillar must remain solid: ${pos.x}`);
  assert.deepEqual(advanceLobby3DCamera(0, 8, Infinity, 1), { x: 0, z: 8 });
  assert.deepEqual(advanceLobby3DCamera(NaN, Infinity, 0, 0), { x: 0, z: 7 });
  const short = advanceLobby3DCamera(0, 8, 0, -999);
  assert.ok(Math.hypot(short.x, short.z - 8) <= LOBBY_MAX_FRAME_MOVE + 1e-9);
});

test("R17 diagonal walking slides against brass posts", () => {
  const start = { x: -4.28, z: 7 };
  assert.equal(collidesLobby3DObstacle(start.x, start.z), false);
  const moved = advanceLobby3DCamera(start.x, start.z, -0.19, -0.2);
  assert.ok(moved.x > -4.7 + 0.0425 + LOBBY_COLLISION_RADIUS,
    "obstructed X should not move through the solid queue post");
  assert.ok(moved.z < start.z, "free Z motion should slide around the post");
  assert.equal(collidesLobby3DObstacle(moved.x, moved.z), false);
});

test("R17 all four real lobby doors remain accessible from the center aisle", () => {
  for (const station of LOBBY_STATIONS) {
    let pos: { x: number; z: number } = { x: 0, z: 8 };
    for (let i = 0; i < 60; i++) pos = advanceLobby3DCamera(pos.x, pos.z, 0, -0.5);
    assert.equal(pos.z, -6.4);
    assert.equal(collidesLobby3DObstacle(pos.x, pos.z), false);
    for (let i = 0; i < 14 && Math.abs(pos.x - station.x) > 1e-6; i++) {
      const step = Math.sign(station.x - pos.x) * Math.min(0.5, Math.abs(station.x - pos.x));
      pos = advanceLobby3DCamera(pos.x, pos.z, step, 0);
    }
    assert.equal(collidesLobby3DObstacle(pos.x, pos.z), false);
    assert.equal(canEnterLobbyPortal(station.view, pos.x, pos.z), true,
      `R17 must not trap visitor away from ${station.name}, x=${pos.x}, z=${pos.z}`);
    assert.equal(canEnterLobbyPortal(station.view, 0, 8), false);
  }
});

test("R18: only the actual in-world 3D lobby can launch the direct 3D floor", () => {
  const real = {
    scene: "gilt-lobby", mode: "street", panel: "lobby-3d",
    hasTalk: false, hasArcade: false,
  };
  assert.equal(canStart3DFloorFromLobby(real), true);
  for (const disallowed of [
    { scene: "neon-block" },
    { scene: "diner" },
    { mode: "casino" },
    { panel: "none" },
    { panel: "pause" },
    { panel: "title" },
    { hasTalk: true },
    { hasArcade: true },
  ]) {
    assert.equal(canStart3DFloorFromLobby({ ...real, ...disallowed }), false,
      `3D transfer should reject ${JSON.stringify(disallowed)}`);
  }
});

test("R18: return needs an authentic ephemeral lobby-origin flag", () => {
  const inside = {
    scene: "gilt-lobby", mode: "casino", panel: "none",
    hasTalk: false, hasArcade: false,
  };
  assert.equal(canReturnTo3DLobby(inside, true), true);
  assert.equal(canReturnTo3DLobby(inside, false), false,
    "ordinary 2D casino entry does not authorize a 3D lobby return");
  for (const invalid of [
    { scene: "neon-block" },
    { mode: "street" },
    { panel: "lobby-3d" },
    { panel: "pause" },
    { hasTalk: true },
    { hasArcade: true },
  ]) {
    assert.equal(canReturnTo3DLobby({ ...inside, ...invalid }, true), false);
  }
  assert.equal("bank" in inside, false);
  assert.equal("chips" in inside, false);
});
