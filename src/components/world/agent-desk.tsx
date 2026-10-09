import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_LOCAL_ACTIONS,
  observeLocalVisitor,
  replayLocalVisitor,
} from "@/lib/world/agent-sandbox";
import type { AgentAction } from "@/lib/world/agent";
import { NPCS, VIEW_H, VIEW_W } from "@/lib/world/content";
import { renderFrame } from "@/lib/world/draw";
import { useWorld } from "@/lib/world/store";
import { planLocalPatrol } from "@/lib/world/visitor-demo";

/**
 * Backstage rehearsal runs in an isolated virtual scene.
 * Drawing from a copied WorldState does not install a world entity, call a
 * model, mutate the actual player, or write casino/world persistence.
 */
export function AgentDesk() {
  const [snapshot] = useState(() => useWorld.getState().world);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rehearsal = useMemo(
    () => replayLocalVisitor(snapshot, actions, "local-script"),
    [snapshot, actions],
  );
  const currentStep = cursor > 0 ? rehearsal.steps[cursor - 1] : undefined;
  const position = currentStep?.xAfter ?? snapshot.x;
  const observed = useMemo(
    () => observeLocalVisitor(snapshot, position),
    [snapshot, position],
  );
  const nearby = observed.nearbyActorIds[0];
  const person = NPCS.find((npc) => npc.id === nearby);
  const atLimit = actions.length >= MAX_LOCAL_ACTIONS;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    renderFrame(
      ctx,
      { ...snapshot, x: position },
      {
        time: snapshot.worldTime + cursor * 0.25,
        walking: currentStep?.accepted === true && currentStep.type === "move",
        walkPhase: cursor,
        reduced: true,
      },
    );
  }, [snapshot, position, cursor, currentStep]);

  useEffect(() => {
    if (!playing || cursor >= actions.length) return;
    const handle = window.setTimeout(() => {
      setCursor((value) => Math.min(value + 1, actions.length));
      if (cursor + 1 >= actions.length) setPlaying(false);
    }, 450);
    return () => window.clearTimeout(handle);
  }, [playing, cursor, actions.length]);

  function add(action: AgentAction) {
    if (atLimit) return;
    const next = [...actions, action];
    setPlaying(false);
    setActions(next);
    setCursor(next.length);
  }

  function loadPatrol() {
    const demo = [...planLocalPatrol(snapshot)];
    setPlaying(false);
    setActions(demo);
    setCursor(0);
  }

  function startPlayback() {
    if (snapshot.prefs.reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    if (actions.length === 0) return;
    if (cursor >= actions.length) setCursor(0);
    setPlaying(true);
  }

  function reset() {
    setPlaying(false);
    setActions([]);
    setCursor(0);
  }

  return (
    <section aria-label="Local agent rehearsal" className="space-y-3">
      <p className="text-sm leading-relaxed text-cream-dim">
        This is a <strong className="text-cream">scripted visitor inside a visual preview</strong>.
        Watch the same pixel-art street at a visitor's hypothetical position.
        It is not a real PhiBot or NPC, and nothing changes in your actual game.
      </p>
      <div className="relative overflow-hidden rounded-xl border border-gold/50 bg-ink">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="aspect-video w-full"
          style={{ imageRendering: "pixelated" }}
          aria-label="Simulated local visitor in a read-only Neon Block world preview"
          role="img"
        />
        <p className="pointer-events-none absolute left-2 top-2 rounded bg-ink/90 px-2 py-1 text-[0.6rem] font-bold tracking-widest text-gold uppercase">
          Simulation only · No live agent
        </p>
      </div>
      <div className="rounded-xl border border-line bg-panel p-3 text-sm">
        <p className="text-cream">{snapshot.scene} · visitor x {Math.round(position)} px</p>
        <p className="mt-1 text-cream-dim">Nearby: {person?.name ?? "Nobody in talk range"}</p>
        <p className="mt-1 text-cream-dim">
          Step {cursor}/{actions.length} · {rehearsal.accepted} accepted · {rehearsal.rejected} rejected
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={loadPatrol}
          className="press min-h-11 rounded-xl border border-gold px-3 text-sm text-gold">
          Load scripted patrol
        </button>
        <button type="button" onClick={() => {
          if (playing) setPlaying(false);
          else startPlayback();
        }} disabled={actions.length === 0 || snapshot.prefs.reduced}
          className="press min-h-11 rounded-xl border border-line px-3 text-sm disabled:opacity-40">
          {playing ? "Pause playback" : "Play preview"}
        </button>
        <button type="button" disabled={cursor === 0} onClick={() => {
          setPlaying(false);
          setCursor((index) => Math.max(0, index - 1));
        }} className="press min-h-11 rounded-xl border border-line px-3 text-sm disabled:opacity-40">
          Previous step
        </button>
        <button type="button" disabled={cursor >= actions.length} onClick={() => {
          setPlaying(false);
          setCursor((index) => Math.min(actions.length, index + 1));
        }} className="press min-h-11 rounded-xl border border-line px-3 text-sm disabled:opacity-40">
          Next step
        </button>
      </div>
      <p className="text-xs text-cream-dim">
        Reduced-motion mode uses manual step controls only. The patrol is repeatable,
        with no randomness and no background execution.
      </p>

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
      <button type="button" onClick={reset}
        className="press min-h-11 w-full rounded-xl bg-gold px-4 text-sm font-medium text-ink">
        Clear rehearsal
      </button>

      <div className="rounded-xl border border-line bg-panel p-3">
        <p className="text-xs tracking-widest text-gold uppercase">Replay trace</p>
        {rehearsal.steps.length === 0 ? (
          <p className="mt-2 text-sm text-cream-dim">
            Load the patrol or choose an action. The actual game will not move.
          </p>
        ) : (
          <ol className="mt-2 max-h-44 space-y-2 overflow-auto text-sm">
            {rehearsal.steps.slice(0, cursor).slice(-8).map((step) => (
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
        UNVERIFIED_LOCAL_SIMULATION. No model, internet, automatic memory, training,
        user data transfer, saved gameplay changes, game payments, or API expenditure.
      </p>
    </section>
  );
}
