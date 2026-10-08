export type Suit = "s" | "h" | "d" | "c";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type Card = { rank: Rank; suit: Suit; id: string };

const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS: Suit[] = ["s", "h", "d", "c"];

export const SUIT_NAME: Record<Suit, string> = {
  s: "spades",
  h: "hearts",
  d: "diamonds",
  c: "clubs",
};

export function freshShoe(decks = 6): Card[] {
  const cards: Card[] = [];
  let n = 0;
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ rank, suit, id: `${d}-${suit}-${rank}-${n++}` });
      }
    }
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = cards[i];
    const b = cards[j];
    if (a && b) {
      cards[i] = b;
      cards[j] = a;
    }
  }
  return cards;
}

export function handValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === "A") {
      aces += 1;
      total += 11;
    } else if (card.rank === "K" || card.rank === "Q" || card.rank === "J" || card.rank === "10") {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}

function take(shoe: Card[]): { card: Card; shoe: Card[] } {
  const [card, ...rest] = shoe;
  if (!card) {
    const reshuffled = freshShoe();
    const [next, ...tail] = reshuffled;
    if (!next) throw new Error("Shoe failed to shuffle");
    return { card: next, shoe: tail };
  }
  return { card, shoe: rest };
}

export type RoundPhase = "bet" | "play" | "done";

export type Round = {
  shoe: Card[];
  phase: RoundPhase;
  player: Card[];
  dealer: Card[];
  hideHole: boolean;
  stake: number;
  note: string;
  net: number | null;
};

export function emptyRound(): Round {
  return {
    shoe: [],
    phase: "bet",
    player: [],
    dealer: [],
    hideHole: false,
    stake: 0,
    note: "Place a wager. The shoe is six decks.",
    net: null,
  };
}

function result(
  player: Card[],
  dealer: Card[],
  stake: number,
  natural: boolean,
): { note: string; net: number } {
  const pv = handValue(player).total;
  const dv = handValue(dealer).total;
  const pBJ = natural && isBlackjack(player);
  const dBJ = natural && isBlackjack(dealer);
  if (pBJ && dBJ) return { note: "Push. Both have blackjack.", net: 0 };
  if (pBJ) return { note: "Blackjack pays three to two.", net: Math.round((stake * 3) / 2) };
  if (dBJ) return { note: "Dealer blackjack.", net: -stake };
  if (pv > 21) return { note: `You bust at ${pv}.`, net: -stake };
  if (dv > 21) return { note: `Dealer busts at ${dv}.`, net: stake };
  if (pv > dv) return { note: `${pv} beats ${dv}.`, net: stake };
  if (pv < dv) return { note: `Dealer ${dv} beats ${pv}.`, net: -stake };
  return { note: `Push at ${pv}.`, net: 0 };
}

export function dealRound(prev: Round, bet: number): Round {
  let shoe = prev.shoe.length < 52 ? freshShoe() : prev.shoe;
  const p1 = take(shoe);
  shoe = p1.shoe;
  const d1 = take(shoe);
  shoe = d1.shoe;
  const p2 = take(shoe);
  shoe = p2.shoe;
  const d2 = take(shoe);
  shoe = d2.shoe;
  const player = [p1.card, p2.card];
  const dealer = [d1.card, d2.card];
  if (isBlackjack(player) || isBlackjack(dealer)) {
    const settled = result(player, dealer, bet, true);
    return {
      shoe,
      phase: "done",
      player,
      dealer,
      hideHole: false,
      stake: bet,
      note: settled.note,
      net: settled.net,
    };
  }
  return {
    shoe,
    phase: "play",
    player,
    dealer,
    hideHole: true,
    stake: bet,
    note: "Hit, stand, or double.",
    net: null,
  };
}

export function hitRound(prev: Round): Round {
  const drawn = take(prev.shoe);
  const player = [...prev.player, drawn.card];
  if (handValue(player).total > 21) {
    const settled = result(player, prev.dealer, prev.stake, false);
    return {
      ...prev,
      shoe: drawn.shoe,
      player,
      hideHole: false,
      phase: "done",
      note: settled.note,
      net: settled.net,
    };
  }
  return {
    ...prev,
    shoe: drawn.shoe,
    player,
    note: `${handValue(player).total}. Hit or stand.`,
  };
}

export function standRound(prev: Round): Round {
  let shoe = prev.shoe;
  let dealer = [...prev.dealer];
  if (handValue(prev.player).total <= 21) {
    while (handValue(dealer).total < 17) {
      const drawn = take(shoe);
      shoe = drawn.shoe;
      dealer = [...dealer, drawn.card];
    }
  }
  const settled = result(prev.player, dealer, prev.stake, false);
  return {
    ...prev,
    shoe,
    dealer,
    hideHole: false,
    phase: "done",
    note: settled.note,
    net: settled.net,
  };
}

export function doubleRound(prev: Round): Round {
  const drawn = take(prev.shoe);
  const player = [...prev.player, drawn.card];
  const stake = prev.stake * 2;
  const mid: Round = { ...prev, shoe: drawn.shoe, player, stake };
  if (handValue(player).total > 21) {
    const settled = result(player, prev.dealer, stake, false);
    return {
      ...mid,
      hideHole: false,
      phase: "done",
      note: settled.note,
      net: settled.net,
    };
  }
  return standRound(mid);
}
