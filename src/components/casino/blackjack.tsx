import { useState, type ReactNode } from "react";
import {
  dealRound,
  doubleRound,
  emptyRound,
  handValue,
  hitRound,
  standRound,
  type Round,
} from "@/lib/casino/cards";
import { playCue } from "@/lib/casino/audio";
import { chips, useCasino } from "@/lib/casino/store";
import { PlayingCard } from "@/components/casino/playing-card";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

const WAGERS = [50, 100, 250, 500];

export function Blackjack() {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const settle = useCasino((s) => s.settle);
  const [wager, setWager] = useState(50);
  const [round, setRound] = useState<Round>(emptyRound);

  const playerTotal = round.player.length ? handValue(round.player).total : null;
  const dealerShown = round.hideHole ? round.dealer.slice(0, 1) : round.dealer;
  const dealerTotal = dealerShown.length ? handValue(dealerShown).total : null;
  const canDeal = (round.phase === "bet" || round.phase === "done") && bank >= wager;
  const canDouble = round.phase === "play" && round.player.length === 2 && bank >= round.stake * 2;

  function apply(next: Round) {
    setRound(next);
    if (next.phase === "done" && next.net !== null) {
      settle(next.net, "blackjack", next.note);
      playCue(next.net > 0 ? "win" : next.net < 0 ? "lose" : "card", sound);
    }
  }

  function onDeal() {
    if (!canDeal) return;
    playCue("card", sound);
    const base = round.phase === "done" ? { ...round, phase: "bet" as const, net: null } : round;
    apply(dealRound(base, wager));
  }

  function onHit() {
    if (round.phase !== "play") return;
    playCue("card", sound);
    apply(hitRound(round));
  }

  function onStand() {
    if (round.phase !== "play") return;
    playCue("card", sound);
    apply(standRound(round));
  }

  function onDouble() {
    if (!canDouble) return;
    playCue("card", sound);
    apply(doubleRound(round));
  }

  return (
    <Frame>
      <TopBar title="The Shoe" eyebrow="Blackjack · stands on 17" />
      <BrokeBanner />
      <p className="sr-only" aria-live="polite">
        {round.note}
        {round.net !== null ? ` ${round.net > 0 ? "Up" : "Down"} ${chips(Math.abs(round.net))}` : ""}
      </p>

      <div className="felt-well rounded-xl border border-line bg-felt-deep px-3 py-5 sm:px-5">
        <Hand
          label="Dealer"
          total={dealerTotal}
          hide={round.hideHole}
          cards={round.dealer}
        />
        <div className="my-5 h-px bg-line" />
        <Hand label="You" total={playerTotal} cards={round.player} />
      </div>

      <div className="mt-4 rounded-xl border border-line bg-ink-2 px-4 py-3">
        <p className="font-display text-xl text-cream italic">{round.note}</p>
        {round.net !== null && (
          <p className={`mt-1 text-sm tabular-nums ${round.net > 0 ? "win-note text-gold" : "text-cream-dim"}`}>
            {round.net > 0 ? "+" : ""}
            {chips(round.net)} on {chips(round.stake)}
          </p>
        )}
        {round.phase === "play" && (
          <p className="mt-1 text-sm text-cream-dim tabular-nums">In play · {chips(round.stake)}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Wager">
        {WAGERS.map((amount) => {
          const active = wager === amount;
          return (
            <button
              key={amount}
              type="button"
              disabled={round.phase === "play" || bank < amount}
              onClick={() => {
                setWager(amount);
                playCue("chip", sound);
              }}
              className={`press min-h-11 min-w-16 rounded-full border px-4 text-sm font-medium tabular-nums ${
                active
                  ? "border-gold bg-gold text-ink"
                  : "border-line bg-panel text-cream disabled:opacity-40"
              }`}
              aria-pressed={active}
            >
              {chips(amount)}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {round.phase === "play" ? (
          <>
            <Action onClick={onHit}>Hit</Action>
            <Action onClick={onStand}>Stand</Action>
            <Action onClick={onDouble} disabled={!canDouble}>
              Double
            </Action>
          </>
        ) : (
          <Action onClick={onDeal} disabled={!canDeal} wide>
            {round.phase === "done" ? "Deal again" : "Deal"}
          </Action>
        )}
      </div>
    </Frame>
  );
}

function Hand({
  label,
  total,
  cards,
  hide,
}: {
  label: string;
  total: number | null;
  cards: Round["player"];
  hide?: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs tracking-widest text-cream uppercase">{label}</h2>
        <p className="font-display text-lg text-cream tabular-nums">{total === null ? "—" : total}</p>
      </div>
      <div className="flex min-h-24 flex-wrap gap-2">
        {cards.length === 0 && <PlayingCard faceDown />}
        {cards.map((card, index) => (
          <PlayingCard key={card.id} card={card} faceDown={Boolean(hide && index === 1)} index={index} />
        ))}
      </div>
    </div>
  );
}

function Action({
  children,
  onClick,
  disabled,
  wide,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`press min-h-12 rounded-xl bg-gold px-4 font-medium text-ink disabled:opacity-40 ${wide ? "col-span-2 sm:col-span-1" : ""}`}
    >
      {children}
    </button>
  );
}
