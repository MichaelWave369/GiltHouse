/**
 * The Neon Block's local-only visitor rehearsal.
 *
 * This is an explicit, deterministic, read-only *projection* of a visitor's
 * location and actions. It never dispatches actions to the actual world store,
 * never enters the casino, and never invokes external models or network APIs.
 *
 * IMPORTANT: "local-script" is a trusted application-origin label, NOT a
 * credential. Never label remote/model input as "local-script".
 */
import { NPCS, LOCATIONS, TALK_R } from "./content.ts";
import { reviewAgentAction, type AgentAction, type AgentObservation } from "./agent.ts";
import { currentObjective, movePlayer, npcWorldX } from "./logic.ts";
import type { WorldState } from "./types.ts";

export const LOCAL_REPLAY_SCHEMA = "gilt-house.local-agent-rehearsal.v1";
export const MAX_LOCAL_ACTIONS = 24;
export const LOCAL_STEP_SECONDS = 0.25;

export type LocalReplayStep = Readonly<{
  index: number;
  accepted: boolean;
  type: string;
  xBefore: number;
  xAfter: number;
  reason: string;
  observation: AgentObservation;
}>;

export type LocalReplay = Readonly<{
  schema: typeof LOCAL_REPLAY_SCHEMA;
  evidence: "UNVERIFIED_LOCAL_SIMULATION";
  sceneId: string;
  startX: number;
  endX: number;
  requested: number;
  accepted: number;
  rejected: number;
  steps: readonly LocalReplayStep[];
  authority: Readonly<{
    worldMutation: false;
    casinoChipAccess: false;
    customerData: false;
    remoteCalls: 0;
    apiSpend: false;
    trainingProof: false;
  }>;
}>;

function validWorld(world: WorldState): void {
  if (!world || !Object.prototype.hasOwnProperty.call(LOCATIONS, world.scene) ||
      !Number.isFinite(world.x) || !Number.isFinite(world.worldTime)) {
    throw new TypeError("A valid local world scene, position, and time are required.");
  }
}

/** A privacy-minimal observation of a simulated visitor at x, not the game player. */
export function observeLocalVisitor(world: WorldState, x: number): AgentObservation {
  validWorld(world);
  if (!Number.isFinite(x)) throw new TypeError("Visitor position must be finite.");
  const nearbyActorIds = NPCS.filter((npc) =>
    npc.scene === world.scene &&
    Math.abs((npcWorldX(npc.id, world.worldTime) ?? Number.POSITIVE_INFINITY) - x) <= TALK_R
  ).map((npc) => npc.id).sort();
  const objective = currentObjective(world);
  return {
    sceneId: world.scene,
    nearbyActorIds,
    objective: objective?.title ?? null,
    // This play-only balance is observed, NEVER changed or granted authority.
    streetTokensVisible: world.tokens,
  };
}

function exactKeys(raw: Record<string, unknown>, action: AgentAction): boolean {
  const expected = Object.keys(action).sort();
  const provided = Object.keys(raw).sort();
  return expected.length === provided.length &&
    expected.every((key, i) => key === provided[i]);
}

/**
 * Return a bounded, reproducible *preview trace* of visitor actions.
 * No effects, dialogue progression, reputation, chips, persistence or network.
 */
export function replayLocalVisitor(
  world: WorldState,
  actions: readonly unknown[],
  source: string,
): LocalReplay {
  validWorld(world);
  if (!Array.isArray(actions) || actions.length > MAX_LOCAL_ACTIONS) {
    throw new RangeError(`A local script may contain at most ${MAX_LOCAL_ACTIONS} actions.`);
  }
  const origin = world.x;
  let x = origin;
  const steps: LocalReplayStep[] = [];
  let accepted = 0;

  for (const [index, raw] of actions.entries()) {
    const before = x;
    const decision = reviewAgentAction(raw, source);
    let allowed = decision.allowed;
    let reason = decision.reason;
    const type =
      raw && typeof raw === "object" && !Array.isArray(raw) &&
      typeof (raw as Record<string, unknown>).type === "string"
        ? (raw as { type: string }).type.slice(0, 32)
        : "invalid";

    if (decision.allowed) {
      if (!exactKeys(raw as Record<string, unknown>, decision.action)) {
        allowed = false;
        reason = "Only the exact allowlisted action fields are permitted.";
      } else if (decision.action.type === "move") {
        // Use existing player collision only on a temporary, isolated state.
        x = movePlayer({ ...world, x }, decision.action.dir, LOCAL_STEP_SECONDS).x;
      } else {
        const actor = NPCS.find((npc) => npc.id === decision.action.npcId);
        const actorX = npcWorldX(decision.action.npcId, world.worldTime);
        if (!actor || actor.scene !== world.scene || actorX == null ||
            Math.abs(actorX - x) > TALK_R) {
          allowed = false;
          reason = "This character is not within talk range in the current scene.";
        } else {
          reason = decision.action.type === "talk"
            ? "Rehearsed contact only. Dialogue and quests were NOT executed."
            : "Rehearsed emote only. The live NPC did NOT change.";
        }
      }
    }
    if (allowed) accepted += 1;
    steps.push({
      index,
      accepted: allowed,
      type,
      xBefore: before,
      xAfter: x,
      reason,
      observation: observeLocalVisitor(world, x),
    });
  }
  return {
    schema: LOCAL_REPLAY_SCHEMA,
    evidence: "UNVERIFIED_LOCAL_SIMULATION",
    sceneId: world.scene,
    startX: origin,
    endX: x,
    requested: actions.length,
    accepted,
    rejected: actions.length - accepted,
    steps,
    authority: {
      worldMutation: false,
      casinoChipAccess: false,
      customerData: false,
      remoteCalls: 0,
      apiSpend: false,
      trainingProof: false,
    },
  };
}
