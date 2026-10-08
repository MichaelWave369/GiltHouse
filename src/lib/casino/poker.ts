import { freshShoe, type Card, type Rank } from "@/lib/casino/cards";

const VALUE: Record<Rank, number> = {
  A: 14,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};

export type PokerHand = { name: string; mult: number };

export function scorePoker(cards: Card[]): PokerHand {
  const values = cards.map((card) => VALUE[card.rank]).sort((a, b) => a - b);
  const flush = cards.every((card) => card.suit === cards[0]?.suit);
  const unique = [...new Set(values)];
  const wheel = unique.length === 5 && unique.join() === "2,3,4,5,14";
  const straight = unique.length === 5 && (values[4]! - values[0]! === 4 || wheel);
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const groups = [...counts.values()].sort((a, b) => b - a);
  const pairHigh = [...counts.entries()].filter(([, n]) => n === 2).map(([v]) => v);
  if (straight && flush && !wheel && values[0] === 10) return { name: "Royal flush", mult: 800 };
  if (straight && flush) return { name: "Straight flush", mult: 50 };
  if (groups[0] === 4) return { name: "Four of a kind", mult: 25 };
  if (groups[0] === 3 && groups[1] === 2) return { name: "Full house", mult: 9 };
  if (flush) return { name: "Flush", mult: 6 };
  if (straight) return { name: "Straight", mult: 4 };
  if (groups[0] === 3) return { name: "Three of a kind", mult: 3 };
  if (groups[0] === 2 && groups[1] === 2) return { name: "Two pair", mult: 2 };
  if (groups[0] === 2 && Math.max(...pairHigh) >= 11) return { name: "Jacks or better", mult: 1 };
  return { name: "No pair", mult: 0 };
}

export function dealPoker(): { deck: Card[]; hand: Card[] } {
  const deck = freshShoe(1);
  return { deck: deck.slice(5), hand: deck.slice(0, 5) };
}

export function drawPoker(deck: Card[], hand: Card[], held: boolean[]): { deck: Card[]; hand: Card[] } {
  const next = hand.slice();
  const rest = deck.slice();
  for (let i = 0; i < 5; i++) {
    if (held[i]) continue;
    const card = rest.shift();
    if (card) next[i] = card;
  }
  return { deck: rest, hand: next };
}
