export type WireState = "pre" | "in" | "post";
export type Market = "ml" | "spread" | "total";
export type Side = "home" | "away" | "over" | "under";

export type WireGame = {
  eventId: string;
  sport: string;
  league: string;
  leagueLabel: string;
  dateKey: string;
  detail: string;
  state: WireState;
  home: string;
  away: string;
  homeAbbr: string;
  awayAbbr: string;
  homeScore: number;
  awayScore: number;
  mlHome: number | null;
  mlAway: number | null;
  spreadHome: number | null;
  spreadHomeOdds: number | null;
  spreadAway: number | null;
  spreadAwayOdds: number | null;
  total: number | null;
  overOdds: number | null;
  underOdds: number | null;
};

export type Ticket = {
  id: string;
  eventId: string;
  sport: string;
  league: string;
  dateKey: string;
  label: string;
  market: Market;
  side: Side;
  odds: number;
  line: number | null;
  stake: number;
  at: number;
};

export type Grade = "open" | "win" | "loss" | "push";

const LEAGUE_OK = new Set(["nfl", "mlb", "nba", "nhl"]);
const SPORT_OK = new Set(["football", "baseball", "basketball", "hockey"]);

export function dateKeyFromIso(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}${month}${day}`;
}

export function signed(n: number) {
  const text = Number.isInteger(n) ? String(n) : String(n);
  return n > 0 ? `+${text}` : text;
}

export function american(n: number) {
  return n > 0 ? `+${n}` : String(n);
}

export function profit(stake: number, odds: number) {
  if (odds > 0) return (stake * odds) / 100;
  return (stake * 100) / Math.abs(odds);
}

export function gradeTicket(ticket: Ticket, game: WireGame | undefined): Grade {
  if (!game || game.state !== "post") return "open";
  const home = game.homeScore;
  const away = game.awayScore;
  if (ticket.market === "ml") {
    if (home === away) return "push";
    return (ticket.side === "home") === home > away ? "win" : "loss";
  }
  if (ticket.market === "spread") {
    if (ticket.line === null) return "open";
    const cover = ticket.side === "home" ? home + ticket.line - away : away + ticket.line - home;
    if (Math.abs(cover) < 0.001) return "push";
    return cover > 0 ? "win" : "loss";
  }
  if (ticket.line === null) return "open";
  const sum = home + away;
  if (sum === ticket.line) return "push";
  if (ticket.side === "over") return sum > ticket.line ? "win" : "loss";
  return sum < ticket.line ? "win" : "loss";
}

export function returnChips(stake: number, odds: number, grade: Grade) {
  if (grade === "push") return stake;
  if (grade !== "win") return 0;
  return stake + profit(stake, odds);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numOdds(value: unknown) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace("+", "")) : NaN;
  return Number.isFinite(n) && n !== 0 ? Math.round(n) : null;
}

function numLine(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value : "";
  const n = Number(raw.replace(/^[ou]/i, "").replace("+", ""));
  return Number.isFinite(n) ? n : null;
}

function quote(node: unknown, field: "odds" | "line") {
  const rec = asRecord(node);
  const close = asRecord(rec?.close);
  const open = asRecord(rec?.open);
  const value = close?.[field] ?? open?.[field];
  return field === "odds" ? numOdds(value) : numLine(value);
}

function teamSide(competitors: unknown[], side: "home" | "away") {
  for (const row of competitors) {
    const rec = asRecord(row);
    if (rec?.homeAway !== side) continue;
    const team = asRecord(rec.team);
    const abbr = typeof team?.abbreviation === "string" ? team.abbreviation : "";
    const name = typeof team?.shortDisplayName === "string" ? team.shortDisplayName : abbr;
    const score = Number(rec.score ?? 0);
    return { abbr, name, score: Number.isFinite(score) ? score : 0 };
  }
  return null;
}

export function gamesFromScoreboard(
  payload: unknown,
  meta: { sport: string; league: string; label: string },
): WireGame[] {
  if (!SPORT_OK.has(meta.sport) || !LEAGUE_OK.has(meta.league)) return [];
  const events = asRecord(payload)?.events;
  if (!Array.isArray(events)) return [];
  const games: WireGame[] = [];
  for (const event of events) {
    const rec = asRecord(event);
    const comp = asRecord(Array.isArray(rec?.competitions) ? rec.competitions[0] : null);
    if (!rec || !comp) continue;
    const eventId = String(rec.id ?? "");
    if (!/^\d{5,12}$/.test(eventId)) continue;
    const status = asRecord(asRecord(comp.status)?.type);
    const state = status?.state === "in" || status?.state === "post" ? status.state : "pre";
    const competitors = Array.isArray(comp.competitors) ? comp.competitors : [];
    const home = teamSide(competitors, "home");
    const away = teamSide(competitors, "away");
    if (!home?.abbr || !away?.abbr) continue;
    const odds = asRecord(Array.isArray(comp.odds) ? comp.odds[0] : null);
    const iso = typeof comp.date === "string" ? comp.date : typeof rec.date === "string" ? rec.date : "";
    games.push({
      eventId,
      sport: meta.sport,
      league: meta.league,
      leagueLabel: meta.label,
      dateKey: dateKeyFromIso(iso),
      detail: typeof status?.shortDetail === "string" ? status.shortDetail : "Scheduled",
      state,
      home: home.name,
      away: away.name,
      homeAbbr: home.abbr,
      awayAbbr: away.abbr,
      homeScore: home.score,
      awayScore: away.score,
      mlHome: quote(asRecord(odds?.moneyline)?.home, "odds"),
      mlAway: quote(asRecord(odds?.moneyline)?.away, "odds"),
      spreadHome: quote(asRecord(odds?.pointSpread)?.home, "line"),
      spreadHomeOdds: quote(asRecord(odds?.pointSpread)?.home, "odds"),
      spreadAway: quote(asRecord(odds?.pointSpread)?.away, "line"),
      spreadAwayOdds: quote(asRecord(odds?.pointSpread)?.away, "odds"),
      total: quote(asRecord(odds?.total)?.over, "line"),
      overOdds: quote(asRecord(odds?.total)?.over, "odds"),
      underOdds: quote(asRecord(odds?.total)?.under, "odds"),
    });
  }
  return games;
}
