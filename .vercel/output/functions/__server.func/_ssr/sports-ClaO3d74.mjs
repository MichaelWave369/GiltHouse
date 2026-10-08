//#region node_modules/.nitro/vite/services/ssr/assets/sports-ClaO3d74.js
var LEAGUE_OK = /* @__PURE__ */ new Set([
	"nfl",
	"mlb",
	"nba",
	"nhl"
]);
var SPORT_OK = /* @__PURE__ */ new Set([
	"football",
	"baseball",
	"basketball",
	"hockey"
]);
function dateKeyFromIso(iso) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/New_York",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(date);
	return `${parts.find((part) => part.type === "year")?.value ?? ""}${parts.find((part) => part.type === "month")?.value ?? ""}${parts.find((part) => part.type === "day")?.value ?? ""}`;
}
function signed(n) {
	const text = Number.isInteger(n) ? String(n) : String(n);
	return n > 0 ? `+${text}` : text;
}
function american(n) {
	return n > 0 ? `+${n}` : String(n);
}
function profit(stake, odds) {
	if (odds > 0) return stake * odds / 100;
	return stake * 100 / Math.abs(odds);
}
function gradeTicket(ticket, game) {
	if (!game || game.state !== "post") return "open";
	const home = game.homeScore;
	const away = game.awayScore;
	if (ticket.market === "ml") {
		if (home === away) return "push";
		return ticket.side === "home" === home > away ? "win" : "loss";
	}
	if (ticket.market === "spread") {
		if (ticket.line === null) return "open";
		const cover = ticket.side === "home" ? home + ticket.line - away : away + ticket.line - home;
		if (Math.abs(cover) < .001) return "push";
		return cover > 0 ? "win" : "loss";
	}
	if (ticket.line === null) return "open";
	const sum = home + away;
	if (sum === ticket.line) return "push";
	if (ticket.side === "over") return sum > ticket.line ? "win" : "loss";
	return sum < ticket.line ? "win" : "loss";
}
function returnChips(stake, odds, grade) {
	if (grade === "push") return stake;
	if (grade !== "win") return 0;
	return stake + profit(stake, odds);
}
function asRecord(value) {
	return value !== null && typeof value === "object" ? value : null;
}
function numOdds(value) {
	const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace("+", "")) : NaN;
	return Number.isFinite(n) && n !== 0 ? Math.round(n) : null;
}
function numLine(value) {
	const n = Number((typeof value === "number" ? String(value) : typeof value === "string" ? value : "").replace(/^[ou]/i, "").replace("+", ""));
	return Number.isFinite(n) ? n : null;
}
function quote(node, field) {
	const rec = asRecord(node);
	const close = asRecord(rec?.close);
	const open = asRecord(rec?.open);
	const value = close?.[field] ?? open?.[field];
	return field === "odds" ? numOdds(value) : numLine(value);
}
function teamSide(competitors, side) {
	for (const row of competitors) {
		const rec = asRecord(row);
		if (rec?.homeAway !== side) continue;
		const team = asRecord(rec.team);
		const abbr = typeof team?.abbreviation === "string" ? team.abbreviation : "";
		const name = typeof team?.shortDisplayName === "string" ? team.shortDisplayName : abbr;
		const score = Number(rec.score ?? 0);
		return {
			abbr,
			name,
			score: Number.isFinite(score) ? score : 0
		};
	}
	return null;
}
function gamesFromScoreboard(payload, meta) {
	if (!SPORT_OK.has(meta.sport) || !LEAGUE_OK.has(meta.league)) return [];
	const events = asRecord(payload)?.events;
	if (!Array.isArray(events)) return [];
	const games = [];
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
			underOdds: quote(asRecord(odds?.total)?.under, "odds")
		});
	}
	return games;
}
//#endregion
export { returnChips as a, profit as i, gamesFromScoreboard as n, signed as o, gradeTicket as r, american as t };
