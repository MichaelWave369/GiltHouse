export type Night = "gem" | "coupe" | "star" | "olive" | "chip";

export const NIGHT_PAY: Record<Night, { w: number; p3: number; p2: number; label: string }> = {
  gem: { w: 5, p3: 56, p2: 7, label: "Gem" },
  coupe: { w: 9, p3: 26, p2: 5, label: "Coupe" },
  star: { w: 14, p3: 14, p2: 3, label: "Star" },
  olive: { w: 22, p3: 8, p2: 2, label: "Olive" },
  chip: { w: 32, p3: 5, p2: 1, label: "Chip" },
};

export const NIGHTS = Object.keys(NIGHT_PAY) as Night[];

export type NightLine = [Night, Night, Night];

export const IDLE_LINE: NightLine = ["gem", "coupe", "star"];

export function randomNight(): Night {
  const total = NIGHTS.reduce((sum, key) => sum + NIGHT_PAY[key].w, 0);
  let roll = Math.random() * total;
  for (const key of NIGHTS) {
    roll -= NIGHT_PAY[key].w;
    if (roll <= 0) return key;
  }
  return "chip";
}

export function spinLine(): NightLine {
  return [randomNight(), randomNight(), randomNight()];
}

export function evaluateHours(line: NightLine, bet: number) {
  const [a, b, c] = line;
  let mult = 0;
  let note = "No line. The house keeps the spin.";
  if (a && b && c && a === b && b === c) {
    mult = NIGHT_PAY[a].p3;
    note = `Three ${NIGHT_PAY[a].label} · ${mult}×`;
  } else if (a && b && a === b) {
    mult = NIGHT_PAY[a].p2;
    note = `Two ${NIGHT_PAY[a].label} · ${mult}×`;
  }
  const payout = mult * bet;
  return { mult, payout, net: payout - bet, note };
}
