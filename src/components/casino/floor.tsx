import { BookOpen, Bot, Cherry, Club, Diamond, Dice5, Dices, Gem, Grid3x3, Radio, Spade } from "lucide-react";
import { chips, OPENING_BANK, useCasino, type Ledger } from "@/lib/casino/store";
import { Bartender } from "@/components/casino/bartender";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";
import { Pianist } from "@/components/casino/pianist";

const TABLES = [
  {
    id: "blackjack" as const,
    name: "The Shoe",
    kicker: "From 50",
    copy: "Six decks. Dealer stands on every seventeen. A natural pays three to two.",
    icon: Spade,
  },
  {
    id: "roulette" as const,
    name: "The Wheel",
    kicker: "Single zero",
    copy: "European wheel, lit in the room. Inside numbers pay thirty-five to one.",
    icon: Dices,
  },
  {
    id: "craps" as const,
    name: "The Rail",
    kicker: "Pass line",
    copy: "Two dice. Seven and eleven on the come-out. A point, then the long way home.",
    icon: Dice5,
  },
  {
    id: "baccarat" as const,
    name: "The Salon",
    kicker: "Punto banco",
    copy: "Player, banker, or the tie. Totals modulo ten. Banker pays nineteen to twenty.",
    icon: Club,
  },
  {
    id: "poker" as const,
    name: "The Draw",
    kicker: "Jacks or better",
    copy: "Five cards. Hold the ones you trust. A royal pays eight hundred to one.",
    icon: Diamond,
  },
  {
    id: "slots" as const,
    name: "Vesper Reels",
    kicker: "Three lines",
    copy: "Left to right. Sevens are rare and rude when they line up. A thin house edge.",
    icon: Cherry,
  },
  {
    id: "afterhours" as const,
    name: "After Hours",
    kicker: "One line",
    copy: "Three windows. The first two reels have to agree. A gem across pays fifty-six.",
    icon: Gem,
  },
  {
    id: "keno" as const,
    name: "The Cage",
    kicker: "Keno",
    copy: "Mark two to six spots. Ten numbers leave the cage. Catch them and the ticket pays.",
    icon: Grid3x3,
  },
  {
    id: "sports" as const,
    name: "The Wire",
    kicker: "Live prices",
    copy: "NFL, MLB, NBA, and NHL. The posted number, locked in chips. No cash, no cash-out.",
    icon: Radio,
  },
  {
    id: "workshop" as const,
    name: "The Pit",
    kicker: "Workshop",
    copy: "The decisions that actually matter. Shoe, rail, cage, draw, and how to read a price.",
    icon: BookOpen,
  },
  {
    id: "training" as const,
    name: "Training Lab",
    kicker: "No chips · no cloud",
    copy: "Repeatable probability challenges. Review the answers and export local practice evidence.",
    icon: BookOpen,
  },
  {
    id: "agents" as const,
    name: "The Agents",
    kicker: "3D · VR",
    copy: "Simulated soccer, baseball, and football. Bet the card. Drag the field, or step into it with a headset.",
    icon: Bot,
  },
];

function gameLabel(game: Ledger["game"]) {
  if (game === "blackjack") return "Shoe";
  if (game === "roulette") return "Wheel";
  if (game === "slots") return "Reels";
  if (game === "craps") return "Rail";
  if (game === "baccarat") return "Salon";
  if (game === "poker") return "Draw";
  if (game === "keno") return "Cage";
  if (game === "afterhours") return "Hours";
  if (game === "sports") return "Wire";
  if (game === "pit") return "Pit";
  if (game === "agents") return "Agents";
  return "House";
}

export function Floor() {
  const setView = useCasino((s) => s.setView);
  const ledger = useCasino((s) => s.ledger);
  const resetPurse = useCasino((s) => s.resetPurse);
  const net = ledger.reduce((sum, row) => sum + row.delta, 0);

  return (
    <Frame>
      <TopBar title="Gilt House" eyebrow="Las Vegas · chips only" />
      <p className="max-w-xl text-base leading-relaxed text-cream-dim">
        The wire is live. The agent field runs soccer, baseball, and football in 3D. Chips stay in this browser and cannot be cashed.
      </p>
      <BrokeBanner />
      <Pianist place="bar" />
      <Bartender place="bar" />
      <div className="stagger mt-6 grid gap-3 sm:grid-cols-2">
        {TABLES.map((table) => {
          const Icon = table.icon;
          return (
            <button
              key={table.id}
              type="button"
              onClick={() => setView(table.id)}
              className="press table-card rise rounded-xl border border-line p-5 text-left hover:border-gold"
            >
              <div className="flex items-center justify-between gap-3">
                <Icon className="size-5 text-gold" aria-hidden />
                <span className="text-xs tracking-widest text-cream-dim uppercase">{table.kicker}</span>
              </div>
              <h2 className="mt-5 font-display text-3xl text-cream italic">{table.name}</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-cream-dim">{table.copy}</p>
            </button>
          );
        })}
      </div>

      <section className="mt-8" aria-label="Recent hands">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl text-cream italic">The book</h2>
          <p className="text-sm text-cream-dim tabular-nums">
            Session {net > 0 ? "+" : ""}
            {chips(net)}
          </p>
        </div>
        {ledger.length === 0 ? (
          <p className="rounded-xl border border-line bg-ink-2 px-4 py-4 text-sm text-cream-dim">
            No hands yet. The felt is open.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-ink-2">
            {ledger.slice(0, 6).map((row) => (
              <li key={row.id} className="flex items-baseline justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs tracking-widest text-gold uppercase">{gameLabel(row.game)}</p>
                  <p className="truncate text-sm text-cream-dim">{row.note}</p>
                </div>
                <p
                  className={`shrink-0 font-medium tabular-nums ${row.delta >= 0 ? "text-gold" : "text-cream"}`}
                >
                  {row.delta > 0 ? "+" : ""}
                  {chips(row.delta)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-8 flex flex-col gap-3 border-t border-line pt-5 text-sm text-cream-dim">
        <p>A supper club, not a cashier. Entertainment only. You should be 18 or older. Chips have no cash value.</p>
        <button
          type="button"
          onClick={resetPurse}
          className="press self-start text-sm text-gold underline-offset-4 hover:underline"
        >
          Reset purse to {chips(OPENING_BANK)}
        </button>
      </footer>
    </Frame>
  );
}
