export type CrapsSide = "pass" | "dont";
export type CrapsPhase = "comeout" | "point";

export type RollOutcome = {
  phase: CrapsPhase;
  point: number | null;
  net: number | null;
  note: string;
};

export function rollDice(): [number, number] {
  return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
}

export function resolveCraps(
  phase: CrapsPhase,
  point: number | null,
  dice: [number, number],
  side: CrapsSide,
  stake: number,
): RollOutcome {
  const sum = dice[0] + dice[1];
  const faces = `${dice[0]} and ${dice[1]}`;
  if (phase === "comeout") {
    if (sum === 7 || sum === 11) {
      return {
        phase: "comeout",
        point: null,
        net: side === "pass" ? stake : -stake,
        note: side === "pass" ? `${faces}. Natural ${sum}.` : `${faces}. Natural ${sum} beats don't pass.`,
      };
    }
    if (sum === 2 || sum === 3 || sum === 12) {
      if (side === "pass") {
        return { phase: "comeout", point: null, net: -stake, note: `${faces}. Craps ${sum}.` };
      }
      if (sum === 12) {
        return { phase: "comeout", point: null, net: 0, note: `${faces}. Twelve bars don't pass.` };
      }
      return { phase: "comeout", point: null, net: stake, note: `${faces}. Craps ${sum} pays don't pass.` };
    }
    return { phase: "point", point: sum, net: null, note: `${faces}. Point is ${sum}.` };
  }
  if (sum === point) {
    return {
      phase: "comeout",
      point: null,
      net: side === "pass" ? stake : -stake,
      note: side === "pass" ? `${faces}. Point ${sum} hits.` : `${faces}. Point ${sum} takes don't pass.`,
    };
  }
  if (sum === 7) {
    return {
      phase: "comeout",
      point: null,
      net: side === "pass" ? -stake : stake,
      note: side === "pass" ? `${faces}. Seven out.` : `${faces}. Seven out pays don't pass.`,
    };
  }
  return { phase: "point", point, net: null, note: `${faces}. Point stays ${point}.` };
}
