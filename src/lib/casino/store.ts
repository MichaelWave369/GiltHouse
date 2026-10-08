import { create } from "zustand";
import { agentPayout, freshMatch, gradeAgent, stepMatch, type AgentBet, type AgentMatch, type AgentSport } from "@/lib/casino/agents";
import type { Ticket } from "@/lib/casino/sports";

const KEY = "gilt-house-v1";
export const OPENING_BANK = 2500;

export type View =
  | "floor"
  | "blackjack"
  | "roulette"
  | "slots"
  | "craps"
  | "baccarat"
  | "poker"
  | "keno"
  | "afterhours"
  | "sports"
  | "workshop"
  | "training"
  | "agents";
export type LedgerGame =
  | "blackjack"
  | "roulette"
  | "slots"
  | "craps"
  | "baccarat"
  | "poker"
  | "keno"
  | "afterhours"
  | "sports"
  | "pit"
  | "agents"
  | "house";

export type Ledger = {
  id: string;
  game: LedgerGame;
  delta: number;
  note: string;
  at: number;
};

export type Pit = {
  station: string;
  streak: number;
  correct: number;
  asked: number;
  cleared: string[];
};

const EMPTY_PIT: Pit = { station: "", streak: 0, correct: 0, asked: 0, cleared: [] };

type Saved = {
  version: 1;
  bank: number;
  sound: boolean;
  ledger: Ledger[];
  comps: number;
  tickets: Ticket[];
  pit: Pit;
  agent: AgentMatch | null;
  agentBets: AgentBet[];
};

function isTicket(value: unknown): value is Ticket {
  if (!value || typeof value !== "object") return false;
  const row = value as Ticket;
  return (
    typeof row.id === "string" &&
    typeof row.eventId === "string" &&
    typeof row.label === "string" &&
    typeof row.stake === "number" &&
    typeof row.odds === "number" &&
    (row.market === "ml" || row.market === "spread" || row.market === "total") &&
    (row.side === "home" || row.side === "away" || row.side === "over" || row.side === "under")
  );
}

function readPit(value: unknown): Pit {
  if (!value || typeof value !== "object") return EMPTY_PIT;
  const row = value as Pit;
  return {
    station: typeof row.station === "string" ? row.station : "",
    streak: typeof row.streak === "number" ? row.streak : 0,
    correct: typeof row.correct === "number" ? row.correct : 0,
    asked: typeof row.asked === "number" ? row.asked : 0,
    cleared: Array.isArray(row.cleared) ? row.cleared.filter((id) => typeof id === "string") : [],
  };
}

function readAgent(value: unknown): AgentMatch | null {
  if (!value || typeof value !== "object") return null;
  const row = value as AgentMatch;
  if (row.sport !== "soccer" && row.sport !== "baseball" && row.sport !== "football") return null;
  if (row.status !== "card" && row.status !== "live" && row.status !== "final") return null;
  return {
    ...freshMatch(row.sport, typeof row.seed === "number" ? row.seed : 1),
    ...row,
    log: Array.isArray(row.log) ? row.log.filter((line) => typeof line === "string").slice(0, 5) : [],
    tick: typeof row.tick === "number" ? row.tick : 0,
    homeScore: typeof row.homeScore === "number" ? row.homeScore : 0,
    awayScore: typeof row.awayScore === "number" ? row.awayScore : 0,
  };
}

function isAgentBet(value: unknown): value is AgentBet {
  if (!value || typeof value !== "object") return false;
  const row = value as AgentBet;
  return (
    (row.sport === "soccer" || row.sport === "baseball" || row.sport === "football") &&
    typeof row.id === "string" &&
    typeof row.label === "string" &&
    typeof row.stake === "number" &&
    typeof row.odds === "number"
  );
}

function readSaved(): Saved {
  const fallback: Saved = {
    version: 1,
    bank: OPENING_BANK,
    sound: true,
    ledger: [],
    comps: 0,
    tickets: [],
    pit: EMPTY_PIT,
    agent: null,
    agentBets: [],
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    if (parsed.version !== 1 || typeof parsed.bank !== "number") return fallback;
    return {
      version: 1,
      bank: Math.max(0, Math.round(parsed.bank)),
      sound: parsed.sound !== false,
      ledger: Array.isArray(parsed.ledger) ? parsed.ledger.slice(0, 18) : [],
      comps: typeof parsed.comps === "number" ? parsed.comps : 0,
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets.filter(isTicket).slice(0, 24) : [],
      pit: readPit(parsed.pit),
      agent: readAgent(parsed.agent),
      agentBets: Array.isArray(parsed.agentBets) ? parsed.agentBets.filter(isAgentBet).slice(0, 16) : [],
    };
  } catch {
    return fallback;
  }
}

function writeSaved(saved: Saved) {
  localStorage.setItem(KEY, JSON.stringify(saved));
}

type CasinoState = {
  booted: boolean;
  bank: number;
  sound: boolean;
  view: View;
  ledger: Ledger[];
  comps: number;
  tickets: Ticket[];
  pit: Pit;
  agent: AgentMatch | null;
  agentBets: AgentBet[];
  boot: () => void;
  setView: (view: View) => void;
  toggleSound: () => void;
  settle: (net: number, game: LedgerGame, note: string) => void;
  marker: () => void;
  resetPurse: () => void;
  placeTicket: (draft: Omit<Ticket, "id" | "at">) => boolean;
  gradeTickets: (rows: { id: string; net: number; note: string }[]) => void;
  focusStation: (station: string) => void;
  markPit: (station: string, correct: boolean, need: number) => void;
  openAgent: (sport: AgentSport) => boolean;
  kickAgent: () => void;
  advanceAgent: () => void;
  placeAgentBet: (draft: Omit<AgentBet, "id">) => boolean;
};

function persist(state: CasinoState) {
  writeSaved({
    version: 1,
    bank: state.bank,
    sound: state.sound,
    ledger: state.ledger,
    comps: state.comps,
    tickets: state.tickets,
    pit: state.pit,
    agent: state.agent,
    agentBets: state.agentBets,
  });
}

export const useCasino = create<CasinoState>((set, get) => ({
  booted: false,
  bank: OPENING_BANK,
  sound: true,
  view: "floor",
  ledger: [],
  comps: 0,
  tickets: [],
  pit: EMPTY_PIT,
  agent: null,
  agentBets: [],
  boot: () => {
    if (get().booted) return;
    const saved = readSaved();
    set({
      booted: true,
      bank: saved.bank,
      sound: saved.sound,
      ledger: saved.ledger,
      comps: saved.comps,
      tickets: saved.tickets,
      pit: saved.pit,
      agent: saved.agent,
      agentBets: saved.agentBets,
    });
  },
  setView: (view) => set({ view }),
  toggleSound: () => {
    set({ sound: !get().sound });
    persist(get());
  },
  settle: (net, game, note) => {
    const s = get();
    const delta = Math.round(net);
    const bank = Math.max(0, s.bank + delta);
    const entry: Ledger = { id: crypto.randomUUID(), game, delta, note, at: Date.now() };
    const ledger = [entry, ...s.ledger].slice(0, 18);
    set({ bank, ledger });
    persist(get());
  },
  marker: () => {
    const s = get();
    if (s.bank >= 50) return;
    const delta = 1000;
    const bank = s.bank + delta;
    const comps = s.comps + 1;
    const entry: Ledger = { id: crypto.randomUUID(), game: "house", delta, note: "House marker", at: Date.now() };
    const ledger = [entry, ...s.ledger].slice(0, 18);
    set({ bank, ledger, comps });
    persist(get());
  },
  resetPurse: () => {
    const s = get();
    const bank = OPENING_BANK;
    const entry: Ledger = {
      id: crypto.randomUUID(),
      game: "house",
      delta: bank - s.bank,
      note: "Purse reset",
      at: Date.now(),
    };
    const ledger = [entry, ...s.ledger].slice(0, 18);
    set({ bank, ledger, tickets: [], agent: null, agentBets: [] });
    persist(get());
  },
  placeTicket: (draft) => {
    const s = get();
    const stake = Math.round(draft.stake);
    if (stake < 1 || stake > s.bank || s.tickets.length >= 24) return false;
    const ticket: Ticket = { ...draft, stake, id: crypto.randomUUID(), at: Date.now() };
    const bank = s.bank - stake;
    const entry: Ledger = {
      id: crypto.randomUUID(),
      game: "sports",
      delta: -stake,
      note: ticket.label,
      at: ticket.at,
    };
    set({
      bank,
      ledger: [entry, ...s.ledger].slice(0, 18),
      tickets: [ticket, ...s.tickets].slice(0, 24),
    });
    persist(get());
    return true;
  },
  gradeTickets: (rows) => {
    if (rows.length === 0) return;
    const s = get();
    const drop = new Set(rows.map((row) => row.id));
    let bank = s.bank;
    let ledger = s.ledger;
    for (const row of rows) {
      if (!s.tickets.some((ticket) => ticket.id === row.id)) continue;
      const delta = Math.round(row.net);
      bank = Math.max(0, bank + delta);
      ledger = [
        { id: crypto.randomUUID(), game: "sports", delta, note: row.note, at: Date.now() },
        ...ledger,
      ];
    }
    set({
      bank,
      ledger: ledger.slice(0, 18),
      tickets: s.tickets.filter((ticket) => !drop.has(ticket.id)),
    });
    persist(get());
  },
  focusStation: (station) => {
    const s = get();
    if (s.pit.station === station) return;
    const pit = { ...s.pit, station, streak: 0 };
    set({ pit });
    persist(get());
  },
  markPit: (station, correct, need) => {
    const s = get();
    const same = s.pit.station === station;
    const streak = correct ? (same ? s.pit.streak + 1 : 1) : 0;
    const cleared = s.pit.cleared.includes(station);
    const earned = correct && streak >= need && !cleared;
    const bank = s.bank + (earned ? 100 : 0);
    const comps = s.comps + (earned ? 1 : 0);
    const entry: Ledger = {
      id: crypto.randomUUID(),
      game: "pit",
      delta: 100,
      note: "Pit comp",
      at: Date.now(),
    };
    const pit: Pit = {
      station,
      streak: earned ? 0 : streak,
      correct: s.pit.correct + (correct ? 1 : 0),
      asked: s.pit.asked + 1,
      cleared: earned ? [...s.pit.cleared, station] : s.pit.cleared,
    };
    set({
      bank,
      comps,
      pit,
      ledger: earned ? [entry, ...s.ledger].slice(0, 18) : s.ledger,
    });
    persist(get());
  },
  openAgent: (sport) => {
    const s = get();
    if (s.agent?.status === "live") return false;
    const refund = s.agentBets.reduce((sum, bet) => sum + bet.stake, 0);
    const bank = s.bank + refund;
    const ledger =
      refund > 0
        ? [
            {
              id: crypto.randomUUID(),
              game: "agents" as const,
              delta: refund,
              note: "Agent card returned",
              at: Date.now(),
            },
            ...s.ledger,
          ].slice(0, 18)
        : s.ledger;
    set({
      bank,
      ledger,
      agent: freshMatch(sport),
      agentBets: [],
    });
    persist(get());
    return true;
  },
  kickAgent: () => {
    const s = get();
    if (!s.agent || s.agent.status !== "card") return;
    set({
      agent: { ...s.agent, status: "live", log: ["They kick it off.", ...s.agent.log].slice(0, 5) },
    });
    persist(get());
  },
  advanceAgent: () => {
    const s = get();
    if (!s.agent || s.agent.status !== "live") return;
    let next = stepMatch(s.agent);
    if (next.status !== "final" && next.tick >= next.ticks) {
      next = { ...next, status: "final", log: ["Final.", ...next.log].slice(0, 5) };
    }
    if (next.status !== "final") {
      set({ agent: next });
      persist(get());
      return;
    }
    let bank = s.bank;
    let ledger = s.ledger;
    for (const bet of s.agentBets) {
      const grade = gradeAgent(bet, next);
      const delta = Math.round(agentPayout(bet.stake, bet.odds, grade));
      const word = grade === "win" ? "wins" : grade === "push" ? "pushes" : "loses";
      const entry: Ledger = {
        id: crypto.randomUUID(),
        game: "agents",
        delta,
        note: `${bet.label} ${word}`,
        at: Date.now(),
      };
      bank = Math.max(0, bank + delta);
      ledger = [entry, ...ledger];
    }
    set({ agent: next, bank, ledger: ledger.slice(0, 18), agentBets: [] });
    persist(get());
  },
  placeAgentBet: (draft) => {
    const s = get();
    const stake = Math.round(draft.stake);
    if (!s.agent || stake < 1 || stake > s.bank || s.agentBets.length >= 16) return false;
    if (s.agent.status === "final" || (s.agent.status === "live" && s.agent.tick / s.agent.ticks >= 0.82)) return false;
    const bet: AgentBet = { ...draft, stake, id: crypto.randomUUID() };
    const entry: Ledger = {
      id: crypto.randomUUID(),
      game: "agents",
      delta: -stake,
      note: bet.label,
      at: Date.now(),
    };
    set({
      bank: s.bank - stake,
      ledger: [entry, ...s.ledger].slice(0, 18),
      agentBets: [bet, ...s.agentBets],
    });
    persist(get());
    return true;
  },
}));

export function chips(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
