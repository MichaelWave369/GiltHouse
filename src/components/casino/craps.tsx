import { useRef, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import { resolveCraps, rollDice, type CrapsPhase, type CrapsSide } from "@/lib/casino/craps";
import { chips, useCasino } from "@/lib/casino/store";
import { DiceGL } from "@/components/casino/gl/dice";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

const STAKES = [25, 50, 100, 250];

export function Craps() {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const settle = useCasino((s) => s.settle);
  const [stake, setStake] = useState(25);
  const [side, setSide] = useState<CrapsSide>("pass");
  const [phase, setPhase] = useState<CrapsPhase>("comeout");
  const [point, setPoint] = useState<number | null>(null);
  const [left, setLeft] = useState(1);
  const [right, setRight] = useState(1);
  const [token, setToken] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [note, setNote] = useState("Pass or don't pass. Come-out roll.");
  const [net, setNet] = useState<number | null>(null);
  const pending = useRef<{ dice: [number, number]; side: CrapsSide; stake: number; phase: CrapsPhase; point: number | null } | null>(null);

  const locked = phase === "point" || rolling;
  const canRoll = !rolling && bank >= stake;

  function roll() {
    if (!canRoll) return;
    const dice = rollDice();
    pending.current = { dice, side, stake, phase, point };
    setLeft(dice[0]);
    setRight(dice[1]);
    setNet(null);
    setNote("Dice are out.");
    setRolling(true);
    setToken((value) => value + 1);
    playCue("spin", sound);
  }

  function landed() {
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    const outcome = resolveCraps(job.phase, job.point, job.dice, job.side, job.stake);
    setPhase(outcome.phase);
    setPoint(outcome.point);
    setNote(outcome.note);
    setRolling(false);
    playCue("dice", sound);
    if (outcome.net !== null) {
      setNet(outcome.net);
      settle(outcome.net, "craps", outcome.note);
      playCue(outcome.net > 0 ? "win" : outcome.net < 0 ? "lose" : "chip", sound);
    }
  }

  return (
    <Frame>
      <TopBar title="The Rail" eyebrow="Craps · pass line" />
      <BrokeBanner />
      <p className="sr-only" aria-live="polite">
        {note}
      </p>
      <div className="felt-well overflow-hidden rounded-xl border border-line bg-felt-deep">
        <DiceGL token={token} left={left} right={right} onSettled={landed} />
        <div className="flex items-end justify-between gap-3 px-4 pb-4">
          <div>
            <p className="text-xs tracking-widest text-cream uppercase">{point === null ? "Come-out" : `Point ${point}`}</p>
            <p className="font-display text-2xl text-cream italic">{note}</p>
            {net !== null && (
              <p className={`text-sm tabular-nums ${net > 0 ? "win-note text-gold" : "text-cream-dim"}`}>
                {net > 0 ? "+" : ""}
                {chips(net)}
              </p>
            )}
          </div>
          <p className="font-display text-4xl text-gold tabular-nums">{token === 0 ? "—" : left + right}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Choice active={side === "pass"} disabled={locked} onClick={() => setSide("pass")}>
          Pass
        </Choice>
        <Choice active={side === "dont"} disabled={locked} onClick={() => setSide("dont")}>
          Don't pass
        </Choice>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {STAKES.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={locked || bank < amount}
            onClick={() => {
              setStake(amount);
              playCue("chip", sound);
            }}
            className={`press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${
              stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
            }`}
          >
            {chips(amount)}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={roll}
        disabled={!canRoll}
        className="press mt-3 min-h-12 w-full rounded-xl bg-gold font-medium text-ink disabled:opacity-40"
      >
        {rolling ? "Rolling" : phase === "point" ? `Roll the point · ${chips(stake)}` : `Roll ${chips(stake)}`}
      </button>
      <p className="mt-4 text-sm leading-relaxed text-cream-dim">
        Come-out: 7 and 11 win the pass line. 2, 3, and 12 lose it. Twelve is a push on don't pass. After a
        point, the pass line wants that number before a seven.
      </p>
    </Frame>
  );
}

function Choice({
  children,
  active,
  disabled,
  onClick,
}: {
  children: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`press min-h-12 rounded-xl border font-medium disabled:opacity-40 ${
        active ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
