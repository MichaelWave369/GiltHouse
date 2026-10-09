/**
 * Future agent boundary for The Neon Block.
 * Disabled remote control. Local scripts only.
 * An agent must not spend API money, place wagers, read customer data,
 * touch casino chip authority, or grant its own permissions.
 */

import { NPCS } from "./content.ts";

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

const NPC_IDS = new Set(NPCS.map((npc) => npc.id));
const EMOTES = new Set(["wave", "listen"]);
const BANNED = [
  "wager",
  "chips",
  "bank",
  "spendApi",
  "selfGrant",
  "remote",
  "permission",
  "entitlement",
  "chipBank",
  "apiKey",
  "customer",
] as const;

function bannedField(value: object): string | null {
  for (const key of BANNED) {
    if (Object.prototype.hasOwnProperty.call(value, key)) return key;
  }
  return null;
}

export function reviewAgentAction(action: unknown, source: string): AgentDecision {
  if (source !== "local-script") {
    return {
      allowed: false,
      reason: "Remote agents are disabled. No API spend, no wagers, no chip authority, no self-granted permissions.",
    };
  }
  if (!action || typeof action !== "object" || Array.isArray(action)) {
    return { allowed: false, reason: "An action must be a local object, not a payload from elsewhere." };
  }
  const row = action as Record<string, unknown>;
  const banned = bannedField(row);
  if (banned) {
    return { allowed: false, reason: `Privileged field "${banned}" is not available to a local script.` };
  }
  if (row.type === "move") {
    if (row.dir !== -1 && row.dir !== 1) {
      return { allowed: false, reason: "Movement direction must be exactly -1 or 1." };
    }
    return { allowed: true, action: { type: "move", dir: row.dir }, reason: "Local move accepted. It cannot touch chips or paid services." };
  }
  if (row.type === "talk") {
    if (typeof row.npcId !== "string" || !NPC_IDS.has(row.npcId)) {
      return { allowed: false, reason: "Talk needs a real person who already lives on the block." };
    }
    return { allowed: true, action: { type: "talk", npcId: row.npcId }, reason: "Local talk accepted. It cannot touch chips or paid services." };
  }
  if (row.type === "emote") {
    if (typeof row.npcId !== "string" || !NPC_IDS.has(row.npcId)) {
      return { allowed: false, reason: "Emote needs a real person who already lives on the block." };
    }
    if (typeof row.emote !== "string" || !EMOTES.has(row.emote)) {
      return { allowed: false, reason: "Emotes are wave or listen. Nothing else." };
    }
    return {
      allowed: true,
      action: { type: "emote", npcId: row.npcId, emote: row.emote as "wave" | "listen" },
      reason: "Local emote accepted. It cannot touch chips or paid services.",
    };
  }
  return { allowed: false, reason: "Only local talk, move, and emote actions are in the contract." };
}

export function scriptedObservation(sceneId: string, nearby: string[], objective: string | null, tokens: number): AgentObservation {
  return { sceneId, nearbyActorIds: nearby, objective, streetTokensVisible: tokens };
}
