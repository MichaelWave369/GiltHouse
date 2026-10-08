import { useState } from "react";
import { playCoup, baccaratTotal, type CoupSide } from "@/lib/casino/baccarat";
import type { Card } from "@/lib/casino/cards";
import { playCue } from "@/lib/casino/audio";
import { chips, useCasino } from "@/lib/casino/store";
import { PlayingCard } from "@/components/casino/playing-card";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

const STAKES = [20, 100, 200];

export function Baccarat() {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const settle = useCasino((s) => s.settle);
  const [shoe, setShoe] = useState<Card[]>([]);
  const [side, setSide] = useState<CoupSide>("player");
  const [stake, setStake] = useState(20);
  const [player, setPlayer] = useState<Card[]>([]);
  const [banker, setBanker] = useState<Card[]>([]);
  const [note, setNote] = useState("Player, banker, or a tie. One coup.");
  const [net, setNet] = useState<number | null>(null);

  function deal() {
    if (bank < stake) return;
    playCue("card", sound);
    const coup = playCoup(shoe, side, stake);
    setShoe(coup.shoe);
    setPlayer(coup.player);
    setBanker(coup.banker);
    setNote(coup.note);
    setNet(coup.net);
    settle(coup.net, "baccarat", coup.note);
    playCue(coup.net > 0 ? "win" : coup.net < 0 ? "lose" : "chip", sound);
  }

  return (
    <Frame>
      <TopBar title="The Salon" eyebrow="Baccarat · punto banco" />
      <BrokeBanner />
      <p className="sr-only" aria-live="polite">
        {note}
      </p>
      <div className="felt-well rounded-xl border border-line bg-felt-deep px-3 py-5 sm:px-5">
        <Side label="Player" total={player.length ? baccaratTotal(player) : null} cards={player} />
        <div className="my-5 h-px bg-line" />
        <Side label="Banker" total={banker.length ? baccaratTotal(banker) : null} cards={banker} />
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
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(
          [
            ["player", "Player", "1:1"],
            ["banker", "Banker", "19:20"],
            ["tie", "Tie", "8:1"],
          ] as const
        ).map(([id, label, odds]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSide(id)}
            className={`press min-h-12 rounded-xl border text-sm font-medium ${
              side === id ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
            }`}
            aria-pressed={side === id}
          >
            <span className="block">{label}</span>
            <span className={`block text-xs ${side === id ? "text-ink" : "text-cream-dim"}`}>{odds}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {STAKES.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={bank < amount}
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
        onClick={deal}
        disabled={bank < stake}
        className="press mt-3 min-h-12 w-full rounded-xl bg-gold font-medium text-ink disabled:opacity-40"
      >
        Deal {chips(stake)}
      </button>
      <p className="mt-4 text-sm leading-relaxed text-cream-dim">
        Totals are the pip count modulo ten. Banker wins pay nineteen for twenty. A tie pays eight to one and
        pushes the other two bets.
      </p>
    </Frame>
  );
}

function Side({ label, total, cards }: { label: string; total: number | null; cards: Card[] }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs tracking-widest text-cream uppercase">{label}</h2>
        <p className="font-display text-lg text-cream tabular-nums">{total === null ? "—" : total}</p>
      </div>
      <div className="flex min-h-24 flex-wrap gap-2">
        {cards.length === 0 && <PlayingCard faceDown />}
        {cards.map((card, index) => (
          <PlayingCard key={card.id} card={card} index={index} />
        ))}
      </div>
    </div>
  );
}
