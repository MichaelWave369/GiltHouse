/**
 * Manual, offline model-proposal bridge for Gilt House.
 *
 * This module NEVER routes external/model-proposed actions to the trusted
 * local-script rehearsal source or the actual world store.
 * It parses a tightly bounded proposal and PREVIEWS a hypothetical position,
 * without authorization, dialogue, effects, chips, APIs, or persistence.
 */
import { LOCATIONS, NPCS, TALK_R } from "./content.ts";
import { observeLocalVisitor } from "./agent-sandbox.ts";
import { movePlayer, npcWorldX } from "./logic.ts";
import type { AgentAction } from "./agent.ts";
import type { WorldState } from "./types.ts";

export const MODEL_PROPOSAL_SCHEMA = "gilt-house.model-proposal.v1";
export const MAX_MODEL_PROPOSAL_CHARS = 4096;
export const MAX_MODEL_PROPOSAL_ACTIONS = 12;
const MODEL_PREVIEW_STEP_SECONDS = 0.25;

export type ProposalParse =
  | { ok: true; actions: readonly AgentAction[] }
  | { ok: false; code: string; reason: string };

export type ProposalStep = Readonly<{
  index: number;
  action: AgentAction;
  validInScene: boolean;
  xBefore: number;
  xAfter: number;
  note: string;
}>;

export type ProposalInspection = Readonly<{
  schema: typeof MODEL_PROPOSAL_SCHEMA;
  evidence: "UNTRUSTED_MODEL_PROPOSAL";
  authority: "PREVIEW_ONLY_NO_EXECUTION";
  source: "PASTED_UNTRUSTED_TEXT";
  sceneId: string;
  startX: number;
  endX: number;
  steps: readonly ProposalStep[];
  eligiblePreviewSteps: number;
  rejectedSteps: number;
  writes: false;
  networkCalls: 0;
  apiSpend: false;
  casinoChips: false;
  trainingProof: false;
}>;

function exactKeys(row: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(row).length === allowed.length &&
    Object.keys(row).every((key) => allowed.includes(key));
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const ACTORS = new Set(NPCS.map((npc) => npc.id));

export function parseModelProposal(raw: string): ProposalParse {
  if (typeof raw !== "string" || raw.length === 0) {
    return { ok: false, code: "EMPTY", reason: "Paste one JSON proposal before inspecting." };
  }
  if (raw.length > MAX_MODEL_PROPOSAL_CHARS) {
    return { ok: false, code: "TOO_LARGE", reason: "Proposal exceeds the local input limit." };
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, code: "INVALID_JSON", reason: "The proposal must be a single JSON object, not Markdown." };
  }
  if (!object(value) || !exactKeys(value, ["schema", "actions"]) ||
      value.schema !== MODEL_PROPOSAL_SCHEMA || !Array.isArray(value.actions)) {
    return { ok: false, code: "INVALID_ENVELOPE", reason: "Schema, actions and top-level fields must match exactly." };
  }
  if (value.actions.length > MAX_MODEL_PROPOSAL_ACTIONS) {
    return { ok: false, code: "TOO_MANY_ACTIONS", reason: "Maximum 12 proposed actions." };
  }

  const actions: AgentAction[] = [];
  for (const [index, candidate] of value.actions.entries()) {
    if (!object(candidate)) {
      return { ok: false, code: "INVALID_ACTION", reason: `Action ${index + 1} is not an object.` };
    }
    if (candidate.type === "move" &&
        exactKeys(candidate, ["type", "dir"]) &&
        (candidate.dir === -1 || candidate.dir === 1)) {
      actions.push({ type: "move", dir: candidate.dir });
    } else if (candidate.type === "talk" &&
        exactKeys(candidate, ["type", "npcId"]) &&
        typeof candidate.npcId === "string" && ACTORS.has(candidate.npcId)) {
      actions.push({ type: "talk", npcId: candidate.npcId });
    } else if (candidate.type === "emote" &&
        exactKeys(candidate, ["type", "npcId", "emote"]) &&
        typeof candidate.npcId === "string" && ACTORS.has(candidate.npcId) &&
        (candidate.emote === "wave" || candidate.emote === "listen")) {
      actions.push({ type: "emote", npcId: candidate.npcId, emote: candidate.emote });
    } else {
      return {
        ok: false, code: "FORBIDDEN_ACTION",
        reason: `Action ${index + 1} is not an exact, locally previewable move/talk/emote shape.`,
      };
    }
  }
  return { ok: true, actions };
}

export function buildLocalModelBrief(world: WorldState): string {
  const observation = observeLocalVisitor(world, world.x);
  const safeSnapshot = {
    scene: observation.sceneId,
    visitorX: Math.round(world.x),
    nearbyNpcIds: observation.nearbyActorIds,
    objective: observation.objective,
  };
  return [
    "You are proposing actions for a fictional, read-only visitor in Gilt House.",
    "Only output one compact JSON object, no Markdown or prose.",
    "This is a hypothetical practice exercise. You have no tools or privileges.",
    "You cannot control the real game, change inventory, wager, use money, or call APIs.",
    `Output schema: ${MODEL_PROPOSAL_SCHEMA}`,
    `Use at most ${MAX_MODEL_PROPOSAL_ACTIONS} actions; it is OK to propose zero actions.`,
    'Permitted exact shapes: {"type":"move","dir":1}, {"type":"move","dir":-1},',
    '{"type":"talk","npcId":"EXISTING_NPC_ID"},',
    '{"type":"emote","npcId":"EXISTING_NPC_ID","emote":"wave"}.',
    "A talk or emote can only be preview-valid when that NPC is nearby in the same scene.",
    "The movement step previews 0.25 seconds of walking and cannot enter doors.",
    `Observation (no private data): ${JSON.stringify(safeSnapshot)}`,
    `Output: {"schema":"${MODEL_PROPOSAL_SCHEMA}","actions":[{"type":"move","dir":1}]}`,
  ].join("\n");
}

export function inspectModelProposal(
  world: WorldState,
  actions: readonly AgentAction[],
): ProposalInspection {
  if (!world || !Object.prototype.hasOwnProperty.call(LOCATIONS, world.scene) ||
      !Number.isFinite(world.x) || !Number.isFinite(world.worldTime)) {
    throw new TypeError("A valid world snapshot is required for inspection.");
  }
  if (!Array.isArray(actions) || actions.length > MAX_MODEL_PROPOSAL_ACTIONS) {
    throw new RangeError("Proposed actions exceed the bounded local preview.");
  }
  let x = world.x;
  const steps: ProposalStep[] = [];
  let eligible = 0;
  for (const [index, action] of actions.entries()) {
    const before = x;
    let validInScene = true;
    let note: string;
    if (action.type === "move") {
      // Only a hypothetical x position changes. There is NO world-store write.
      x = movePlayer({ ...world, x }, action.dir, MODEL_PREVIEW_STEP_SECONDS).x;
      note = "Projected move only; no real player or NPC movement.";
    } else {
      const npc = NPCS.find((actor) => actor.id === action.npcId);
      const actorX = npcWorldX(action.npcId, world.worldTime);
      validInScene = Boolean(npc && npc.scene === world.scene && actorX !== null &&
        Math.abs(actorX - x) <= TALK_R);
      note = validInScene
        ? "Potential proximity confirmed for preview. No dialogue or emote executed."
        : "NPC not in range or not in this scene. Preview action rejected.";
    }
    if (validInScene) eligible += 1;
    steps.push({ index, action, validInScene, xBefore: before, xAfter: x, note });
  }
  return {
    schema: MODEL_PROPOSAL_SCHEMA,
    evidence: "UNTRUSTED_MODEL_PROPOSAL",
    authority: "PREVIEW_ONLY_NO_EXECUTION",
    source: "PASTED_UNTRUSTED_TEXT",
    sceneId: world.scene,
    startX: world.x,
    endX: x,
    steps,
    eligiblePreviewSteps: eligible,
    rejectedSteps: actions.length - eligible,
    writes: false,
    networkCalls: 0,
    apiSpend: false,
    casinoChips: false,
    trainingProof: false,
  };
}
