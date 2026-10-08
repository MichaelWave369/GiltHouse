export const WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20,
  14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

export const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type Bet =
  | { kind: "straight"; n: number }
  | { kind: "color"; color: "red" | "black" }
  | { kind: "parity"; parity: "even" | "odd" }
  | { kind: "half"; half: "low" | "high" }
  | { kind: "dozen"; dozen: 1 | 2 | 3 }
  | { kind: "column"; column: 1 | 2 | 3 };

export function pocketTone(n: number): "felt" | "oxblood" | "ink" {
  if (n === 0) return "felt";
  return REDS.has(n) ? "oxblood" : "ink";
}

export function pocketName(n: number): string {
  if (n === 0) return "0";
  return `${n} ${REDS.has(n) ? "red" : "black"}`;
}

export function betKey(bet: Bet): string {
  switch (bet.kind) {
    case "straight":
      return `n:${bet.n}`;
    case "color":
      return `c:${bet.color}`;
    case "parity":
      return `p:${bet.parity}`;
    case "half":
      return `h:${bet.half}`;
    case "dozen":
      return `d:${bet.dozen}`;
    case "column":
      return `col:${bet.column}`;
  }
}

export function betLabel(bet: Bet): string {
  switch (bet.kind) {
    case "straight":
      return bet.n === 0 ? "0" : String(bet.n);
    case "color":
      return bet.color === "red" ? "Red" : "Black";
    case "parity":
      return bet.parity === "even" ? "Even" : "Odd";
    case "half":
      return bet.half === "low" ? "1–18" : "19–36";
    case "dozen":
      return bet.dozen === 1 ? "1st 12" : bet.dozen === 2 ? "2nd 12" : "3rd 12";
    case "column":
      return `Column ${bet.column}`;
  }
}

export function betOdds(bet: Bet): string {
  if (bet.kind === "straight") return "35:1";
  if (bet.kind === "dozen" || bet.kind === "column") return "2:1";
  return "1:1";
}

function returnMultiple(bet: Bet): number {
  if (bet.kind === "straight") return 36;
  if (bet.kind === "dozen" || bet.kind === "column") return 3;
  return 2;
}

export function betWins(bet: Bet, n: number): boolean {
  switch (bet.kind) {
    case "straight":
      return bet.n === n;
    case "color":
      if (n === 0) return false;
      return bet.color === "red" ? REDS.has(n) : !REDS.has(n);
    case "parity":
      if (n === 0) return false;
      return bet.parity === "even" ? n % 2 === 0 : n % 2 === 1;
    case "half":
      if (n === 0) return false;
      return bet.half === "low" ? n <= 18 : n >= 19;
    case "dozen":
      if (n === 0) return false;
      return Math.ceil(n / 12) === bet.dozen;
    case "column":
      if (n === 0) return false;
      if (bet.column === 3) return n % 3 === 0;
      return n % 3 === bet.column;
  }
}

export type SlipLine = { bet: Bet; amount: number };

export function settleWheel(lines: SlipLine[], n: number): { payout: number; stake: number; net: number } {
  let stake = 0;
  let payout = 0;
  for (const line of lines) {
    stake += line.amount;
    if (betWins(line.bet, n)) payout += line.amount * returnMultiple(line.bet);
  }
  return { payout, stake, net: payout - stake };
}

export const SLICE = 360 / WHEEL.length;
