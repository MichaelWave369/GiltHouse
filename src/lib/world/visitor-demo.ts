/**
 * Offline demonstration scripts for the opt-in Backstage Agent Desk.
 * Plans are local authored data. They do not run a real PhiBot or update saves.
 */
import { MAX_LOCAL_ACTIONS, observeLocalVisitor } from "./agent-sandbox.ts";
import type { AgentAction } from "./agent.ts";
import type { WorldState } from "./types.ts";

const OUT_STEPS = 8;
const RETURN_STEPS = 8;

/**
 * Produce the same rehearsal from the same world snapshot.
 * The visitor may greet a nearby character, but neither an NPC nor quest
 * actually receives the action. Plans never include purchases or wagers.
 */
export function planLocalPatrol(world: WorldState): readonly AgentAction[] {
  const observed = observeLocalVisitor(world, world.x);
  const nearby = observed.nearbyActorIds[0];
  const actions: AgentAction[] = [];
  if (nearby) {
    actions.push({ type: "talk", npcId: nearby });
    actions.push({ type: "emote", npcId: nearby, emote: "wave" });
  }
  for (let i = 0; i < OUT_STEPS; i++) actions.push({ type: "move", dir: 1 });
  for (let i = 0; i < RETURN_STEPS; i++) actions.push({ type: "move", dir: -1 });
  // Keep the public replay boundary as the single action budget authority.
  return Object.freeze(actions.slice(0, MAX_LOCAL_ACTIONS));
}
