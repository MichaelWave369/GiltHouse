import test from "node:test";
import assert from "node:assert/strict";
import {
  LOBBY3D_SCENE,
  LOBBY_STATIONS,
  clampLobbyCamera,
  isLobby3DScene,
  validLobbyStation,
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
