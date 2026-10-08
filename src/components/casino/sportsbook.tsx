import { useEffect, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import {
  american,
  gradeTicket,
  profit,
  returnChips,
  signed,
  type Market,
  type Side,
  type WireGame,
} from "@/lib/casino/sports";
import { loadWire } from "@/lib/casino/wire";
import { chips, useCasino } from "@/lib/casino/store";
import { AgentBook } from "@/components/casino/agents";
import { WireBoard } from "@/components/casino/gl/wire-board";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

const STAKES = [25, 50, 100, 250];
const LEAGUES = ["NFL", "MLB", "NBA", "NHL"] as const;

type Slip = {
  eventId: string;
  market: Market;
  side: Side;
  label: string;
  odds: number;
  line: number | null;
};

function offer(game: WireGame, market: Market, side: Side): Slip | null {
  if (game.state === "post") return null;
  if (market === "ml" && side === "home" && game.mlHome !== null) {
    return { eventId: game.eventId, market, side, odds: game.mlHome, line: null, label: `${game.homeAbbr} ML ${american(game.mlHome)}` };
  }
  if (market === "ml" && side === "away" && game.mlAway !== null) {
    return { eventId: game.eventId, market, side, odds: game.mlAway, line: null, label: `${game.awayAbbr} ML ${american(game.mlAway)}` };
  }
  if (market === "spread" && side === "home" && game.spreadHome !== null && game.spreadHomeOdds !== null) {
    return {
      eventId: game.eventId,
      market,
      side,
      odds: game.spreadHomeOdds,
      line: game.spreadHome,
      label: `${game.homeAbbr} ${signed(game.spreadHome)} ${american(game.spreadHomeOdds)}`,
    };
  }
  if (market === "spread" && side === "away" && game.spreadAway !== null && game.spreadAwayOdds !== null) {
    return {
      eventId: game.eventId,
      market,
      side,
      odds: game.spreadAwayOdds,
      line: game.spreadAway,
      label: `${game.awayAbbr} ${signed(game.spreadAway)} ${american(game.spreadAwayOdds)}`,
    };
  }
  if (market === "total" && side === "over" && game.total !== null && game.overOdds !== null) {
    return {
      eventId: game.eventId,
      market,
      side,
      odds: game.overOdds,
      line: game.total,
      label: `Over ${game.total} ${american(game.overOdds)}`,
    };
  }
  if (market === "total" && side === "under" && game.total !== null && game.underOdds !== null) {
    return {
      eventId: game.eventId,
      market,
      side,
      odds: game.underOdds,
      line: game.total,
      label: `Under ${game.total} ${american(game.underOdds)}`,
    };
  }
  return null;
}

export function Sportsbook() {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const tickets = useCasino((s) => s.tickets);
  const placeTicket = useCasino((s) => s.placeTicket);
  const gradeTickets = useCasino((s) => s.gradeTickets);
  const [games, setGames] = useState<WireGame[]>([]);
  const [league, setLeague] = useState<(typeof LEAGUES)[number]>("NFL");
  const [slip, setSlip] = useState<Slip | null>(null);
  const [stake, setStake] = useState(25);
  const [pulse, setPulse] = useState(0);
  const [note, setNote] = useState("Calling the wire.");
  const [quiet, setQuiet] = useState(false);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      const open = useCasino.getState().tickets;
      try {
        const board = await loadWire({
          data: {
            lookups: open.map((ticket) => ({
              sport: ticket.sport,
              league: ticket.league,
              eventId: ticket.eventId,
              dateKey: ticket.dateKey,
            })),
          },
        });
        if (!alive) return;
        setGames(board.games);
        setQuiet(board.quiet);
        setNote(board.quiet ? "The wire is quiet. Try the refresh." : "Prices are the posted number. Chips lock until the final.");
        const byId = new Map(board.games.map((game) => [game.eventId, game]));
        const graded = open.flatMap((ticket) => {
          const grade = gradeTicket(ticket, byId.get(ticket.eventId));
          if (grade === "open") return [];
          const net = returnChips(ticket.stake, ticket.odds, grade);
          const word = grade === "win" ? "wins" : grade === "push" ? "pushes" : "loses";
          return [{ id: ticket.id, net, note: `${ticket.label} ${word}` }];
        });
        if (graded.length) {
          gradeTickets(graded);
          playCue(graded.some((row) => row.net > 0) ? "win" : "lose", sound);
        }
      } catch {
        if (alive) setNote("The wire did not answer.");
      }
    };
    void pull();
    const timer = window.setInterval(() => void pull(), 40000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [gradeTickets, pulse, sound]);

  const shown = games.filter((game) => game.leagueLabel === league);
  const slipGame = slip ? games.find((game) => game.eventId === slip.eventId) : undefined;

  function place() {
    if (!slip || !slipGame || slipGame.state === "post" || stake > bank) return;
    const fresh = offer(slipGame, slip.market, slip.side);
    if (!fresh) return;
    const ok = placeTicket({
      eventId: slipGame.eventId,
      sport: slipGame.sport,
      league: slipGame.league,
      dateKey: slipGame.dateKey,
      label: `${slipGame.awayAbbr}/${slipGame.homeAbbr} ${fresh.label}`,
      market: fresh.market,
      side: fresh.side,
      odds: fresh.odds,
      line: fresh.line,
      stake,
    });
    if (!ok) return;
    playCue("chip", sound);
    setSlip(null);
    setNote("Ticket down. The price is locked. Chips come back if it wins or pushes.");
  }

  return (
    <Frame>
      <TopBar title="The Wire" eyebrow="Live numbers · play chips" />
      <BrokeBanner />
      <AgentBook />
      <p className="max-w-xl text-sm leading-relaxed text-cream-dim">
        Real games and the posted price. The purse is still chips. Nothing here is a cash bet, and the ticket cannot be cashed.
      </p>
      <p className="sr-only" aria-live="polite">
        {note}
      </p>
      <WireBoard games={shown.length ? shown : games} />
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="League">
        {LEAGUES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setLeague(name);
              setSlip(null);
            }}
            className={`press min-h-11 rounded-full border px-4 text-sm font-medium ${
              league === name ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
            }`}
            aria-pressed={league === name}
          >
            {name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPulse((value) => value + 1)}
          className="press min-h-11 rounded-full border border-line px-4 text-sm text-cream-dim"
        >
          Refresh
        </button>
      </div>
      {quiet && shown.length === 0 ? (
        <p className="rounded-xl border border-line bg-ink-2 px-4 py-4 text-sm text-cream-dim">
          The wire is quiet right now.
        </p>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-line bg-ink-2 px-4 py-4 text-sm text-cream-dim">
          Nothing posted on this league.
        </p>
      ) : (
        <div className="grid gap-3">
          {shown.map((game) => (
            <article key={game.eventId} className="rounded-xl border border-line bg-ink-2 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs tracking-widest text-gold uppercase">
                  {game.state === "in" ? "Live" : game.state === "post" ? "Final" : game.detail}
                </p>
                {game.state !== "pre" && (
                  <p className="text-sm text-cream tabular-nums">
                    {game.awayAbbr} {game.awayScore} · {game.homeAbbr} {game.homeScore}
                  </p>
                )}
              </div>
              <h2 className="mt-2 font-display text-2xl text-cream italic">
                {game.away} at {game.home}
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(
                  [
                    ["spread", "away"],
                    ["spread", "home"],
                    ["ml", "away"],
                    ["ml", "home"],
                    ["total", "over"],
                    ["total", "under"],
                  ] as const
                ).map(([market, side]) => {
                  const next = offer(game, market, side);
                  const on = slip?.eventId === game.eventId && slip.market === market && slip.side === side;
                  return (
                    <button
                      key={`${market}-${side}`}
                      type="button"
                      disabled={!next}
                      onClick={() => next && setSlip(next)}
                      className={`press min-h-11 rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-40 ${
                        on ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
                      }`}
                      aria-pressed={on}
                    >
                      <span className="block">{next ? next.label : "No price"}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}

      {slip && (
        <div className="mt-4 rounded-xl border border-gold bg-panel p-4">
          <p className="font-medium text-cream">{slip.label}</p>
          <p className="mt-1 text-sm text-cream-dim">
            A {chips(stake)} chip ticket wins {chips(profit(stake, slip.odds))} if it hits. The stake is held until the final.
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Ticket stake">
            {STAKES.map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={bank < amount}
                onClick={() => setStake(amount)}
                className={`press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${
                  stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-ink-2 text-cream"
                }`}
                aria-pressed={stake === amount}
              >
                {chips(amount)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={place}
            disabled={stake > bank}
            className="press mt-3 min-h-12 w-full rounded-xl bg-gold text-base font-medium text-ink disabled:opacity-40"
          >
            Bet {chips(stake)}
          </button>
        </div>
      )}

      <section className="mt-6" aria-label="Open tickets">
        <h2 className="font-display text-xl text-cream italic">Open tickets</h2>
        {tickets.length === 0 ? (
          <p className="mt-2 text-sm text-cream-dim">No tickets down.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line bg-ink-2">
            {tickets.map((ticket) => {
              const game = games.find((row) => row.eventId === ticket.eventId);
              return (
                <li key={ticket.id} className="px-4 py-3">
                  <p className="text-sm text-cream">{ticket.label}</p>
                  <p className="text-xs text-cream-dim tabular-nums">
                    {chips(ticket.stake)} held
                    {game?.state === "in" ? ` · ${game.awayScore}–${game.homeScore}` : " · waiting on the final"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="mt-4 text-sm text-cream-dim">{note}</p>
    </Frame>
  );
}
