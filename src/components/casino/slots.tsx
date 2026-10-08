import { useEffect, useRef, useState } from "react";
import { Bell, Cherry, Citrus, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { playCue } from "@/lib/casino/audio";
import {
  IDLE_GRID,
  PAY,
  SYMBOLS,
  evaluate,
  randomSym,
  spinGrid,
  type Grid,
  type Sym,
} from "@/lib/casino/slots";
import { chips, useCasino } from "@/lib/casino/store";
import { ReelColumn } from "@/components/casino/reel-column";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

const STAKES = [15, 30, 75, 150];

const FACE: Record<Sym, { tile: string; fg: string; icon?: LucideIcon; text?: string }> = {
  seven: { tile: "bg-oxblood", fg: "text-cream", text: "7" },
  crown: { tile: "bg-gold", fg: "text-ink", icon: Crown },
  bell: { tile: "bg-cream", fg: "text-ink", icon: Bell },
  cherry: { tile: "bg-panel", fg: "text-oxblood", icon: Cherry },
  citrus: { tile: "bg-felt", fg: "text-gold", icon: Citrus },
};

export function Slots() {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const settle = useCasino((s) => s.settle);
  const [stake, setStake] = useState(15);
  const [grid, setGrid] = useState<Grid>(IDLE_GRID);
  const [spinning, setSpinning] = useState(false);
  const [winRows, setWinRows] = useState<number[]>([]);
  const [note, setNote] = useState("Three lines. Left to right. Sevens pay the room.");
  const [net, setNet] = useState<number | null>(null);
  const [rolling, setRolling] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const token = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      token.current += 1;
      for (const id of timers.current) window.clearTimeout(id);
    };
  }, []);

  function finish(finalGrid: Grid, bet: number, id: number) {
    if (token.current !== id) return;
    const scored = evaluate(finalGrid, bet);
    setGrid(finalGrid);
    setSpinning(false);
    setWinRows(scored.lines.map((line) => line.row));
    setNote(scored.note);
    setNet(scored.net);
    settle(scored.net, "slots", scored.note);
    playCue(scored.net > 0 ? "win" : "lose", sound);
  }

  function spin() {
    if (spinning || stake > bank) return;
    const finalGrid = spinGrid();
    const id = token.current + 1;
    token.current = id;
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
    setSpinning(true);
    setRolling([true, true, true]);
    setWinRows([]);
    setNet(null);
    setNote("Reels turning.");
    playCue("spin", sound);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finish(finalGrid, stake, id);
      return;
    }

    const stopAt = (col: number, delay: number) => {
      const timer = window.setTimeout(() => {
        if (token.current !== id) return;
        setGrid((prev) => {
          const next = prev.map((column) => [...column]) as Grid;
          const column = finalGrid[col];
          if (column) next[col] = column;
          return next;
        });
        setRolling((prev) => {
          const next: [boolean, boolean, boolean] = [prev[0], prev[1], prev[2]];
          next[col] = false;
          return next;
        });
        if (col === 2) {
          const later = window.setTimeout(() => finish(finalGrid, stake, id), 280);
          timers.current.push(later);
        }
      }, delay);
      timers.current.push(timer);
    };
    stopAt(0, 900);
    stopAt(1, 1450);
    stopAt(2, 2000);
  }

  return (
    <Frame>
      <TopBar title="Vesper Reels" eyebrow="One spin · three lines" />
      <BrokeBanner />
      <p className="sr-only" aria-live="polite">
        {note}
      </p>

      <div className="felt-well rounded-xl border border-gold/50 bg-felt-deep p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((col) => (
            <ReelColumn
              key={col}
              rows={3}
              rolling={rolling[col] ?? false}
              stopped={grid[col] ?? ["citrus", "citrus", "citrus"]}
              next={randomSym}
              render={(sym, index) => (
                <SymbolTile
                  sym={sym}
                  win={!spinning && index < 3 && winRows.includes(index)}
                  spinning={false}
                />
              )}
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
          Pays are times the line bet. A spin covers three lines, so each line is one third of the
          stake. Two of a kind must be the first two reels.
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
            {SYMBOLS.map((sym) => (
              <tr key={sym} className="border-t border-line">
                <td className="py-2 text-cream">{PAY[sym].label}</td>
                <td className="py-2 text-gold tabular-nums">{PAY[sym].p2}×</td>
                <td className="py-2 text-gold tabular-nums">{PAY[sym].p3}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Frame>
  );
}

function SymbolTile({ sym, win, spinning }: { sym: Sym; win: boolean; spinning: boolean }) {
  const face = FACE[sym];
  const Icon = face.icon;
  return (
    <div
      className={`flex aspect-square items-center justify-center overflow-hidden rounded-lg ${face.tile} ${face.fg} ${
        win ? "win-pulse ring-2 ring-gold" : ""
      } ${spinning ? "reel-spin" : "reel-land"}`}
    >
      {face.text ? (
        <span className="font-display text-4xl italic sm:text-5xl">{face.text}</span>
      ) : Icon ? (
        <Icon className="size-8 sm:size-10" aria-hidden />
      ) : null}
    </div>
  );
}
