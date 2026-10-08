export type Sym = "seven" | "crown" | "bell" | "cherry" | "citrus";

export const PAY: Record<Sym, { w: number; p3: number; p2: number; label: string }> = {
  seven: { w: 6, p3: 32, p2: 8, label: "Seven" },
  crown: { w: 9, p3: 18, p2: 5, label: "Crown" },
  bell: { w: 14, p3: 11, p2: 3, label: "Bell" },
  cherry: { w: 18, p3: 7, p2: 3, label: "Cherry" },
  citrus: { w: 24, p3: 5, p2: 2, label: "Citrus" },
};

export const SYMBOLS = Object.keys(PAY) as Sym[];

const ROW_NAME = ["Top", "Middle", "Bottom"] as const;

export type Grid = [Sym, Sym, Sym][];

export type LineWin = { row: 0 | 1 | 2; sym: Sym; count: 2 | 3; mult: number };

export function randomSym(): Sym {
  const entries = SYMBOLS;
  const total = entries.reduce((sum, key) => sum + PAY[key].w, 0);
  let r = Math.random() * total;
  for (const key of entries) {
    r -= PAY[key].w;
    if (r <= 0) return key;
  }
  return "citrus";
}

export function spinGrid(): Grid {
  return [0, 1, 2].map(() => [randomSym(), randomSym(), randomSym()] as [Sym, Sym, Sym]);
}

export const IDLE_GRID: Grid = [
  ["seven", "cherry", "bell"],
  ["crown", "citrus", "cherry"],
  ["bell", "crown", "seven"],
];

export function evaluate(
  grid: Grid,
  bet: number,
): { lines: LineWin[]; payout: number; net: number; note: string } {
  const lineBet = bet / 3;
  const lines: LineWin[] = [];
  let payout = 0;
  for (const row of [0, 1, 2] as const) {
    const a = grid[0][row];
    const b = grid[1][row];
    const c = grid[2][row];
    if (!a || !b || !c) continue;
    if (a === b && b === c) {
      const mult = PAY[a].p3;
      lines.push({ row, sym: a, count: 3, mult });
      payout += mult * lineBet;
    } else if (a === b) {
      const mult = PAY[a].p2;
      lines.push({ row, sym: a, count: 2, mult });
      payout += mult * lineBet;
    }
  }
  const net = payout - bet;
  let note = "No line. The house keeps the spin.";
  if (lines.length === 1) {
    const line = lines[0];
    if (line) note = `${ROW_NAME[line.row]} · ${line.count} ${PAY[line.sym].label} · ${line.mult}× line`;
  } else if (lines.length > 1) {
    note = `${lines.length} lines hit.`;
  }
  return { lines, payout, net, note };
}
