import { createServerFn } from "@tanstack/react-start";
import { gamesFromScoreboard, type WireGame } from "@/lib/casino/sports";

const LEAGUES = [
  { sport: "football", league: "nfl", label: "NFL" },
  { sport: "baseball", league: "mlb", label: "MLB" },
  { sport: "basketball", league: "nba", label: "NBA" },
  { sport: "hockey", league: "nhl", label: "NHL" },
] as const;

export type WireLookup = { sport: string; league: string; eventId: string; dateKey: string };

const ALLOWED = new Set(LEAGUES.map((league) => `${league.sport}/${league.league}`));

async function pull(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0 (compatible; GiltHouse/1.0)",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.json() as Promise<unknown>;
}

function boardUrl(sport: string, league: string, dateKey?: string) {
  const date = dateKey ? `?dates=${dateKey}` : "";
  return `https://site.web.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard${date}`;
}

export const loadWire = createServerFn({ method: "POST" })
  .validator((data: { lookups?: WireLookup[] }) => {
    const lookups = Array.isArray(data?.lookups) ? data.lookups : [];
    return {
      lookups: lookups.filter(isLookup).slice(0, 8),
    };
  })
  .handler(async ({ data }): Promise<{ games: WireGame[]; fetchedAt: number; quiet: boolean }> => {
    const batches = await Promise.all(
      LEAGUES.map(async (meta) => {
        try {
          const payload = await pull(boardUrl(meta.sport, meta.league));
          return gamesFromScoreboard(payload, meta);
        } catch {
          return null;
        }
      }),
    );
    const games = batches.flatMap((batch) => batch ?? []);
    const quiet = batches.every((batch) => batch === null);
    const seen = new Set(games.map((game) => game.eventId));
    const pending = data.lookups.filter((lookup) => !seen.has(lookup.eventId));
    const extraKeys = new Set<string>();
    for (const lookup of pending) extraKeys.add(`${lookup.sport}/${lookup.league}/${lookup.dateKey}`);
    const extras = await Promise.all(
      [...extraKeys].slice(0, 4).map(async (key) => {
        const [sport, league, dateKey] = key.split("/");
        if (!sport || !league || !dateKey) return [] as WireGame[];
        const meta = LEAGUES.find((row) => row.sport === sport && row.league === league);
        if (!meta) return [];
        try {
          const payload = await pull(boardUrl(sport, league, dateKey));
          return gamesFromScoreboard(payload, meta);
        } catch {
          return [];
        }
      }),
    );
    for (const batch of extras) {
      for (const game of batch) {
        if (seen.has(game.eventId)) continue;
        seen.add(game.eventId);
        games.push(game);
      }
    }
    return { games, fetchedAt: Date.now(), quiet };
  });

function isLookup(value: unknown): value is WireLookup {
  if (!value || typeof value !== "object") return false;
  const row = value as WireLookup;
  return (
    ALLOWED.has(`${row.sport}/${row.league}`) &&
    /^\d{5,12}$/.test(row.eventId ?? "") &&
    /^\d{8}$/.test(row.dateKey ?? "")
  );
}
