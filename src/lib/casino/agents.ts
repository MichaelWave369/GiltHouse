import { american, signed } from "@/lib/casino/sports";

export type AgentSport = "soccer" | "baseball" | "football";
export type AgentSide = "home" | "away";
export type AgentMarket = "ml" | "spread" | "total" | "draw";
export type AgentPick = "home" | "away" | "draw" | "over" | "under";

export type Club = { name: string; abbr: string; attack: number; defense: number };

export type AgentMatch = {
  sport: AgentSport;
  status: "card" | "live" | "final";
  tick: number;
  ticks: number;
  homeScore: number;
  awayScore: number;
  possession: AgentSide;
  ballX: number;
  ballZ: number;
  ballY: number;
  inning: number;
  half: "top" | "bot";
  outs: number;
  bases: number;
  yard: number;
  down: number;
  toGo: number;
  log: string[];
  seed: number;
};

export type AgentOffer = {
  market: AgentMarket;
  side: AgentPick;
  odds: number;
  line: number | null;
  label: string;
};

export type AgentBet = {
  id: string;
  sport: AgentSport;
  label: string;
  market: AgentMarket;
  side: AgentPick;
  odds: number;
  line: number | null;
  stake: number;
};

export const CLUBS: Record<AgentSport, { home: Club; away: Club; ticks: number }> = {
  soccer: {
    ticks: 90,
    home: { name: "Lantern", abbr: "LAN", attack: 1.22, defense: 0.94 },
    away: { name: "Harbor", abbr: "HAR", attack: 1.04, defense: 1.06 },
  },
  baseball: {
    ticks: 72,
    home: { name: "Switchback", abbr: "SWB", attack: 1.12, defense: 0.96 },
    away: { name: "Red Line", abbr: "RED", attack: 0.98, defense: 1.04 },
  },
  football: {
    ticks: 56,
    home: { name: "Iron Mile", abbr: "IRM", attack: 1.16, defense: 0.92 },
    away: { name: "South Cut", abbr: "SOU", attack: 1.0, defense: 1.06 },
  },
};

const SPORTS: AgentSport[] = ["soccer", "baseball", "football"];

export function freshMatch(sport: AgentSport, seed = Math.floor(Math.random() * 1e9)): AgentMatch {
  return {
    sport,
    status: "card",
    tick: 0,
    ticks: CLUBS[sport].ticks,
    homeScore: 0,
    awayScore: 0,
    possession: "home",
    ballX: 0,
    ballZ: 0,
    ballY: 0.15,
    inning: 1,
    half: "top",
    outs: 0,
    bases: 0,
    yard: 25,
    down: 1,
    toGo: 10,
    log: ["The card is open. Prices lock when you bet."],
    seed: seed || 1,
  };
}

function randOf(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pushLog(log: string[], line: string) {
  return [line, ...log].slice(0, 5);
}

function other(side: AgentSide): AgentSide {
  return side === "home" ? "away" : "home";
}

export function stepMatch(match: AgentMatch): AgentMatch {
  if (match.status === "final") return match;
  const rand = randOf(match.seed + match.tick * 997 + 17);
  const clubs = CLUBS[match.sport];
  if (match.sport === "soccer") return stepSoccer(match, clubs.home, clubs.away, rand);
  if (match.sport === "baseball") return stepBaseball(match, clubs.home, clubs.away, rand);
  return stepFootball(match, clubs.home, clubs.away, rand);
}

function stepSoccer(match: AgentMatch, home: Club, away: Club, rand: () => number): AgentMatch {
  const side = match.possession;
  const club = side === "home" ? home : away;
  const foe = side === "home" ? away : home;
  const dir = side === "home" ? 1 : -1;
  let ballZ = match.ballZ + dir * (0.07 + rand() * 0.14);
  let ballX = Math.max(-0.92, Math.min(0.92, match.ballX + (rand() - 0.5) * 0.28));
  let ballY = 0.15 + rand() * 0.2;
  let homeScore = match.homeScore;
  let awayScore = match.awayScore;
  let possession = side;
  let log = match.log;
  const heat = club.attack / foe.defense;
  if (ballZ * dir > 0.62 && rand() < 0.42 * heat) {
    ballY = 0.55;
    if (rand() < 0.22 * heat) {
      if (side === "home") homeScore += 1;
      else awayScore += 1;
      log = pushLog(log, `${club.name} scores.`);
      ballX = 0;
      ballZ = 0;
      ballY = 0.15;
      possession = other(side);
    } else {
      log = pushLog(log, `${foe.name} keeps it out.`);
      possession = other(side);
      ballZ *= 0.35;
    }
  } else if (rand() < 0.14) {
    possession = other(side);
    log = pushLog(log, `${CLUBS.soccer[possession].name} takes the ball.`);
  }
  if (ballZ > 1 || ballZ < -1) {
    ballZ = Math.sign(ballZ) * 0.72;
    possession = other(possession);
  }
  const tick = match.tick + 1;
  return { ...match, tick, homeScore, awayScore, possession, ballX, ballZ, ballY, log };
}

function advanceRunners(bases: number, bags: number) {
  const on = [true, (bases & 1) !== 0, (bases & 2) !== 0, (bases & 4) !== 0];
  const next = [false, false, false, false];
  let scored = 0;
  for (let i = 3; i >= 0; i -= 1) {
    if (!on[i]) continue;
    const dest = i + bags;
    if (dest >= 4) scored += 1;
    else next[dest] = true;
  }
  return { bases: (next[1] ? 1 : 0) | (next[2] ? 2 : 0) | (next[3] ? 4 : 0), scored };
}

function stepBaseball(match: AgentMatch, home: Club, away: Club, rand: () => number): AgentMatch {
  if (match.inning > 9 && match.homeScore !== match.awayScore) {
    return { ...match, status: "final", log: pushLog(match.log, "Final.") };
  }
  if (match.inning > 11) return { ...match, status: "final", log: pushLog(match.log, "Final.") };
  const batting = match.half === "top" ? "away" : "home";
  const bat = batting === "home" ? home : away;
  const pit = batting === "home" ? away : home;
  const roll = rand();
  const outRate = Math.min(0.78, 0.64 * (pit.defense / bat.attack));
  let outs = match.outs;
  let bases = match.bases;
  let homeScore = match.homeScore;
  let awayScore = match.awayScore;
  let log = match.log;
  const ballX = (rand() - 0.5) * 0.8;
  let ballZ = 0.2 + rand() * 0.5;
  let ballY = 0.4;
  if (roll < outRate) {
    outs += 1;
    log = pushLog(log, `${pit.name} gets the out.`);
    ballY = 0.8;
  } else if (roll < outRate + 0.2) {
    const moved = advanceRunners(bases, 1);
    bases = moved.bases;
    if (batting === "home") homeScore += moved.scored;
    else awayScore += moved.scored;
    log = pushLog(log, `${bat.name} singles.`);
  } else if (roll < outRate + 0.28) {
    const moved = advanceRunners(bases, 2);
    bases = moved.bases;
    if (batting === "home") homeScore += moved.scored;
    else awayScore += moved.scored;
    log = pushLog(log, `${bat.name} doubles.`);
    ballZ = -0.2;
    ballY = 0.9;
  } else {
    const moved = advanceRunners(bases, 4);
    bases = 0;
    if (batting === "home") homeScore += moved.scored;
    else awayScore += moved.scored;
    log = pushLog(log, `${bat.name} goes deep.`);
    ballY = 1.4;
    ballZ = -0.8;
  }
  let inning = match.inning;
  let half = match.half;
  if (outs >= 3) {
    outs = 0;
    bases = 0;
    if (half === "top") half = "bot";
    else {
      half = "top";
      inning += 1;
    }
    log = pushLog(log, half === "bot" ? `Inning ${inning}, home bats.` : `Inning ${inning}.`);
  }
  const done = inning > 9 && homeScore !== awayScore;
  return {
    ...match,
    tick: match.tick + 1,
    status: done || inning > 11 ? "final" : match.status,
    homeScore,
    awayScore,
    possession: batting,
    outs,
    bases,
    inning,
    half,
    ballX,
    ballZ,
    ballY,
    log,
  };
}

function scoreSide(match: AgentMatch, side: AgentSide, points: number) {
  return side === "home"
    ? { homeScore: match.homeScore + points, awayScore: match.awayScore }
    : { homeScore: match.homeScore, awayScore: match.awayScore + points };
}

function stepFootball(match: AgentMatch, home: Club, away: Club, rand: () => number): AgentMatch {
  const side = match.possession;
  const club = side === "home" ? home : away;
  const foe = side === "home" ? away : home;
  const dir = side === "home" ? 1 : -1;
  let yard = match.yard;
  let down = match.down;
  let toGo = match.toGo;
  let possession = side;
  let scores = { homeScore: match.homeScore, awayScore: match.awayScore };
  let log = match.log;
  const gain = Math.round((rand() * 18 - 2) * (0.72 + 0.5 * (club.attack / foe.defense)));
  if (rand() < 0.045) {
    possession = other(side);
    yard = Math.max(1, Math.min(99, yard));
    down = 1;
    toGo = 10;
    log = pushLog(log, `${foe.name} takes it away.`);
  } else {
    yard += gain * dir;
    if ((side === "home" && yard >= 100) || (side === "away" && yard <= 0)) {
      scores = scoreSide(match, side, 7);
      log = pushLog(log, `${club.name} scores.`);
      possession = other(side);
      yard = side === "home" ? 75 : 25;
      down = 1;
      toGo = 10;
    } else if (yard < 0 || yard > 100) {
      scores = scoreSide(match, other(side), 2);
      log = pushLog(log, "Safety.");
      possession = other(side);
      yard = 35;
      down = 1;
      toGo = 10;
    } else if (gain >= toGo) {
      down = 1;
      toGo = Math.min(10, side === "home" ? 100 - yard : yard);
      log = pushLog(log, `${club.name} moves the chains.`);
    } else {
      down += 1;
      toGo = Math.max(1, toGo - gain);
      if (down > 4) {
        const kickSpot = side === "home" ? yard >= 62 : yard <= 38;
        if (kickSpot && rand() < 0.72) {
          scores = scoreSide({ ...match, ...scores }, side, 3);
          log = pushLog(log, `${club.name} kicks it through.`);
          possession = other(side);
          yard = side === "home" ? 70 : 30;
        } else {
          possession = other(side);
          log = pushLog(log, `${foe.name} takes over.`);
        }
        down = 1;
        toGo = 10;
      } else {
        log = pushLog(log, `${club.name} gains ${gain}.`);
      }
    }
  }
  const tick = match.tick + 1;
  let homeScore = scores.homeScore;
  let awayScore = scores.awayScore;
  if (tick >= match.ticks && homeScore === awayScore) {
    if (rand() < home.attack / (home.attack + away.attack)) homeScore += 3;
    else awayScore += 3;
    log = pushLog(log, "A kick decides it.");
  }
  return {
    ...match,
    homeScore,
    awayScore,
    tick,
    status: tick >= match.ticks ? "final" : match.status,
    possession,
    yard: Math.max(1, Math.min(99, yard)),
    down,
    toGo,
    ballX: (rand() - 0.5) * 0.35,
    ballZ: (Math.max(1, Math.min(99, yard)) - 50) / 50,
    ballY: 0.25,
    log,
  };
}

function poisson(k: number, lambda: number) {
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i += 1) p *= lambda / i;
  return p;
}

function normCdf(x: number) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.2316419 * ax);
  const d = 0.3989423 * Math.exp((-ax * ax) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return 0.5 + sign * (0.5 - p);
}

function fromProb(p: number) {
  const q = Math.min(0.93, Math.max(0.04, p * 1.05));
  if (q >= 0.5) return Math.round((-100 * q) / (1 - q));
  return Math.round((100 * (1 - q)) / q);
}

function soccerMass(homeLeft: number, awayLeft: number, homeNow: number, awayNow: number) {
  let home = 0;
  let draw = 0;
  let away = 0;
  let over = 0;
  const totalLine = 2.5;
  for (let i = 0; i <= 8; i += 1) {
    for (let j = 0; j <= 8; j += 1) {
      const p = poisson(i, homeLeft) * poisson(j, awayLeft);
      const h = homeNow + i;
      const a = awayNow + j;
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;
      if (h + a > totalLine) over += p;
    }
  }
  return { home, draw, away, over };
}

export function offers(match: AgentMatch): AgentOffer[] {
  const clubs = CLUBS[match.sport];
  const remain = Math.max(0.04, 1 - match.tick / match.ticks);
  const home = clubs.home;
  const away = clubs.away;
  if (match.sport === "soccer") {
    const mass = soccerMass(
      1.05 * remain * (home.attack / away.defense),
      0.98 * remain * (away.attack / home.defense),
      match.homeScore,
      match.awayScore,
    );
    const spread = home.attack >= away.attack ? -0.5 : 0.5;
    return [
      { market: "ml", side: "home", odds: fromProb(mass.home), line: null, label: `${home.abbr} ${american(fromProb(mass.home))}` },
      { market: "draw", side: "draw", odds: fromProb(mass.draw), line: null, label: `Draw ${american(fromProb(mass.draw))}` },
      { market: "ml", side: "away", odds: fromProb(mass.away), line: null, label: `${away.abbr} ${american(fromProb(mass.away))}` },
      { market: "spread", side: "home", odds: fromProb(mass.home > mass.away ? 0.56 : 0.48), line: spread, label: `${home.abbr} ${signed(spread)}` },
      { market: "spread", side: "away", odds: fromProb(mass.home > mass.away ? 0.48 : 0.56), line: -spread, label: `${away.abbr} ${signed(-spread)}` },
      { market: "total", side: "over", odds: fromProb(mass.over), line: 2.5, label: `Over 2.5 ${american(fromProb(mass.over))}` },
      { market: "total", side: "under", odds: fromProb(1 - mass.over), line: 2.5, label: `Under 2.5 ${american(fromProb(1 - mass.over))}` },
    ];
  }
  const expHome = (match.sport === "baseball" ? 4.3 : 18) * remain * (home.attack / away.defense);
  const expAway = (match.sport === "baseball" ? 4.0 : 15.5) * remain * (away.attack / home.defense);
  const meanMargin = match.homeScore - match.awayScore + expHome - expAway;
  const sd = (match.sport === "baseball" ? 3.1 : 10) * Math.sqrt(remain);
  const pHome = 1 - normCdf((0.5 - meanMargin) / sd);
  const spread =
    match.sport === "baseball"
      ? meanMargin >= 0
        ? -1.5
        : 1.5
      : Math.max(-17, Math.min(17, Math.round(-meanMargin * 2) / 2)) || -3.5;
  const pCover = 1 - normCdf((-spread - meanMargin) / sd);
  const total = match.sport === "baseball" ? 8.5 : 33.5;
  const meanSum = match.homeScore + match.awayScore + expHome + expAway;
  const pOver = 1 - normCdf((total + 0.5 - meanSum) / (sd * 1.3));
  return [
    { market: "ml", side: "home", odds: fromProb(pHome), line: null, label: `${home.abbr} ${american(fromProb(pHome))}` },
    { market: "ml", side: "away", odds: fromProb(1 - pHome), line: null, label: `${away.abbr} ${american(fromProb(1 - pHome))}` },
    { market: "spread", side: "home", odds: fromProb(pCover), line: spread, label: `${home.abbr} ${signed(spread)} ${american(fromProb(pCover))}` },
    { market: "spread", side: "away", odds: fromProb(1 - pCover), line: -spread, label: `${away.abbr} ${signed(-spread)} ${american(fromProb(1 - pCover))}` },
    { market: "total", side: "over", odds: fromProb(pOver), line: total, label: `Over ${total} ${american(fromProb(pOver))}` },
    { market: "total", side: "under", odds: fromProb(1 - pOver), line: total, label: `Under ${total} ${american(fromProb(1 - pOver))}` },
  ];
}

export function gradeAgent(bet: AgentBet, match: AgentMatch): "open" | "win" | "loss" | "push" {
  if (match.status !== "final" || bet.sport !== match.sport) return "open";
  const home = match.homeScore;
  const away = match.awayScore;
  if (bet.market === "draw") return home === away ? "win" : "loss";
  if (bet.market === "ml") {
    if (home === away) return "push";
    return (bet.side === "home") === home > away ? "win" : "loss";
  }
  if (bet.market === "spread") {
    if (bet.line === null) return "open";
    const cover = bet.side === "home" ? home + bet.line - away : away + bet.line - home;
    if (Math.abs(cover) < 0.001) return "push";
    return cover > 0 ? "win" : "loss";
  }
  if (bet.line === null) return "open";
  const sum = home + away;
  if (sum === bet.line) return "push";
  if (bet.side === "over") return sum > bet.line ? "win" : "loss";
  return sum < bet.line ? "win" : "loss";
}

export function agentPayout(stake: number, odds: number, grade: "win" | "loss" | "push" | "open") {
  if (grade === "push") return stake;
  if (grade !== "win") return 0;
  return stake + (odds > 0 ? (stake * odds) / 100 : (stake * 100) / Math.abs(odds));
}

export function clockLabel(match: AgentMatch) {
  if (match.status === "card") return "Card";
  if (match.status === "final") return "Final";
  if (match.sport === "soccer") return `${match.tick}'`;
  if (match.sport === "baseball") return `${match.half === "top" ? "Top" : "Bot"} ${match.inning}`;
  return `Q${Math.min(4, Math.floor(match.tick / 14) + 1)} · ${match.down} and ${match.toGo}`;
}

export function betsOpen(match: AgentMatch) {
  return match.status === "card" || (match.status === "live" && match.tick / match.ticks < 0.82);
}

export function isAgentSport(value: string): value is AgentSport {
  return SPORTS.includes(value as AgentSport);
}

type Vec = [number, number, number];

export function stagePose(match: AgentMatch): { ball: Vec; home: Vec[]; away: Vec[] } {
  if (match.sport === "baseball") return baseballPose(match);
  if (match.sport === "football") return footballPose(match);
  return soccerPose(match);
}

function soccerPose(match: AgentMatch): { ball: Vec; home: Vec[]; away: Vec[] } {
  const homeForm: Array<[number, number]> = [
    [0, -5.2],
    [-2.1, -3.3],
    [0, -3.1],
    [2.1, -3.3],
    [-3.1, -1],
    [-1, -0.6],
    [1.1, -0.4],
    [3, -0.9],
    [-2, 1.3],
    [0.3, 1.7],
    [2.1, 1.1],
  ];
  const shift = match.ballZ * 1.4;
  const home = homeForm.map(([x, z]) => [x, 0.35, z + shift * 0.35] as Vec);
  const away = homeForm.map(([x, z]) => [-x, 0.35, -z + shift * 0.35] as Vec);
  return { ball: [match.ballX * 3.6, 0.22 + match.ballY, match.ballZ * 5.2], home, away };
}

function baseballPose(match: AgentMatch): { ball: Vec; home: Vec[]; away: Vec[] } {
  const defense: Vec[] = [
    [0.35, 0.35, 4.3],
    [0, 0.4, 2.3],
    [2.3, 0.35, 2.1],
    [0.2, 0.35, 0.1],
    [-0.9, 0.35, 0.5],
    [-2.3, 0.35, 2.1],
    [-3.2, 0.35, -1.6],
    [0, 0.35, -3.4],
    [3.2, 0.35, -1.6],
  ];
  const batter: Vec = [match.half === "top" ? -0.55 : 0.55, 0.35, 4.5];
  const bags: Vec[] = [
    [2.2, 0.35, 2.15],
    [0, 0.35, -0.05],
    [-2.2, 0.35, 2.15],
  ];
  const offense: Vec[] = [batter, [3.6, 0.35, 4.6], [3.9, 0.35, 5], [-3.6, 0.35, 4.6], [-3.9, 0.35, 5]];
  [1, 2, 4].forEach((bit, index) => {
    if ((match.bases & bit) !== 0) {
      const bag = bags[index];
      if (bag) offense[index + 1] = bag;
    }
  });
  while (offense.length < 11) offense.push([6, -2, 0]);
  const field = match.half === "top" ? defense : defense.map((spot) => [-spot[0], spot[1], spot[2]] as Vec);
  const bat = match.half === "top" ? offense : offense.map((spot) => [-spot[0], spot[1], spot[2]] as Vec);
  const home = match.half === "bot" ? bat : field;
  const away = match.half === "top" ? bat : field;
  return {
    ball: [match.ballX * 3, 0.35 + match.ballY, 3.2 - match.ballZ * 4],
    home: home.slice(0, 11),
    away: away.slice(0, 11),
  };
}

function footballPose(match: AgentMatch): { ball: Vec; home: Vec[]; away: Vec[] } {
  const z = match.ballZ * 5.4;
  const dir = match.possession === "home" ? 1 : -1;
  const home: Vec[] = [];
  const away: Vec[] = [];
  for (let i = 0; i < 11; i += 1) {
    const x = -3.2 + (i % 6) * 1.25;
    const row = i < 6 ? 0 : 0.7;
    home.push([x, 0.35, z - dir * (0.45 + row)]);
    away.push([x, 0.35, z + dir * (0.45 + row)]);
  }
  return { ball: [match.ballX, 0.28, z], home, away };
}
