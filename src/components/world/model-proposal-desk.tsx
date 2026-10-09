import { useEffect, useMemo, useRef, useState } from "react";
import { renderFrame } from "@/lib/world/draw";
import { VIEW_H, VIEW_W } from "@/lib/world/content";
import {
  MAX_MODEL_PROPOSAL_CHARS,
  MODEL_PROPOSAL_SCHEMA,
  buildLocalModelBrief,
  inspectModelProposal,
  parseModelProposal,
  type ProposalInspection,
} from "@/lib/world/model-proposal";
import type { WorldState } from "@/lib/world/types";

/**
 * Pasted local-model suggestions are UNTRUSTED text. This panel does not call
 * any model, accept credentials, import tools, dispatch agent actions, or write
 * into either world/casino store. Preview uses an isolated WorldState copy.
 */
export function ModelProposalDesk({ snapshot }: { snapshot: WorldState }) {
  const briefing = useMemo(() => buildLocalModelBrief(snapshot), [snapshot]);
  const [raw, setRaw] = useState("");
  const [inspected, setInspected] = useState<ProposalInspection | null>(null);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState(0);
  const [copyNote, setCopyNote] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const briefingRef = useRef<HTMLTextAreaElement>(null);
  const currentStep = cursor > 0 ? inspected?.steps[cursor - 1] : undefined;
  const x = currentStep?.xAfter ?? snapshot.x;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    renderFrame(ctx, { ...snapshot, x }, {
      time: snapshot.worldTime + cursor * 0.25,
      walking: currentStep?.validInScene === true && currentStep.action.type === "move",
      walkPhase: cursor,
      reduced: true,
    });
  }, [snapshot, x, cursor, currentStep, inspected]);

  function updateRaw(next: string) {
    setRaw(next.slice(0, MAX_MODEL_PROPOSAL_CHARS));
    setInspected(null);
    setCursor(0);
    setError("");
  }

  function inspect() {
    setInspected(null);
    setCursor(0);
    const parsed = parseModelProposal(raw);
    if (!parsed.ok) {
      setError(`${parsed.code}: ${parsed.reason}`);
      return;
    }
    setError("");
    setInspected(inspectModelProposal(snapshot, parsed.actions));
  }

  async function copyBriefing() {
    try {
      await navigator.clipboard.writeText(briefing);
      setCopyNote("Briefing copied. No data was sent to an AI provider.");
    } catch {
      briefingRef.current?.focus();
      briefingRef.current?.select();
      setCopyNote("Select and copy this briefing manually. Your browser blocked clipboard access.");
    }
  }

  function example() {
    updateRaw(JSON.stringify({
      schema: MODEL_PROPOSAL_SCHEMA,
      actions: [{ type: "move", dir: 1 }, { type: "move", dir: -1 }],
    }, null, 2));
  }

  return (
    <details className="mt-4 rounded-xl border border-line bg-panel p-3">
      <summary className="cursor-pointer text-sm font-semibold text-gold">
        Model proposal bridge · manual, no API
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-cream-dim">
        Copy a privacy-minimal observation into a local model of your choice.
        Paste its JSON reply here to <strong className="text-cream">inspect only</strong>.
        Suggested actions cannot control this game or claim local-script authority.
        Nothing is automatically uploaded, executed, or saved.
      </p>
      <label className="mt-3 block text-xs font-medium text-cream" htmlFor="gilt-agent-briefing">
        Copy-only model briefing
      </label>
      <textarea
        id="gilt-agent-briefing"
        ref={briefingRef}
        readOnly
        value={briefing}
        rows={6}
        className="mt-2 w-full rounded-lg border border-line bg-ink p-2 font-mono text-xs text-cream"
      />
      <button type="button" onClick={copyBriefing}
        className="press mt-2 min-h-11 w-full rounded-lg border border-line px-3 text-sm text-cream">
        Copy local model briefing
      </button>
      {copyNote && <p className="mt-2 text-xs text-cream-dim" role="status">{copyNote}</p>}
      <label className="mt-4 block text-xs font-medium text-cream" htmlFor="gilt-agent-proposal">
        Paste model JSON (maximum {MAX_MODEL_PROPOSAL_CHARS} characters)
      </label>
      <textarea
        id="gilt-agent-proposal"
        value={raw}
        onChange={(event) => updateRaw(event.target.value)}
        maxLength={MAX_MODEL_PROPOSAL_CHARS}
        rows={6}
        placeholder={`{"schema":"${MODEL_PROPOSAL_SCHEMA}","actions":[{"type":"move","dir":1}]}`}
        spellCheck={false}
        className="mt-2 w-full rounded-lg border border-line bg-ink p-2 font-mono text-xs text-cream"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={inspect}
          className="press min-h-11 rounded-lg bg-gold px-2 text-sm font-medium text-ink">
          Inspect only
        </button>
        <button type="button" onClick={example}
          className="press min-h-11 rounded-lg border border-line px-2 text-sm text-cream">
          Load harmless example
        </button>
      </div>
      {error && <p role="alert" className="mt-2 rounded-lg border border-oxblood p-2 text-sm text-cream">{error}</p>}

      {inspected && (
        <div className="mt-4 space-y-2">
          <p role="status" className="text-sm font-semibold text-gold">
            Untrusted proposal inspected. {inspected.eligiblePreviewSteps}/{inspected.steps.length} steps preview-valid.
            No execution occurred.
          </p>
          <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H}
            className="aspect-video w-full rounded-lg border border-line bg-ink"
            style={{ imageRendering: "pixelated" }}
            aria-label="Preview-only hypothetical visitor, not a live agent or player"
            role="img" />
          <p className="text-xs text-cream-dim">
            Proposal-only position: {Math.round(x)} px · step {cursor}/{inspected.steps.length}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={cursor === 0}
              onClick={() => setCursor((n) => Math.max(0, n - 1))}
              className="press min-h-11 rounded-lg border border-line px-2 text-sm text-cream disabled:opacity-40">
              Previous
            </button>
            <button type="button" disabled={cursor >= inspected.steps.length}
              onClick={() => setCursor((n) => Math.min(inspected.steps.length, n + 1))}
              className="press min-h-11 rounded-lg border border-line px-2 text-sm text-cream disabled:opacity-40">
              Next
            </button>
          </div>
          <ol className="max-h-36 space-y-1 overflow-y-auto text-xs text-cream-dim">
            {inspected.steps.slice(0, cursor).map((step) => (
              <li key={step.index} className="border-b border-line py-1">
                {step.index + 1}. {step.action.type}: {step.validInScene ? "preview valid" : "not in range"}.
                {" "}{step.note}
              </li>
            ))}
          </ol>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-cream-dim">
        This manual bridge is not an Ollama connector, remote PhiBot, model training,
        execution approval, or trust elevation. API cost is zero in Gilt House.
        Your external model usage remains entirely outside this application.
      </p>
    </details>
  );
}
