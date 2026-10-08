import { Club, Diamond, Heart, Spade } from "lucide-react";
import type { Card } from "@/lib/casino/cards";
import { SUIT_NAME } from "@/lib/casino/cards";

const ICONS = { s: Spade, h: Heart, d: Diamond, c: Club } as const;

export function PlayingCard({
  card,
  faceDown,
  compact,
  index = 0,
}: {
  card?: Card;
  faceDown?: boolean;
  compact?: boolean;
  index?: number;
}) {
  const box = compact ? "h-20 w-14" : "h-24 w-16 sm:h-28 sm:w-20";
  const motion = { animationDelay: `${index * 55}ms` };
  if (faceDown || !card) {
    return (
      <div
        className={`deal flex ${box} items-center justify-center rounded-lg border-2 border-gold bg-felt shadow-lg`}
        style={motion}
        aria-hidden
      >
        <Spade className="size-5 text-gold" />
      </div>
    );
  }
  const red = card.suit === "h" || card.suit === "d";
  const Icon = ICONS[card.suit];
  return (
    <div
      className={`deal flex ${box} flex-col justify-between rounded-lg bg-cream p-1.5 shadow-lg ${red ? "text-oxblood" : "text-ink"}`}
      style={motion}
      aria-label={`${card.rank} of ${SUIT_NAME[card.suit]}`}
    >
      <div className="flex items-center gap-0.5 text-sm leading-none font-semibold">
        <span>{card.rank}</span>
        <Icon className="size-3" aria-hidden />
      </div>
      <Icon className="mx-auto size-6 sm:size-8" aria-hidden />
      <div className="flex rotate-180 items-center gap-0.5 self-end text-sm leading-none font-semibold">
        <span>{card.rank}</span>
        <Icon className="size-3" aria-hidden />
      </div>
    </div>
  );
}
