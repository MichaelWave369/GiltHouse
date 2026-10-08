import { useMemo, useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import { playCue } from "@/lib/casino/audio";
import {
  WHEEL,
  betKey,
  betLabel,
  betOdds,
  pocketName,
  pocketTone,
  settleWheel,
  type Bet,
  type SlipLine,
} from "@/lib/casino/roulette";
import { chips, useCasino } from "@/lib/casino/store";
import { WheelGL } from "@/components/casino/gl/wheel";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

const DENOMS = [5, 25, 100, 500];

type Placement = { id: string; bet: Bet; amount: number };

const TONE: Record<ReturnType<typeof pocketTone>, string> = {
  felt: "bg-felt text-cream",
  oxblood: "bg-oxblood text-cream",
  ink: "bg-ink text-cream border border-line",
};

export function Roulette() {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const settle = useCasino((s) => s.settle);
  const [denom, setDenom] = useState(25);
  const [slip, setSlip] = useState<Placement[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [token, setToken] = useState(0);
  const [aim, setAim] = useState(0);
  const [landed, setLanded] = useState<number | null>(null);
  const [note, setNote] = useState("Choose a chip, then touch the layout.");
  const [net, setNet] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const pending = useRef<{ n: number; lines: SlipLine[] } | null>(null);

  const lines = useMemo(() => aggregate(slip), [slip]);
  const stake = lines.reduce((sum, line) => sum + line.amount, 0);
  const covered = new Map(lines.map((line) => [betKey(line.bet), line.amount]));

  function place(bet: Bet) {
    if (spinning) return;
    if (stake + denom > bank) {
      setNote("That chip is more than the purse allows.");
      return;
    }
    playCue("chip", sound);
    setNet(null);
    setSlip((prev) => [...prev, { id: crypto.randomUUID(), bet, amount: denom }]);
    setNote(`${betLabel(bet)} · ${betOdds(bet)}`);
  }

  function undo() {
    if (spinning || slip.length === 0) return;
    setSlip((prev) => prev.slice(0, -1));
  }

  function clearSlip() {
    if (spinning) return;
    setSlip([]);
    setNote("Layout cleared.");
  }

  function finish() {
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    setSpinning(false);
    const settled = settleWheel(job.lines, job.n);
    setLanded(job.n);
    setHistory((prev) => [job.n, ...prev].slice(0, 10));
    setNet(settled.net);
    const text =
      settled.net > 0
        ? `${pocketName(job.n)} pays.`
        : settled.net === 0
          ? `${pocketName(job.n)}. Push.`
          : `${pocketName(job.n)}. The house keeps the slip.`;
    setNote(text);
    settle(settled.net, "roulette", `${pocketName(job.n)} · ${text}`);
    setSlip([]);
    playCue(settled.net > 0 ? "win" : "lose", sound);
  }

  function spin() {
    if (spinning || stake <= 0 || stake > bank) return;
    const n = Math.floor(Math.random() * 37);
    const idx = WHEEL.indexOf(n as (typeof WHEEL)[number]);
    pending.current = { n, lines };
    setLanded(null);
    setNet(null);
    setNote("The ball is out.");
    setSpinning(true);
    setAim(idx);
    setToken((value) => value + 1);
    playCue("spin", sound);
  }

  return (
    <Frame>
      <TopBar title="The Wheel" eyebrow="European · one zero" />
      <BrokeBanner />
      <p className="sr-only" aria-live="polite">
        {note}
      </p>

      <div className="mx-auto w-full max-w-sm">
        <WheelGL token={token} pocketIndex={aim} onSettled={finish} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-2xl text-cream italic">
            {landed === null ? "Awaiting the drop" : pocketName(landed)}
          </p>
          <p className="mt-1 text-sm text-cream-dim">{note}</p>
          {net !== null && (
            <p className={`text-sm tabular-nums ${net > 0 ? "win-note text-gold" : "text-cream-dim"}`}>
              {net > 0 ? "+" : ""}
              {chips(net)}
            </p>
          )}
        </div>
        {history.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1" aria-label="Recent numbers">
            {history.map((n, i) => (
              <span
                key={`${n}-${i}`}
                className={`flex size-8 items-center justify-center rounded-full text-xs tabular-nums ${TONE[pocketTone(n)]}`}
              >
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Chip value">
        {DENOMS.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={spinning}
            onClick={() => setDenom(amount)}
            className={`press min-h-11 min-w-14 rounded-full border px-3 text-sm font-medium tabular-nums ${
              denom === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
            }`}
            aria-pressed={denom === amount}
          >
            {chips(amount)}
          </button>
        ))}
      </div>

      <div className={`mt-4 ${spinning ? "pointer-events-none opacity-60" : ""}`}>
        <div className="grid grid-cols-4 gap-1">
          <Pocket n={0} hot={covered.has("n:0")} onPlace={place} span />
          {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
            <Pocket key={n} n={n} hot={covered.has(`n:${n}`)} onPlace={place} />
          ))}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1">
          {([1, 2, 3] as const).map((dozen) => (
            <Outside
              key={dozen}
              label={dozen === 1 ? "1st 12" : dozen === 2 ? "2nd 12" : "3rd 12"}
              odds="2:1"
              hot={covered.has(`d:${dozen}`)}
              onClick={() => place({ kind: "dozen", dozen })}
            />
          ))}
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1">
          <Outside label="1–18" odds="1:1" hot={covered.has("h:low")} onClick={() => place({ kind: "half", half: "low" })} />
          <Outside label="Even" odds="1:1" hot={covered.has("p:even")} onClick={() => place({ kind: "parity", parity: "even" })} />
          <Outside label="Red" odds="1:1" hot={covered.has("c:red")} tone="oxblood" onClick={() => place({ kind: "color", color: "red" })} />
          <Outside label="Black" odds="1:1" hot={covered.has("c:black")} tone="ink" onClick={() => place({ kind: "color", color: "black" })} />
          <Outside label="Odd" odds="1:1" hot={covered.has("p:odd")} onClick={() => place({ kind: "parity", parity: "odd" })} />
          <Outside label="19–36" odds="1:1" hot={covered.has("h:high")} onClick={() => place({ kind: "half", half: "high" })} />
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {([1, 2, 3] as const).map((column) => (
            <Outside
              key={column}
              label={`Col ${column}`}
              odds="2:1"
              hot={covered.has(`col:${column}`)}
              onClick={() => place({ kind: "column", column })}
            />
          ))}
        </div>
      </div>

      <section className="mt-4 rounded-xl border border-line bg-ink-2 px-4 py-3" aria-label="Betting slip">
        {lines.length === 0 ? (
          <p className="text-sm text-cream-dim">Slip is empty.</p>
        ) : (
          <ul className="space-y-1">
            {lines.map((line) => (
              <li key={betKey(line.bet)} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-cream">
                  {line.label}{" "}
                  <span className="text-cream-dim">{betOdds(line.bet)}</span>
                </span>
                <span className="text-gold tabular-nums">{chips(line.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm text-cream-dim tabular-nums">On the table · {chips(stake)}</p>
      </section>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={spinning || slip.length === 0}
          className="press flex min-h-12 items-center justify-center rounded-xl border border-line bg-panel text-cream disabled:opacity-40"
          aria-label="Undo last chip"
        >
          <Undo2 className="size-5" />
        </button>
        <button
          type="button"
          onClick={clearSlip}
          disabled={spinning || slip.length === 0}
          className="press min-h-12 rounded-xl border border-line bg-panel text-sm text-cream disabled:opacity-40"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={spin}
          disabled={spinning || stake <= 0 || stake > bank}
          className="press col-span-2 min-h-12 rounded-xl bg-gold text-base font-medium text-ink disabled:opacity-40"
        >
          {spinning ? "Spinning" : `Spin ${chips(stake)}`}
        </button>
      </div>
      <p className="mt-4 text-sm text-cream-dim">
        Zero loses every outside bet. Each pocket is 1 in 37. House edge 2.7%.
      </p>
    </Frame>
  );
}

function aggregate(slip: Placement[]): (SlipLine & { label: string })[] {
  const map = new Map<string, SlipLine & { label: string }>();
  for (const chip of slip) {
    const key = betKey(chip.bet);
    const found = map.get(key);
    if (found) found.amount += chip.amount;
    else map.set(key, { bet: chip.bet, amount: chip.amount, label: betLabel(chip.bet) });
  }
  return [...map.values()];
}

function Pocket({
  n,
  hot,
  onPlace,
  span,
}: {
  n: number;
  hot: boolean;
  onPlace: (bet: Bet) => void;
  span?: boolean;
}) {
  const tone = pocketTone(n);
  const col = span ? 1 : ((n - 1) % 3) + 2;
  const row = span ? undefined : Math.ceil(n / 3);
  return (
    <button
      type="button"
      onClick={() => onPlace({ kind: "straight", n })}
      style={span ? { gridColumn: 1, gridRow: "1 / span 12" } : { gridColumn: col, gridRow: row }}
      className={`press flex min-h-11 items-center justify-center rounded-md text-sm font-medium tabular-nums ${TONE[tone]} ${hot ? "ring-2 ring-gold" : ""}`}
      aria-label={`Bet ${pocketName(n)} straight`}
    >
      {n}
    </button>
  );
}

function Outside({
  label,
  odds,
  onClick,
  hot,
  tone = "panel",
}: {
  label: string;
  odds: string;
  onClick: () => void;
  hot: boolean;
  tone?: "panel" | "oxblood" | "ink";
}) {
  const face =
    tone === "oxblood"
      ? "bg-oxblood text-cream"
      : tone === "ink"
        ? "bg-ink text-cream border border-line"
        : "bg-panel text-cream border border-line";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press min-h-12 rounded-md px-2 text-sm font-medium ${face} ${hot ? "ring-2 ring-gold" : ""}`}
    >
      <span className="block">{label}</span>
      <span className="block text-xs text-cream-dim">{odds}</span>
    </button>
  );
}
