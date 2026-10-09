import test from "node:test";
import assert from "node:assert/strict";
import { defaultWorld } from "./save.ts";
import {
  LOCAL_REPLAY_SCHEMA,
  MAX_LOCAL_ACTIONS,
  observeLocalVisitor,
  replayLocalVisitor,
} from "./agent-sandbox.ts";

test("local visitors observe only same-scene nearby actors", () => {
  const street = { ...defaultWorld(), x: 150, worldTime: 0 };
  const seen = observeLocalVisitor(street, 150);
  assert.equal(seen.sceneId, "neon-block");
  assert.ok(seen.nearbyActorIds.includes("kit"));
  assert.ok(!seen.nearbyActorIds.includes("dottie"));
  assert.ok(!seen.nearbyActorIds.includes("ruby"));
  assert.equal(seen.streetTokensVisible, street.tokens);
  const diner = { ...street, scene: "diner" as const };
  assert.ok(!observeLocalVisitor(diner, 150).nearbyActorIds.includes("kit"));
});

test("replay is deterministic and does not mutate the live world or chip state", () => {
  const world = { ...defaultWorld(), x: 150, worldTime: 12, tokens: 24 };
  const original = structuredClone(world);
  const script = [
    { type: "talk", npcId: "kit" },
    { type: "move", dir: 1 },
    { type: "move", dir: -1 },
    { type: "emote", npcId: "kit", emote: "wave" },
  ];
  const a = replayLocalVisitor(world, script, "local-script");
  const b = replayLocalVisitor(world, script, "local-script");
  assert.deepEqual(a, b);
  assert.equal(a.schema, LOCAL_REPLAY_SCHEMA);
  assert.equal(a.evidence, "UNVERIFIED_LOCAL_SIMULATION");
  assert.equal(a.accepted, 4);
  assert.equal(a.rejected, 0);
  assert.equal(a.endX, 150);
  assert.ok(a.steps.every((step) => step.observation.sceneId === "neon-block"));
  assert.deepEqual(world, original);
  assert.ok(Object.values(a.authority).every((value) => value === false || value === 0));
  assert.equal("bank" in a, false);
  assert.equal("inventory" in a, false);
  assert.equal("flags" in a, false);
  assert.equal("quests" in a, false);
});

test("remote agents and privileged or malformed commands cannot act", () => {
  const world = { ...defaultWorld(), x: 150, worldTime: 0 };
  const remote = replayLocalVisitor(world, [{ type: "move", dir: 1 }], "phibot");
  assert.equal(remote.accepted, 0);
  assert.equal(remote.endX, 150);
  for (const command of [
    { type: "wager", stake: 1 },
    { type: "move", dir: 1, permission: true },
    { type: "move", dir: 1, unexpected: "remote override" },
    { type: "move", dir: 3 },
    { type: "talk", npcId: "nonexistent" },
    { type: "talk", npcId: "ruby" },
    { type: "emote", npcId: "dottie", emote: "wave" },
    { type: "emote", npcId: "kit", emote: "execute" },
    null,
    [],
  ]) {
    const r = replayLocalVisitor(world, [command], "local-script");
    assert.equal(r.accepted, 0, JSON.stringify(command));
    assert.equal(r.endX, 150, JSON.stringify(command));
  }
});

test("bounded movement honors the current scene's collisions without writing a save", () => {
  const diner = { ...defaultWorld(), scene: "diner" as const, x: 241, worldTime: 0 };
  const r = replayLocalVisitor(diner, [{ type: "move", dir: 1 }], "local-script");
  assert.equal(r.accepted, 1);
  assert.equal(r.endX, 241);
  assert.equal(diner.x, 241);
  assert.throws(() => replayLocalVisitor(diner, new Array(MAX_LOCAL_ACTIONS + 1).fill({ type: "move", dir: 1 }), "local-script"), RangeError);
  assert.throws(() => replayLocalVisitor(diner, "not-an-array" as unknown as readonly unknown[], "local-script"), RangeError);
});

test("zero-action rehearsal is observation-only and handles invalid positions", () => {
  const world = defaultWorld();
  const r = replayLocalVisitor(world, [], "local-script");
  assert.equal(r.requested, 0);
  assert.equal(r.endX, world.x);
  assert.throws(() => observeLocalVisitor(world, Number.NaN), /finite/);
  assert.throws(() => replayLocalVisitor({ ...world, x: Infinity }, [], "local-script"), /valid local/);
});
