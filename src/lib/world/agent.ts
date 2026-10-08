/**
 * Future agent boundary for The Neon Block.
 * Disabled remote control. Local scripts only.
 * An agent must not spend API money, place wagers, read customer data,
 * touch casino chip authority, or grant its own permissions.
 */

export type AgentIdentity = {
  id: string;
  displayName: string;
  controller: "local-script";
};

export type AgentObservation = {
  sceneId: string;
  nearbyActorIds: string[];
  objective: string | null;
  /** Local play only. Never a chip balance, never a training score. */
  streetTokensVisible: number;
};

export type AgentAction =
  | { type: "talk"; npcId: string }
  | { type: "move"; dir: -1 | 1 }
  | { type: "emote"; npcId: string; emote: "wave" | "listen" };

export type AgentPermission = {
  remote: false;
  wager: false;
  spendApi: false;
  readCustomerData: false;
  mutateChipBank: false;
  selfGrant: false;
};

export type AgentBudget = {
  remoteCalls: 0;
  maxRemoteCalls: 0;
};

export type AgentTrainingReceipt = {
  source: "local-player-observation" | "unverified-self-report" | "reproducible-task" | "independent-evaluation";
  note: string;
};

export type AgentDecision =
  | { allowed: true; action: AgentAction; reason: string }
  | { allowed: false; reason: string };

export const AGENT_PERMISSION: AgentPermission = {
  remote: false,
  wager: false,
  spendApi: false,
  readCustomerData: false,
  mutateChipBank: false,
  selfGrant: false,
};

const LOCAL_TYPES = new Set(["talk", "move", "emote"]);

export function reviewAgentAction(action: { type?: string }, source: string): AgentDecision {
  if (source !== "local-script") {
    return {
      allowed: false,
      reason: "Remote agents are disabled. No API spend, no wagers, no chip authority, no self-granted permissions.",
    };
  }
  if (!action || typeof action.type !== "string" || !LOCAL_TYPES.has(action.type)) {
    return { allowed: false, reason: "Only local talk, move, and emote actions are in the contract." };
  }
  return { allowed: true, action: action as AgentAction, reason: "Local script accepted. It cannot touch chips or paid services." };
}

export function scriptedObservation(sceneId: string, nearby: string[], objective: string | null, tokens: number): AgentObservation {
  return { sceneId, nearbyActorIds: nearby, objective, streetTokensVisible: tokens };
}
