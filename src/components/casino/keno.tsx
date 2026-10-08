import { useEffect, useRef, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import { KENO_MAX, KENO_MIN, KENO_PAY, KENO_PICKS, drawKeno } from "@/lib/casino/keno";
import { smoothstep } from "@/lib/casino/motion";
import { chips, useCasino } from "@/lib/casino/store";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

const STAKES = [25, 50, 100, 250];
const SPOTS = Array.from({ length: KENO_MAX }, (_, index) => index + 1);

export function Keno() {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const settle = useCasino((s) => s.settle);
  const [stake, setStake] = useState(25);
  const [picks, setPicks] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [seen, setSeen] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("Pick two to six spots. Ten numbers come out of the cage.");
  const [net, setNet] = useState<number | null>(null);
  const token = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    return () => {
      token.current += 1;
      cancelAnimationFrame(frame.current);
    };
  }, []);

  function toggle(spot: number) {
    if (busy) return;
    setDrawn([]);
    setSeen(0);
    setNet(null);
    setPicks((current) => {
      if (current.includes(spot)) return current.filter((value) => value !== spot);
      if (current.length >= KENO_PICKS) return current;
      return [...current, spot];
    });
    playCue("chip", sound);
  }

  function play() {
    if (busy || picks.length < KENO_MIN || stake > bank) return;
    const ticket = drawKeno(picks);
    const id = token.current + 1;
    token.current = id;
    setBusy(true);
    setNet(null);
    setDrawn(ticket.drawn);
    setSeen(0);
    setNote("The cage is turning.");
    playCue("spin", sound);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const close = () => {
      if (token.current !== id) return;
      const scored = ticket.mult * stake - stake;
      setSeen(ticket.drawn.length);
      setBusy(false);
      setNet(scored);
      setNote(
        ticket.hits === 0
          ? "No catches. The house keeps the ticket."
          : `${ticket.hits} caught · ${ticket.mult}×`,
      );
      settle(scored, "keno", ticket.hits === 0 ? "Keno miss" : `Keno ${ticket.hits} hit`);
      playCue(scored > 0 ? "win" : "lose", sound);
    };
    if (reduce) {
      close();
      return;
    }
    const started = performance.now();
    const loop = (now: number) => {
      if (token.current !== id) return;
      const t = Math.min(1, (now - started) / 1700);
      setSeen(smoothstep(t) * ticket.drawn.length);
      if (t < 1) frame.current = requestAnimationFrame(loop);
      else close();
    };
    frame.current = requestAnimationFrame(loop);
  }

  const visible = drawn.slice(0, Math.floor(seen));
  const pay = KENO_PAY[picks.length] ?? {};

  return (
    <Frame>
      <TopBar title="The Cage" eyebrow="Keno · ten out of forty" />
      <BrokeBanner />
      <p className="sr-only" aria-live="polite">
        {note}
      </p>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
        {SPOTS.map((spot) => {
          const picked = picks.includes(spot);
          const hit = visible.includes(spot) && picked;
          const missed = visible.includes(spot) && !picked;
          return (
            <button
              key={spot}
              type="button"
              disabled={busy}
              onClick={() => toggle(spot)}
              className={`press min-h-11 rounded-md border text-sm font-medium tabular-nums disabled:opacity-80 ${
                hit
                  ? "border-gold bg-gold text-ink"
                  : missed
                    ? "border-line bg-oxblood text-cream"
                    : picked
                      ? "border-gold bg-panel text-gold"
                      : "border-line bg-ink-2 text-cream"
              }`}
              aria-pressed={picked}
            >
              {spot}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <p className="font-display text-2xl text-cream italic">{note}</p>
        <p className="mt-1 text-sm text-cream-dim tabular-nums">
          {picks.length} spot{picks.length === 1 ? "" : "s"}
          {net !== null && (
            <span className={net > 0 ? "win-note text-gold" : ""}>
              {" "}
              · {net > 0 ? "+" : ""}
              {chips(net)}
            </span>
          )}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Keno stake">
        {STAKES.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={busy || bank < amount}
            onClick={() => {
              setStake(amount);
              playCue("chip", sound);
            }}
            className={`press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${
              stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
            }`}
            aria-pressed={stake === amount}
          >
            {chips(amount)}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={play}
        disabled={busy || picks.length < KENO_MIN || stake > bank}
        className="press mt-3 min-h-12 w-full rounded-xl bg-gold text-base font-medium text-ink disabled:opacity-40"
      >
        {busy ? "Drawing" : `Draw ${chips(stake)}`}
      </button>
      <details className="mt-5 rounded-xl border border-line bg-ink-2 px-4 py-3">
        <summary className="min-h-11 cursor-pointer text-sm font-medium text-cream">Paytable</summary>
        <p className="mt-2 text-sm text-cream-dim">
          Returns are times the stake. Catches below the first paying hit return nothing. Ten numbers are drawn from forty.
        </p>
        {picks.length >= KENO_MIN ? (
          <ul className="mt-3 space-y-1 text-sm">
            {Object.entries(pay).map(([hits, mult]) => (
              <li key={hits} className="flex justify-between border-t border-line py-2">
                <span className="text-cream">{hits} caught</span>
                <span className="text-gold tabular-nums">{mult}×</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-cream-dim">Mark at least two spots to see the pays.</p>
        )}
      </details>
    </Frame>
  );
}
