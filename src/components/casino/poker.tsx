import { useState } from "react";
import { dealPoker, drawPoker, scorePoker } from "@/lib/casino/poker";
import type { Card } from "@/lib/casino/cards";
import { playCue } from "@/lib/casino/audio";
import { chips, useCasino } from "@/lib/casino/store";
import { PlayingCard } from "@/components/casino/playing-card";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

const STAKES = [5, 25, 50, 100];
const PAYS = [
  ["Royal flush", "800×"],
  ["Straight flush", "50×"],
  ["Four of a kind", "25×"],
  ["Full house", "9×"],
  ["Flush", "6×"],
  ["Straight", "4×"],
  ["Three of a kind", "3×"],
  ["Two pair", "2×"],
  ["Jacks or better", "1×"],
];

export function Poker() {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const settle = useCasino((s) => s.settle);
  const [stake, setStake] = useState(5);
  const [phase, setPhase] = useState<"bet" | "draw" | "done">("bet");
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [note, setNote] = useState("Jacks or better. Hold what you want, then draw.");
  const [net, setNet] = useState<number | null>(null);

  function deal() {
    if (bank < stake || phase === "draw") return;
    const next = dealPoker();
    setDeck(next.deck);
    setHand(next.hand);
    setHeld([false, false, false, false, false]);
    setPhase("draw");
    setNet(null);
    setNote("Tap cards to hold them.");
    playCue("card", sound);
  }

  function draw() {
    if (phase !== "draw") return;
    const next = drawPoker(deck, hand, held);
    const scored = scorePoker(next.hand);
    const payout = scored.mult * stake;
    const delta = payout - stake;
    setDeck(next.deck);
    setHand(next.hand);
    setPhase("done");
    setNote(scored.mult > 0 ? `${scored.name}. Pays ${scored.mult}×.` : scored.name);
    setNet(delta);
    settle(delta, "poker", scored.name);
    playCue(delta > 0 ? "win" : delta < 0 ? "lose" : "chip", sound);
  }

  function toggle(index: number) {
    if (phase !== "draw") return;
    setHeld((prev) => prev.map((value, i) => (i === index ? !value : value)));
    playCue("chip", sound);
  }

  return (
    <Frame>
      <TopBar title="The Draw" eyebrow="Jacks or better" />
      <BrokeBanner />
      <p className="sr-only" aria-live="polite">
        {note}
      </p>
      <div className="felt-well rounded-xl border border-line bg-felt-deep px-2 py-4 sm:px-4">
        <div className="flex justify-center gap-1.5 sm:gap-2">
          {hand.length === 0
            ? [0, 1, 2, 3, 4].map((i) => <PlayingCard key={i} faceDown compact index={i} />)
            : hand.map((card, index) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => toggle(index)}
                  className={`press text-left transition-transform duration-200 ${held[index] ? "-translate-y-2" : ""}`}
                >
                  <PlayingCard card={card} compact index={index} />
                  <span
                    className={`mt-1 block text-center text-xs tracking-widest uppercase ${
                      held[index] ? "text-gold" : "text-cream-dim"
                    }`}
                  >
                    {held[index] ? "Hold" : phase === "draw" ? "Tap" : ""}
                  </span>
                </button>
              ))}
        </div>
      </div>
      <div className="mt-4">
        <p className="font-display text-2xl text-cream italic">{note}</p>
        {net !== null && (
          <p className={`text-sm tabular-nums ${net > 0 ? "win-note text-gold" : "text-cream-dim"}`}>
            {net > 0 ? "+" : ""}
            {chips(net)}
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {STAKES.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={phase === "draw" || bank < amount}
            onClick={() => setStake(amount)}
            className={`press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${
              stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
            }`}
          >
            {chips(amount)}
          </button>
        ))}
      </div>
      {phase === "draw" ? (
        <button type="button" onClick={draw} className="press mt-3 min-h-12 w-full rounded-xl bg-gold font-medium text-ink">
          Draw
        </button>
      ) : (
        <button
          type="button"
          onClick={deal}
          disabled={bank < stake}
          className="press mt-3 min-h-12 w-full rounded-xl bg-gold font-medium text-ink disabled:opacity-40"
        >
          {phase === "done" ? "Deal again" : "Deal"} {chips(stake)}
        </button>
      )}
      <details className="mt-5 rounded-xl border border-line bg-ink-2 px-4 py-3">
        <summary className="min-h-11 cursor-pointer text-sm font-medium text-cream">Paytable</summary>
        <ul className="mt-2 divide-y divide-line">
          {PAYS.map(([name, pay]) => (
            <li key={name} className="flex items-baseline justify-between py-2 text-sm">
              <span className="text-cream">{name}</span>
              <span className="text-gold tabular-nums">{pay}</span>
            </li>
          ))}
        </ul>
      </details>
    </Frame>
  );
}
