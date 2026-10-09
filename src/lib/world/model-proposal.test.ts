import test from "node:test";
import assert from "node:assert/strict";
import { defaultWorld } from "./save.ts";
import {
  MODEL_PROPOSAL_SCHEMA,
  MAX_MODEL_PROPOSAL_ACTIONS,
  MAX_MODEL_PROPOSAL_CHARS,
  buildLocalModelBrief,
  inspectModelProposal,
  parseModelProposal,
} from "./model-proposal.ts";

function wrap(actions: unknown[], extra: Record<string, unknown> = {}) {
  return JSON.stringify({ schema: MODEL_PROPOSAL_SCHEMA, actions, ...extra });
}

test("manual model briefing discloses only coarse current-scene observation", () => {
  const world = { ...defaultWorld(), x: 150, tokens: 9876, inventory: { coffee: 2 } };
  const briefing = buildLocalModelBrief(world);
  assert.match(briefing, /gilt-house\.model-proposal\.v1/);
  assert.match(briefing, /kit/);
  assert.match(briefing, /neon-block/);
  assert.doesNotMatch(briefing, /9876|coffee|gilt-house-v1|customerId|apiKey|localStorage/);
  assert.doesNotMatch(briefing, /"tokens":|"bank":|"inventory":/);
});

test("parses only strict, bounded action envelopes", () => {
  const raw = wrap([
    { type: "move", dir: 1 },
    { type: "talk", npcId: "kit" },
    { type: "emote", npcId: "kit", emote: "wave" },
  ]);
  const parsed = parseModelProposal(raw);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.actions, [
    { type: "move", dir: 1 },
    { type: "talk", npcId: "kit" },
    { type: "emote", npcId: "kit", emote: "wave" },
  ]);
  const zero = parseModelProposal(wrap([]));
  assert.equal(zero.ok, true);
});

test("unknown grants, extras, casino/payment actions and unauthorized source are rejected", () => {
  const malformed = [
    wrap([{ type: "wager", chips: 200 }]),
    wrap([{ type: "move", dir: 1, localScript: true }]),
    wrap([{ type: "move", dir: 1, "permission": true }]),
    wrap([{ type: "move", dir: 0 }]),
    wrap([{ type: "talk", npcId: "unknown" }]),
    wrap([{ type: "emote", npcId: "kit", emote: "execute" }]),
    wrap([{ type: "talk", npcId: "kit", tool: "shell" }]),
    wrap([{ type: "move", dir: 1 }], { grant: true }),
    JSON.stringify({ schema: "wrong", actions: [] }),
    '{"schema":"gilt-house.model-proposal.v1","actions":{}}',
    'not json',
    '```json\n{}\n```',
    wrap(new Array(MAX_MODEL_PROPOSAL_ACTIONS + 1).fill({ type: "move", dir: 1 })),
    "x".repeat(MAX_MODEL_PROPOSAL_CHARS + 1),
    "",
  ];
  for (const raw of malformed) {
    const outcome = parseModelProposal(raw);
    assert.equal(outcome.ok, false, raw.slice(0, 72));
  }
});

test("projected preview does not mutate the game world or confer gameplay authority", () => {
  const world = { ...defaultWorld(), x: 150, worldTime: 0, tokens: 999 };
  const before = structuredClone(world);
  const parsed = parseModelProposal(wrap([
    { type: "talk", npcId: "kit" },
    { type: "move", dir: 1 },
    { type: "move", dir: -1 },
    { type: "talk", npcId: "ruby" },
  ]));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const a = inspectModelProposal(world, parsed.actions);
  const b = inspectModelProposal(world, parsed.actions);
  assert.deepEqual(a, b);
  assert.equal(a.startX, 150);
  assert.equal(a.endX, 150);
  assert.equal(a.steps.length, 4);
  assert.equal(a.eligiblePreviewSteps, 3);
  assert.equal(a.rejectedSteps, 1);
  assert.equal(a.evidence, "UNTRUSTED_MODEL_PROPOSAL");
  assert.equal(a.authority, "PREVIEW_ONLY_NO_EXECUTION");
  assert.equal(a.source, "PASTED_UNTRUSTED_TEXT");
  assert.equal(a.networkCalls, 0);
  assert.equal(a.writes, false);
  assert.equal(a.apiSpend, false);
  assert.equal(a.casinoChips, false);
  assert.equal(a.trainingProof, false);
  assert.deepEqual(world, before);
  assert.equal("world" in a, false);
  assert.equal("bank" in a, false);
});

test("same-scene proximity, walls, and proposal bounds hold", () => {
  const diner = { ...defaultWorld(), scene: "diner" as const, x: 241, worldTime: 0 };
  const parsed = parseModelProposal(wrap([
    { type: "move", dir: 1 },
    { type: "talk", npcId: "kit" },
  ]));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const trace = inspectModelProposal(diner, parsed.actions);
  assert.equal(trace.endX, 241);
  assert.equal(trace.steps[1]?.validInScene, false);
  assert.throws(
    () => inspectModelProposal(diner, new Array(MAX_MODEL_PROPOSAL_ACTIONS + 1).fill({ type: "move", dir: 1 })),
    /bounded/,
  );
  assert.throws(() => inspectModelProposal({ ...diner, x: Infinity }, []), /valid world/);
});
