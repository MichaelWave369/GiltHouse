import { useEffect, useRef, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import {
  CLUBS,
  betsOpen,
  clockLabel,
  offers,
  type AgentOffer,
  type AgentSport,
} from "@/lib/casino/agents";
import { chips, useCasino } from "@/lib/casino/store";
import { Arena, type ArenaHandle } from "@/components/casino/gl/arena";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

const STAKES = [25, 50, 100, 250];
const SPORTS: AgentSport[] = ["soccer", "baseball", "football"];

export function AgentBook() {
  const setView = useCasino((s) => s.setView);
  const agent = useCasino((s) => s.agent);
  const clubs = agent ? CLUBS[agent.sport] : null;
  return (
    <button
      type="button"
      onClick={() => setView("agents")}
      className="press mb-4 w-full rounded-xl border border-gold/60 bg-ink-2 px-4 py-3 text-left"
    >
      <span className="text-xs tracking-widest text-gold uppercase">Agent card</span>
      <span className="mt-1 block text-sm text-cream">
        {agent && clubs
          ? `${clubs.home.name} vs ${clubs.away.name} · ${clockLabel(agent)} ${agent.homeScore}–${agent.awayScore}`
          : "Simulated soccer, baseball, and football. Same chips. A 3D field, and VR if a headset is paired."}
      </span>
    </button>
  );
}

export function Agents() {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const agent = useCasino((s) => s.agent);
  const agentBets = useCasino((s) => s.agentBets);
  const openAgent = useCasino((s) => s.openAgent);
  const kickAgent = useCasino((s) => s.kickAgent);
  const placeAgentBet = useCasino((s) => s.placeAgentBet);
  const arena = useRef<ArenaHandle>(null);
  const [stake, setStake] = useState(25);
  const [pick, setPick] = useState<AgentOffer | null>(null);
  const [note, setNote] = useState("");
  const [vrNote, setVrNote] = useState("Drag the field to look around. VR uses a paired headset.");
  const clubs = agent ? CLUBS[agent.sport] : null;
  const board = agent ? offers(agent) : [];
  const open = agent ? betsOpen(agent) : false;

  useEffect(() => {
    if (!useCasino.getState().agent) openAgent("soccer");
  }, [openAgent]);

  function bet() {
    if (!agent || !pick || !open || stake > bank) return;
    const ok = placeAgentBet({
      sport: agent.sport,
      label: `${CLUBS[agent.sport].away.abbr}/${CLUBS[agent.sport].home.abbr} ${pick.label}`,
      market: pick.market,
      side: pick.side,
      odds: pick.odds,
      line: pick.line,
      stake,
    });
    if (!ok) return;
    playCue("chip", sound);
    setPick(null);
  }

  return (
    <Frame>
      <TopBar title="The Agents" eyebrow="Simulated field · play chips" />
      <BrokeBanner />
      <p className="max-w-xl text-sm leading-relaxed text-cream-dim">
        Two agents play a full match on the field. The price is the house card, not a league wire. Chips lock until the final. No cash.
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Agent sport">
        {SPORTS.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => {
              if (agent?.sport === sport && agent.status !== "final") return;
              if (!openAgent(sport)) {
                setNote("This one is live. The card changes after the final.");
                return;
              }
              setNote("");
              setPick(null);
            }}
            className={`press min-h-11 rounded-full border px-4 text-sm capitalize ${
              agent?.sport === sport ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
            }`}
            aria-pressed={agent?.sport === sport}
          >
            {sport}
          </button>
        ))}
      </div>
      {note ? <p className="mt-3 text-sm text-gold">{note}</p> : null}
      {agent && clubs ? (
        <>
          <div className="mt-4">
            <Arena match={agent} api={arena} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void arena.current?.enterVR().then((result) => {
                  setVrNote(
                    result === "ok"
                      ? "Headset on. Look around the field."
                      : "No headset on this screen. Drag the field to look around.",
                  );
                });
              }}
              className="press min-h-11 rounded-full border border-gold px-4 text-sm text-gold"
            >
              Enter VR
            </button>
            <p className="text-sm text-cream-dim">{vrNote}</p>
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-4xl text-cream tabular-nums lining-nums">
              <span className="text-oxblood">{clubs.away.abbr}</span> {agent.awayScore}
              <span className="text-cream-dim"> · </span>
              <span className="text-gold">{clubs.home.abbr}</span> {agent.homeScore}
            </h2>
            <p className="text-sm text-gold tabular-nums">{clockLabel(agent)}</p>
          </div>
          <p className="text-sm text-cream-dim">
            {clubs.away.name} at {clubs.home.name}. Gold is home. Oxblood is away.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-cream-dim">
            {agent.log.slice(0, 3).map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
          {open ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {board.map((offer) => {
                const on = pick?.label === offer.label && pick.market === offer.market;
                return (
                  <button
                    key={`${offer.market}-${offer.side}-${offer.label}`}
                    type="button"
                    onClick={() => setPick(offer)}
                    className={`press min-h-11 rounded-lg border px-3 py-2 text-left text-sm ${
                      on ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
                    }`}
                    aria-pressed={on}
                  >
                    {offer.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-cream-dim">
              {agent.status === "final"
                ? "Final. Open a new card to bet the next match."
                : "The window is closed."}
            </p>
          )}
          {open && pick && (
            <div className="mt-4 rounded-xl border border-gold bg-panel p-4">
              <p className="text-cream">{pick.label}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STAKES.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={bank < amount}
                    onClick={() => setStake(amount)}
                    className={`press min-h-11 rounded-full border px-4 text-sm tabular-nums disabled:opacity-40 ${
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
                onClick={bet}
                disabled={stake > bank}
                className="press mt-3 min-h-12 w-full rounded-xl bg-gold font-medium text-ink disabled:opacity-40"
              >
                Bet {chips(stake)}
              </button>
            </div>
          )}
          {agent.status === "card" && (
            <button
              type="button"
              onClick={() => {
                kickAgent();
                playCue("spin", sound);
              }}
              className="press mt-3 min-h-12 w-full rounded-xl border border-gold text-base text-gold"
            >
              Kick off
            </button>
          )}
          {agent.status === "final" && (
            <button
              type="button"
              onClick={() => openAgent(agent.sport)}
              className="press mt-3 min-h-12 w-full rounded-xl border border-line text-cream"
            >
              New card
            </button>
          )}
          {agentBets.length > 0 && (
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-ink-2">
              {agentBets.map((row) => (
                <li key={row.id} className="px-4 py-3 text-sm text-cream">
                  {row.label} · {chips(row.stake)} held
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-4 rounded-xl border border-line bg-ink-2 px-4 py-4 text-sm text-cream-dim">
          Pick a sport. The field builds in 3D, then the card opens.
        </p>
      )}
    </Frame>
  );
}
