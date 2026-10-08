export const KENO_MAX = 40;
export const KENO_DRAW = 10;
export const KENO_MIN = 2;
export const KENO_PICKS = 6;

export const KENO_PAY: Record<number, Record<number, number>> = {
  2: { 2: 16 },
  3: { 2: 4, 3: 32 },
  4: { 2: 2, 3: 8, 4: 80 },
  5: { 3: 7, 4: 30, 5: 200 },
  6: { 3: 4, 4: 14, 5: 40, 6: 250 },
};

export function drawKeno(picks: number[]) {
  const pool = Array.from({ length: KENO_MAX }, (_, index) => index + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = pool[i] ?? 1;
    pool[i] = pool[j] ?? swap;
    pool[j] = swap;
  }
  const drawn = pool.slice(0, KENO_DRAW);
  const hitList = picks.filter((spot) => drawn.includes(spot));
  const mult = KENO_PAY[picks.length]?.[hitList.length] ?? 0;
  return { drawn, hits: hitList.length, mult };
}
