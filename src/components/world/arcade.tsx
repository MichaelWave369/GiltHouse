import { useEffect, useRef, useState } from "react";

const COLORS = [
  { id: "gold", label: "Gold", className: "bg-gold text-ink" },
  { id: "teal", label: "Teal", className: "bg-felt text-cream" },
  { id: "oxblood", label: "Ruby", className: "bg-oxblood text-cream" },
  { id: "violet", label: "Violet", className: "bg-panel text-gold" },
] as const;

export function PulseGame({ onDone, onClose }: { onDone: (score: number, total: number) => void; onClose: () => void }) {
  const total = 8;
  const [armed, setArmed] = useState(false);
  const [beat, setBeat] = useState(0);
  const [hits, setHits] = useState(0);
  const [pos, setPos] = useState(0);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  const hitsRef = useRef(0);
  const done = useRef(false);
  const start = useRef(0);
  const finishTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (finishTimer.current != null) window.clearTimeout(finishTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!armed) return;
    start.current = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      const t = ((now - start.current) / 800) % 1;
      const sweep = t < 0.5 ? t * 2 : (1 - t) * 2;
      setPos(sweep);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [armed]);

  function strike() {
    if (!armed || done.current || beat >= total) return;
    const good = pos > 0.4 && pos < 0.6;
    const nextHits = hitsRef.current + (good ? 1 : 0);
    hitsRef.current = nextHits;
    setHits(nextHits);
    setFlash(good ? "hit" : "miss");
    const nextBeat = beat + 1;
    setBeat(nextBeat);
    if (nextBeat >= total) {
      done.current = true;
      finishTimer.current = window.setTimeout(() => onDone(nextHits, total), 450);
    }
  }

  if (!armed) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-2xl text-cream italic">Pulse Line</h3>
        <p className="text-sm text-cream-dim">Eight beats. Catch the sweep inside the gold window. A good set pays street tokens. It never pays chips.</p>
        <div className="flex gap-2">
          <button type="button" className="press h-12 flex-1 rounded-full bg-gold font-medium text-ink" onClick={() => setArmed(true)}>
            Start
          </button>
          <button type="button" className="press h-12 rounded-full border border-line px-4 text-cream" onClick={onClose}>
            Leave
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl text-cream italic">Pulse Line</h3>
        <p className="text-sm text-cream-dim">
          {hits}/{Math.min(beat, total)} · {total} beats
        </p>
      </div>
      <p className="text-sm text-cream-dim">Catch the sweep in the gold window. Timing only — the cabinet pays street tokens, never chips.</p>
      <div className="relative h-12 overflow-hidden rounded-full border border-line bg-ink">
        <div className="absolute inset-y-0 left-[40%] w-[20%] bg-gold/30" />
        <div className="absolute top-1 bottom-1 w-3 rounded-full bg-gold" style={{ left: `calc(${pos * 100}% - 6px)` }} />
      </div>
      <p className="min-h-5 text-sm text-gold" aria-live="polite">
        {flash === "hit" ? "On the window." : flash === "miss" ? "Early or late." : "Wait for the gold."}
      </p>
      <div className="flex gap-2">
        <button type="button" className="press h-12 flex-1 rounded-full bg-gold font-medium text-ink" onClick={strike}>
          Hit
        </button>
        <button type="button" className="press h-12 rounded-full border border-line px-4 text-cream" onClick={onClose}>
          Leave
        </button>
      </div>
    </div>
  );
}

export function MemoryGame({ onDone, onClose }: { onDone: (score: number, total: number) => void; onClose: () => void }) {
  const total = 3;
  const [armed, setArmed] = useState(false);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"show" | "input">("show");
  const [lit, setLit] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const sequences = useRef<number[][]>([]);
  const score = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    if (!armed) return;
    if (sequences.current.length === 0) {
      let seed = 369;
      sequences.current = [0, 1, 2].map((roundIndex) => {
        const length = roundIndex + 3;
        return Array.from({ length }, () => {
          seed = (seed * 17 + 11) % 97;
          return seed % COLORS.length;
        });
      });
    }
    const sequence = sequences.current[round];
    if (!sequence) return;
    let cancelled = false;
    setPhase("show");
    setCursor(0);
    let step = 0;
    const timer = window.setInterval(() => {
      if (cancelled) return;
      if (step >= sequence.length) {
        window.clearInterval(timer);
        setLit(null);
        setPhase("input");
        return;
      }
      setLit(sequence[step] ?? null);
      step += 1;
    }, 520);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [round, armed]);

  if (!armed) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-2xl text-cream italic">Marquee Memory</h3>
        <p className="text-sm text-cream-dim">Three rounds. Watch the bulbs, then repeat them. A miss ends the set. Tokens only, and only if the cabinet says so.</p>
        <div className="flex gap-2">
          <button type="button" className="press h-12 flex-1 rounded-full bg-gold font-medium text-ink" onClick={() => setArmed(true)}>
            Start
          </button>
          <button type="button" className="press h-12 rounded-full border border-line px-4 text-cream" onClick={onClose}>
            Leave
          </button>
        </div>
      </div>
    );
  }

  function pick(index: number) {
    if (phase !== "input" || done.current) return;
    const sequence = sequences.current[round] ?? [];
    if (sequence[cursor] !== index) {
      done.current = true;
      onDone(score.current, total);
      return;
    }
    const next = cursor + 1;
    if (next >= sequence.length) {
      score.current += 1;
      if (round + 1 >= total) {
        done.current = true;
        onDone(score.current, total);
        return;
      }
      setRound(round + 1);
      return;
    }
    setCursor(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-2xl text-cream italic">Marquee Memory</h3>
        <p className="text-sm text-cream-dim">Round {Math.min(round + 1, total)} / {total}</p>
      </div>
      <p className="text-sm text-cream-dim">
        {phase === "show" ? "Watch the bulbs." : "Repeat them. A miss ends the set."}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {COLORS.map((color, index) => (
          <button
            key={color.id}
            type="button"
            className={`press h-14 rounded-xl border border-line ${color.className} ${lit === index ? "brightness-150" : "opacity-80"}`}
            onClick={() => pick(index)}
          >
            {color.label}
          </button>
        ))}
      </div>
      <button type="button" className="press h-11 rounded-full border border-line text-cream" onClick={onClose}>
        Leave the cabinet
      </button>
    </div>
  );
}
