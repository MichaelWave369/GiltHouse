import { useEffect, useRef, useState } from "react";
import { CircleDot, Gem, Martini, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { playCue } from "@/lib/casino/audio";
import {
  IDLE_LINE,
  NIGHT_PAY,
  NIGHTS,
  evaluateHours,
  randomNight,
  spinLine,
  type Night,
  type NightLine,
} from "@/lib/casino/afterhours";
import { chips, useCasino } from "@/lib/casino/store";
import { ReelColumn } from "@/components/casino/reel-column";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

const STAKES = [20, 50, 100, 200];

const FACE: Record<Night, { tile: string; fg: string; icon?: LucideIcon; text?: string }> = {
  gem: { tile: "bg-gold", fg: "text-ink", icon: Gem },
  coupe: { tile: "bg-oxblood", fg: "text-cream", icon: Martini },
  star: { tile: "bg-cream", fg: "text-ink", icon: Star },
  olive: { tile: "bg-felt", fg: "text-gold", icon: CircleDot },
  chip: { tile: "bg-panel", fg: "text-gold", text: "¢" },
};

export function AfterHours() {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const settle = useCasino((s) => s.settle);
  const [stake, setStake] = useState(20);
  const [line, setLine] = useState<NightLine>(IDLE_LINE);
  const [rolling, setRolling] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState(false);
  const [note, setNote] = useState("One line. The first two reels open the pay.");
  const [net, setNet] = useState<number | null>(null);
  const token = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      token.current += 1;
      for (const id of timers.current) window.clearTimeout(id);
    };
  }, []);

  function finish(finalLine: NightLine, bet: number, id: number) {
    if (token.current !== id) return;
    const scored = evaluateHours(finalLine, bet);
    setLine(finalLine);
    setSpinning(false);
    setRolling([false, false, false]);
    setWin(scored.mult > 0);
    setNote(scored.note);
    setNet(scored.net);
    settle(scored.net, "afterhours", scored.note);
    playCue(scored.net > 0 ? "win" : "lose", sound);
  }

  function spin() {
    if (spinning || stake > bank) return;
    const finalLine = spinLine();
    const id = token.current + 1;
    token.current = id;
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
    setSpinning(true);
    setRolling([true, true, true]);
    setWin(false);
    setNet(null);
    setNote("Reels turning.");
    playCue("spin", sound);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finish(finalLine, stake, id);
      return;
    }
    [0, 1, 2].forEach((col) => {
      const timer = window.setTimeout(() => {
        if (token.current !== id) return;
        setLine((prev) => {
          const next = [...prev] as NightLine;
          const symbol = finalLine[col];
          if (symbol) next[col] = symbol;
          return next;
        });
        setRolling((prev) => {
          const next: [boolean, boolean, boolean] = [prev[0], prev[1], prev[2]];
          next[col] = false;
          return next;
        });
        if (col === 2) {
          const later = window.setTimeout(() => finish(finalLine, stake, id), 280);
          timers.current.push(later);
        }
      }, 800 + col * 550);
      timers.current.push(timer);
    });
  }

  return (
    <Frame>
      <TopBar title="After Hours" eyebrow="One line · three reels" />
      <BrokeBanner />
      <p className="sr-only" aria-live="polite">
        {note}
      </p>
      <div className="felt-well rounded-xl border border-gold/50 bg-felt-deep p-3 sm:p-4">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {[0, 1, 2].map((col) => (
            <ReelColumn
              key={col}
              rows={1}
              rolling={rolling[col] ?? false}
              stopped={[line[col] ?? "chip"]}
              next={randomNight}
              render={(sym) => <NightTile sym={sym} win={win && !spinning} />}
            />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <p className="font-display text-2xl text-cream italic">{note}</p>
        {net !== null && (
          <p className={`mt-1 text-sm tabular-nums ${net > 0 ? "win-note text-gold" : "text-cream-dim"}`}>
            {net > 0 ? "+" : ""}
            {chips(net)}
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Spin stake">
        {STAKES.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={spinning || bank < amount}
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
        onClick={spin}
        disabled={spinning || stake > bank}
        className="press mt-3 min-h-12 w-full rounded-xl bg-gold text-base font-medium text-ink disabled:opacity-40"
      >
        {spinning ? "Spinning" : `Spin ${chips(stake)}`}
      </button>
      <details className="mt-5 rounded-xl border border-line bg-ink-2 px-4 py-3">
        <summary className="min-h-11 cursor-pointer text-sm font-medium text-cream">Paytable</summary>
        <p className="mt-2 text-sm text-cream-dim">
          One line, stake on the line. Two of a kind must be the first two reels. Three of a kind pays the whole window.
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs tracking-widest text-cream-dim uppercase">
            <tr>
              <th className="py-2 font-medium">Symbol</th>
              <th className="py-2 font-medium">Two</th>
              <th className="py-2 font-medium">Three</th>
            </tr>
          </thead>
          <tbody>
            {NIGHTS.map((sym) => (
              <tr key={sym} className="border-t border-line">
                <td className="py-2 text-cream">{NIGHT_PAY[sym].label}</td>
                <td className="py-2 text-gold tabular-nums">{NIGHT_PAY[sym].p2}×</td>
                <td className="py-2 text-gold tabular-nums">{NIGHT_PAY[sym].p3}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Frame>
  );
}

function NightTile({ sym, win }: { sym: Night; win: boolean }) {
  const face = FACE[sym];
  const Icon = face.icon;
  return (
    <div
      className={`flex aspect-square items-center justify-center rounded-lg ${face.tile} ${face.fg} ${
        win ? "win-pulse ring-2 ring-gold" : ""
      }`}
    >
      {face.text ? (
        <span className="font-display text-4xl italic">{face.text}</span>
      ) : Icon ? (
        <Icon className="size-10" aria-hidden />
      ) : null}
    </div>
  );
}
