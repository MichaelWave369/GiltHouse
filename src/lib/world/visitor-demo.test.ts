import test from "node:test";
import assert from "node:assert/strict";
import { defaultWorld } from "./save.ts";
import { planLocalPatrol } from "./visitor-demo.ts";
import { MAX_LOCAL_ACTIONS, replayLocalVisitor } from "./agent-sandbox.ts";

test("default visitor patrol is deterministic, bounded and greetable", () => {
  const world = { ...defaultWorld(), x: 128, worldTime: 0 };
  const first = planLocalPatrol(world);
  assert.deepEqual(first, planLocalPatrol(world));
  assert.ok(first.length > 12 && first.length <= MAX_LOCAL_ACTIONS);
  assert.deepEqual(first.slice(0, 2), [
    { type: "talk", npcId: "kit" },
    { type: "emote", npcId: "kit", emote: "wave" },
  ]);
  assert.ok(first.every((step) => ["talk", "emote", "move"].includes(step.type)));
  const trace = replayLocalVisitor(world, first, "local-script");
  assert.equal(trace.requested, first.length);
  assert.equal(trace.accepted, first.length);
  assert.equal(trace.rejected, 0);
  assert.equal(trace.endX, world.x);
  assert.equal(trace.authority.remoteCalls, 0);
  assert.equal(trace.authority.worldMutation, false);
});

test("patrol never modifies the player or produces paid/economic actions", () => {
  const world = { ...defaultWorld(), tokens: 999, inventory: { coffee: 2 } };
  const before = structuredClone(world);
  const script = planLocalPatrol(world);
  const trace = replayLocalVisitor(world, script, "local-script");
  assert.deepEqual(world, before);
  assert.equal("bank" in trace, false);
  assert.equal("inventory" in trace, false);
  assert.equal("quests" in trace, false);
  assert.equal(trace.steps.length, script.length);
  assert.ok(script.every((action) => action.type !== ("wager" as string)));
  const remotelySourced = replayLocalVisitor(world, script, "phibot");
  assert.equal(remotelySourced.accepted, 0);
  assert.equal(remotelySourced.endX, world.x);
});

test("same-scene rehearsal works near room walls and without any nearby NPC", () => {
  const room = { ...defaultWorld(), scene: "diner" as const, x: 241 };
  const script = planLocalPatrol(room);
  const trace = replayLocalVisitor(room, script, "local-script");
  assert.ok(trace.endX >= 18);
  assert.ok(trace.steps.every((step) => Number.isFinite(step.xAfter)));
  const noActor = { ...defaultWorld(), scene: "neon-block" as const, x: 18 };
  const plan = planLocalPatrol(noActor);
  assert.ok(plan.every((action) => action.type === "move"));
  assert.equal(plan.length, 16);
  assert.ok(plan.length <= MAX_LOCAL_ACTIONS);
});
