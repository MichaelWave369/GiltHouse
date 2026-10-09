/**
 * Static host boundary. Do NOT call the live scoreboard's server function
 * in GitHub Pages. The original hosted Sportsbook stays unchanged.
 */
import { Frame, TopBar } from "@/components/casino/shell";

export function Sportsbook() {
  return (
    <Frame>
      <TopBar title="The Wire" eyebrow="Hosted edition only" />
      <div className="mx-auto max-w-xl rounded-2xl border border-gold/50 bg-ink-2 p-6 text-cream">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Live scoreboard unavailable on static hosting</p>
        <h2 className="mt-3 font-display text-3xl italic">The wire is taking a night off.</h2>
        <p className="mt-3 text-sm leading-relaxed text-cream-dim">
          This GitHub Pages edition runs without a server. Live sports scores
          and ticket settlement need the separately hosted Gilt House service,
          so The Wire does not accept or grade tickets here.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-cream-dim">
          All casino chips are free, nonredeemable entertainment-only play credits.
          Your Neon Block shops, quests, arcade and local training activities
          remain playable.
        </p>
      </div>
    </Frame>
  );
}
