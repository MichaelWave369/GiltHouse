import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { n as gamesFromScoreboard } from "./sports-ClaO3d74.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wire-xNIw-FCH.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var LEAGUES = [
	{
		sport: "football",
		league: "nfl",
		label: "NFL"
	},
	{
		sport: "baseball",
		league: "mlb",
		label: "MLB"
	},
	{
		sport: "basketball",
		league: "nba",
		label: "NBA"
	},
	{
		sport: "hockey",
		league: "nhl",
		label: "NHL"
	}
];
var ALLOWED = new Set(LEAGUES.map((league) => `${league.sport}/${league.league}`));
async function pull(url) {
	const response = await fetch(url, {
		headers: {
			accept: "application/json",
			"user-agent": "Mozilla/5.0 (compatible; GiltHouse/1.0)"
		},
		signal: AbortSignal.timeout(8e3)
	});
	if (!response.ok) throw new Error(String(response.status));
	return response.json();
}
function boardUrl(sport, league, dateKey) {
	return `https://site.web.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard${dateKey ? `?dates=${dateKey}` : ""}`;
}
var loadWire_createServerFn_handler = createServerRpc({
	id: "73ba4f6f20bdced3e262d46c3a422bee818c51b792ab19cdbd50ce972ecdfe68",
	name: "loadWire",
	filename: "src/lib/casino/wire.ts"
}, (opts) => loadWire.__executeServer(opts));
var loadWire = createServerFn({ method: "POST" }).validator((data) => {
	return { lookups: (Array.isArray(data?.lookups) ? data.lookups : []).filter(isLookup).slice(0, 8) };
}).handler(loadWire_createServerFn_handler, async ({ data }) => {
	const batches = await Promise.all(LEAGUES.map(async (meta) => {
		try {
			const payload = await pull(boardUrl(meta.sport, meta.league));
			return gamesFromScoreboard(payload, meta);
		} catch {
			return null;
		}
	}));
	const games = batches.flatMap((batch) => batch ?? []);
	const quiet = batches.every((batch) => batch === null);
	const seen = new Set(games.map((game) => game.eventId));
	const pending = data.lookups.filter((lookup) => !seen.has(lookup.eventId));
	const extraKeys = /* @__PURE__ */ new Set();
	for (const lookup of pending) extraKeys.add(`${lookup.sport}/${lookup.league}/${lookup.dateKey}`);
	const extras = await Promise.all([...extraKeys].slice(0, 4).map(async (key) => {
		const [sport, league, dateKey] = key.split("/");
		if (!sport || !league || !dateKey) return [];
		const meta = LEAGUES.find((row) => row.sport === sport && row.league === league);
		if (!meta) return [];
		try {
			const payload = await pull(boardUrl(sport, league, dateKey));
			return gamesFromScoreboard(payload, meta);
		} catch {
			return [];
		}
	}));
	for (const batch of extras) for (const game of batch) {
		if (seen.has(game.eventId)) continue;
		seen.add(game.eventId);
		games.push(game);
	}
	return {
		games,
		fetchedAt: Date.now(),
		quiet
	};
});
function isLookup(value) {
	if (!value || typeof value !== "object") return false;
	const row = value;
	return ALLOWED.has(`${row.sport}/${row.league}`) && /^\d{5,12}$/.test(row.eventId ?? "") && /^\d{8}$/.test(row.dateKey ?? "");
}
//#endregion
export { loadWire_createServerFn_handler };
