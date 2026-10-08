import { freshShoe, type Card, type Rank } from "@/lib/casino/cards";

export type CoupSide = "player" | "banker" | "tie";

export type Coup = {
  shoe: Card[];
  player: Card[];
  banker: Card[];
  winner: "player" | "banker" | "tie";
  net: number;
  note: string;
};

function pip(rank: Rank): number {
  if (rank === "A") return 1;
  if (rank === "10" || rank === "J" || rank === "Q" || rank === "K") return 0;
  return Number(rank);
}

export function baccaratTotal(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + pip(card.rank), 0) % 10;
}

function draw(shoe: Card[]): { card: Card; shoe: Card[] } {
  const next = shoe.length < 6 ? freshShoe() : shoe;
  const [card, ...rest] = next;
  if (!card) return draw(freshShoe());
  return { card, shoe: rest };
}

function bankerDraws(total: number, playerThird: number | null): boolean {
  if (playerThird === null) return total <= 5;
  if (total <= 2) return true;
  if (total === 3) return playerThird !== 8;
  if (total === 4) return playerThird >= 2 && playerThird <= 7;
  if (total === 5) return playerThird >= 4 && playerThird <= 7;
  if (total === 6) return playerThird === 6 || playerThird === 7;
  return false;
}

export function playCoup(prevShoe: Card[], side: CoupSide, stake: number): Coup {
  let shoe = prevShoe.length < 20 ? freshShoe() : prevShoe;
  const take = () => {
    const pulled = draw(shoe);
    shoe = pulled.shoe;
    return pulled.card;
  };
  const player = [take(), take()];
  const banker = [take(), take()];
  const p0 = baccaratTotal(player);
  const b0 = baccaratTotal(banker);
  const natural = p0 >= 8 || b0 >= 8;
  if (!natural) {
    let third: number | null = null;
    if (p0 <= 5) {
      const card = take();
      player.push(card);
      third = pip(card.rank);
    }
    if (bankerDraws(b0, third)) banker.push(take());
  }
  const pt = baccaratTotal(player);
  const bt = baccaratTotal(banker);
  const winner = pt > bt ? "player" : bt > pt ? "banker" : "tie";
  let net = -stake;
  if (side === "tie") net = winner === "tie" ? stake * 8 : -stake;
  else if (winner === "tie") net = 0;
  else if (winner === side) net = side === "banker" ? Math.round((stake * 19) / 20) : stake;
  const label = winner === "tie" ? "Tie" : winner === "player" ? "Player" : "Banker";
  const note = `${label} ${winner === "player" ? pt : winner === "banker" ? bt : pt}. ${pt} to ${bt}.`;
  return { shoe, player, banker, winner, net, note };
}
