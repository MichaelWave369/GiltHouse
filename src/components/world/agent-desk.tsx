import { useMemo, useState } from "react";
import {
  MAX_LOCAL_ACTIONS,
  observeLocalVisitor,
  replayLocalVisitor,
} from "@/lib/world/agent-sandbox";
import type { AgentAction } from "@/lib/world/agent";
import { NPCS } from "@/lib/world/content";
import { useWorld } from "@/lib/world/store";

/**
 * A voluntary in-browser local-script rehearsal. No action reaches the real
 * store. The displayed visitor is NOT a live agent/NPC/avatar in the world.
 */
export function AgentDesk() {
  const [snapshot] = useState(() => useWorld.getState().world);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const rehearsal = useMemo(
    () => replayLocalVisitor(snapshot, actions, "local-script"),
    [snapshot, actions],
  );
  const observed = useMemo(
    () => observeLocalVisitor(snapshot, rehearsal.endX),
    [snapshot, rehearsal.endX],
  );
  const nearby = observed.nearbyActorIds[0];
  const person = NPCS.find((npc) => npc.id === nearby);
  const atLimit = actions.length >= MAX_LOCAL_ACTIONS;

  function add(action: AgentAction) {
    setActions((current) => current.length >= MAX_LOCAL_ACTIONS ? current : [...current, action]);
  }

  return (
    <section aria-label="Local agent rehearsal" className="space-y-3">
      <p className="text-sm leading-relaxed text-cream-dim">
        A backstage rehearsal for a <strong className="text-cream">scripted visitor</strong>.
        Try bounded moves, contact, and emotes using the world rules.
        The visitor is a preview, not a live PhiBot. Nothing happens to your character,
        inventory, quests, casino chips, or saves.
      </p>
      <div className="rounded-xl border border-gold/50 bg-ink p-3 text-sm">
        <p className="text-xs tracking-widest text-gold uppercase">Local simulation · No network</p>
        <p className="mt-2 text-cream">
          {snapshot.scene} · visitor position {Math.round(rehearsal.endX)} px
        </p>
        <p className="mt-1 text-cream-dim">
          Nearby: {person?.name ?? "Nobody within talk range"}
        </p>
        <p className="mt-1 text-cream-dim">
          {rehearsal.accepted} accepted · {rehearsal.rejected} rejected · {actions.length}/{MAX_LOCAL_ACTIONS} steps
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={atLimit} onClick={() => add({ type: "move", dir: -1 })}
          className="press min-h-11 rounded-xl border border-line px-3 text-sm disabled:opacity-40">
          Rehearse left
        </button>
        <button type="button" disabled={atLimit} onClick={() => add({ type: "move", dir: 1 })}
          className="press min-h-11 rounded-xl border border-line px-3 text-sm disabled:opacity-40">
          Rehearse right
        </button>
        <button type="button" disabled={atLimit || !nearby} onClick={() => nearby && add({ type: "talk", npcId: nearby })}
          className="press min-h-11 rounded-xl border border-line px-3 text-sm disabled:opacity-40">
          Rehearse talk
        </button>
        <button type="button" disabled={atLimit || !nearby} onClick={() => nearby && add({ type: "emote", npcId: nearby, emote: "wave" })}
          className="press min-h-11 rounded-xl border border-line px-3 text-sm disabled:opacity-40">
          Rehearse wave
        </button>
      </div>

      <button type="button" onClick={() => setActions([])}
        className="press min-h-11 w-full rounded-xl bg-gold px-4 text-sm font-medium text-ink">
        Reset rehearsal
      </button>

      <div className="rounded-xl border border-line bg-panel p-3">
        <p className="text-xs tracking-widest text-gold uppercase">Replay trace</p>
        {rehearsal.steps.length === 0 ? (
          <p className="mt-2 text-sm text-cream-dim">Choose an action to preview it. The real street will not move.</p>
        ) : (
          <ol className="mt-2 max-h-44 space-y-2 overflow-auto text-sm">
            {rehearsal.steps.slice(-8).map((step) => (
              <li key={step.index} className="border-b border-line pb-2 last:border-0">
                <p className="text-cream">
                  {step.index + 1}. {step.type} · {step.accepted ? "accepted" : "rejected"}
                  {" · "}x {Math.round(step.xAfter)}
                </p>
                <p className="text-xs text-cream-dim">{step.reason}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
      <p className="text-xs leading-relaxed text-cream-dim">
        Unverified local script only. This is not model execution, training proof, a real NPC
        control connection, or authorization to use external tools. API cost: zero.
      </p>
    </section>
  );
}
