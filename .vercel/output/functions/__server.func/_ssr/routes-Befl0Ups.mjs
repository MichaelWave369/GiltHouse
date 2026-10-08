import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as BookOpen, S as Bot, _ as Club, a as Star, b as ChevronLeft, c as Martini, d as Gem, f as Dices, g as Coins, h as Crown, l as Heart, m as Diamond, n as Volume2, o as Spade, p as Dice5, r as Undo2, s as Radio, t as VolumeX, u as Grid3x3, v as Citrus, w as Bell, x as Cherry, y as CircleDot } from "../_libs/lucide-react.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as returnChips, i as profit, o as signed, r as gradeTicket, t as american } from "./sports-ClaO3d74.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Befl0Ups.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ctx = null;
var master = null;
var sfx = null;
var music = null;
var noiseBuf = null;
var loungeWanted = false;
var loungeRunning = false;
var loungeTimer = 0;
var nextNote = 0;
var beat = 0;
var loungeGen = 0;
var QUARTER = .86;
var CHORDS = [
	{ notes: [
		293.66,
		349.23,
		440,
		523.25
	] },
	{ notes: [
		349.23,
		392,
		493.88,
		587.33
	] },
	{ notes: [
		329.63,
		392,
		493.88,
		523.25
	] },
	{ notes: [
		349.23,
		440,
		523.25,
		554.37
	] }
];
var WALK = [
	[
		73.42,
		82.41,
		87.31,
		98
	],
	[
		98,
		110,
		116.54,
		130.81
	],
	[
		65.41,
		73.42,
		82.41,
		87.31
	],
	[
		110,
		103.83,
		98,
		87.31
	]
];
var MELODY = [
	[
		523.25,
		587.33,
		659.25,
		587.33
	],
	[
		493.88,
		440,
		392,
		440
	],
	[
		523.25,
		659.25,
		783.99,
		659.25
	],
	[
		554.37,
		523.25,
		493.88,
		440
	]
];
var WHITES$1 = [
	0,
	2,
	4,
	5,
	7,
	9,
	11
];
var BLACKS$1 = [
	1,
	3,
	6,
	8,
	10
];
function ensure() {
	if (ctx) return;
	const AudioCtx = window.AudioContext || window.webkitAudioContext;
	if (!AudioCtx) return;
	ctx = new AudioCtx({ latencyHint: "interactive" });
	master = ctx.createGain();
	master.gain.value = .9;
	sfx = ctx.createGain();
	music = ctx.createGain();
	music.gain.value = 1e-4;
	sfx.connect(master);
	music.connect(master);
	master.connect(ctx.destination);
	noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * .35), ctx.sampleRate);
	const data = noiseBuf.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}
function unlockAudio() {
	if (typeof window === "undefined") return;
	ensure();
	if (ctx?.state === "suspended") ctx.resume();
	if (loungeWanted) startLounge();
}
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible" && ctx?.state === "suspended") ctx.resume();
});
function setLounge(on) {
	loungeWanted = on;
	if (!on) stopLounge();
	else if (ctx && ctx.state === "running") startLounge();
}
function startLounge() {
	if (!ctx || !music || loungeRunning) return;
	loungeRunning = true;
	nextNote = ctx.currentTime + .08;
	music.gain.cancelScheduledValues(ctx.currentTime);
	music.gain.setTargetAtTime(.42, ctx.currentTime, .4);
	if (!loungeTimer) loungeTimer = window.setInterval(loungeTick, 90);
}
function stopLounge() {
	loungeRunning = false;
	loungeGen += 1;
	if (loungeTimer) {
		window.clearInterval(loungeTimer);
		loungeTimer = 0;
	}
	if (ctx && music) {
		music.gain.cancelScheduledValues(ctx.currentTime);
		music.gain.setTargetAtTime(1e-4, ctx.currentTime, .08);
	}
}
function loungeTick() {
	if (!loungeRunning || !ctx || ctx.state !== "running") return;
	if (nextNote < ctx.currentTime) nextNote = ctx.currentTime + .05;
	while (nextNote < ctx.currentTime + .24) {
		scheduleLounge(nextNote);
		nextNote += QUARTER;
	}
}
function pitchKey(freq) {
	const pc = (Math.round(12 * Math.log2(freq / 440) + 69) % 12 + 12) % 12;
	const white = WHITES$1.indexOf(pc);
	if (white >= 0) return white;
	const black = BLACKS$1.indexOf(pc);
	return 7 + (black < 0 ? 0 : black);
}
function showKeys(when, keys) {
	if (!ctx || typeof window === "undefined") return;
	const gen = loungeGen;
	const delay = Math.max(0, (when - ctx.currentTime) * 1e3);
	window.setTimeout(() => {
		if (gen !== loungeGen) return;
		window.dispatchEvent(new CustomEvent("gilt-piano", { detail: { keys } }));
	}, delay);
}
function pianoNote(freq, when, peak) {
	toneAt(music, freq, when, 1.25, "sine", peak);
	toneAt(music, freq * 2, when, .72, "sine", peak * .22);
	toneAt(music, freq * 1.002, when, 1.05, "triangle", peak * .08);
}
function scheduleLounge(when) {
	const bar = Math.floor(beat / 4) % 4;
	const pulse = beat % 4;
	const walk = WALK[bar]?.[pulse] ?? 65.41;
	const chord = CHORDS[bar]?.notes ?? [];
	const lit = [pitchKey(walk)];
	toneAt(music, walk, when, .78, "sine", .05);
	if (pulse === 0 || pulse === 2) {
		for (const note of chord) {
			pianoNote(note, when, .022);
			lit.push(pitchKey(note));
		}
		noiseHat(when);
	} else {
		const melody = MELODY[bar]?.[pulse];
		if (melody) {
			pianoNote(melody, when, .018);
			lit.push(pitchKey(melody));
		}
		noiseHat(when + .08);
	}
	showKeys(when, lit);
	beat += 1;
}
function toneAt(bus, freq, when, dur, type, peak) {
	if (!ctx || !bus || peak <= 0) return;
	const osc = ctx.createOscillator();
	const amp = ctx.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, when);
	amp.gain.setValueAtTime(1e-4, when);
	amp.gain.exponentialRampToValueAtTime(Math.max(peak, 2e-4), when + .02);
	amp.gain.exponentialRampToValueAtTime(1e-4, when + dur);
	osc.connect(amp);
	amp.connect(bus);
	osc.start(when);
	osc.stop(when + dur + .03);
	osc.onended = () => {
		osc.disconnect();
		amp.disconnect();
	};
}
function slide(from, to, dur, peak) {
	if (!ctx || !sfx) return;
	const now = ctx.currentTime;
	const osc = ctx.createOscillator();
	const amp = ctx.createGain();
	osc.type = "sine";
	osc.frequency.setValueAtTime(from, now);
	osc.frequency.exponentialRampToValueAtTime(Math.max(to, 40), now + dur);
	amp.gain.setValueAtTime(1e-4, now);
	amp.gain.exponentialRampToValueAtTime(peak, now + .03);
	amp.gain.exponentialRampToValueAtTime(1e-4, now + dur);
	osc.connect(amp);
	amp.connect(sfx);
	osc.start(now);
	osc.stop(now + dur + .03);
	osc.onended = () => {
		osc.disconnect();
		amp.disconnect();
	};
}
function noiseHit(when, dur, peak, freq, q) {
	if (!ctx || !sfx || !noiseBuf) return;
	const src = ctx.createBufferSource();
	src.buffer = noiseBuf;
	const filter = ctx.createBiquadFilter();
	filter.type = "bandpass";
	filter.frequency.setValueAtTime(freq, when);
	filter.Q.value = q;
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(peak, when);
	amp.gain.exponentialRampToValueAtTime(1e-4, when + dur);
	src.connect(filter);
	filter.connect(amp);
	amp.connect(sfx);
	src.start(when);
	src.stop(when + dur + .02);
	src.onended = () => {
		src.disconnect();
		filter.disconnect();
		amp.disconnect();
	};
}
function noiseHat(when) {
	noiseHit(when, .04, .012, 6400, .7);
}
function sweep(from, to, dur, peak) {
	if (!ctx || !sfx) return;
	const now = ctx.currentTime;
	const osc = ctx.createOscillator();
	const amp = ctx.createGain();
	osc.type = "sawtooth";
	osc.frequency.setValueAtTime(from, now);
	osc.frequency.exponentialRampToValueAtTime(to, now + dur);
	amp.gain.setValueAtTime(1e-4, now);
	amp.gain.exponentialRampToValueAtTime(peak, now + .04);
	amp.gain.exponentialRampToValueAtTime(1e-4, now + dur);
	osc.connect(amp);
	amp.connect(sfx);
	osc.start(now);
	osc.stop(now + dur + .03);
	osc.onended = () => {
		osc.disconnect();
		amp.disconnect();
	};
}
function playCue(cue, enabled) {
	if (!enabled) return;
	unlockAudio();
	if (!ctx || !sfx) return;
	const now = ctx.currentTime;
	const wobble = .94 + Math.random() * .12;
	if (cue === "chip") {
		noiseHit(now, .05, .07, 1680 * wobble, 3);
		toneAt(sfx, 740 * wobble, now, .08, "triangle", .045);
		toneAt(sfx, 1480 * wobble, now + .02, .06, "sine", .02);
	}
	if (cue === "card") {
		noiseHit(now, .045, .05, 980 * wobble, 1.4);
		toneAt(sfx, 190, now, .07, "sine", .03);
	}
	if (cue === "dice") {
		noiseHit(now, .07, .08, 420, .8);
		noiseHit(now, .04, .05, 1800 * wobble, 2);
		noiseHit(now + .09, .08, .07, 360, .7);
		noiseHit(now + .1, .04, .04, 1500, 2);
	}
	if (cue === "spin") {
		sweep(120, 540, .42, .02);
		for (let i = 0; i < 7; i++) toneAt(sfx, 880 + i * 30, now + i * .07, .04, "square", .012);
	}
	if (cue === "win") {
		toneAt(sfx, 196, now, .28, "sine", .04);
		toneAt(sfx, 523, now, .16, "triangle", .05);
		toneAt(sfx, 659, now + .11, .16, "triangle", .05);
		toneAt(sfx, 784, now + .22, .22, "triangle", .055);
		toneAt(sfx, 1046, now + .34, .28, "sine", .04);
		toneAt(sfx, 784, now + .46, .18, "triangle", .02);
	}
	if (cue === "lose") slide(220, 92, .32, .04);
}
var CLUBS = {
	soccer: {
		ticks: 90,
		home: {
			name: "Lantern",
			abbr: "LAN",
			attack: 1.22,
			defense: .94
		},
		away: {
			name: "Harbor",
			abbr: "HAR",
			attack: 1.04,
			defense: 1.06
		}
	},
	baseball: {
		ticks: 72,
		home: {
			name: "Switchback",
			abbr: "SWB",
			attack: 1.12,
			defense: .96
		},
		away: {
			name: "Red Line",
			abbr: "RED",
			attack: .98,
			defense: 1.04
		}
	},
	football: {
		ticks: 56,
		home: {
			name: "Iron Mile",
			abbr: "IRM",
			attack: 1.16,
			defense: .92
		},
		away: {
			name: "South Cut",
			abbr: "SOU",
			attack: 1,
			defense: 1.06
		}
	}
};
function freshMatch(sport, seed = Math.floor(Math.random() * 1e9)) {
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
		ballY: .15,
		inning: 1,
		half: "top",
		outs: 0,
		bases: 0,
		yard: 25,
		down: 1,
		toGo: 10,
		log: ["The card is open. Prices lock when you bet."],
		seed: seed || 1
	};
}
function randOf(seed) {
	let a = seed >>> 0;
	return () => {
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function pushLog(log, line) {
	return [line, ...log].slice(0, 5);
}
function other(side) {
	return side === "home" ? "away" : "home";
}
function stepMatch(match) {
	if (match.status === "final") return match;
	const rand = randOf(match.seed + match.tick * 997 + 17);
	const clubs = CLUBS[match.sport];
	if (match.sport === "soccer") return stepSoccer(match, clubs.home, clubs.away, rand);
	if (match.sport === "baseball") return stepBaseball(match, clubs.home, clubs.away, rand);
	return stepFootball(match, clubs.home, clubs.away, rand);
}
function stepSoccer(match, home, away, rand) {
	const side = match.possession;
	const club = side === "home" ? home : away;
	const foe = side === "home" ? away : home;
	const dir = side === "home" ? 1 : -1;
	let ballZ = match.ballZ + dir * (.07 + rand() * .14);
	let ballX = Math.max(-.92, Math.min(.92, match.ballX + (rand() - .5) * .28));
	let ballY = .15 + rand() * .2;
	let homeScore = match.homeScore;
	let awayScore = match.awayScore;
	let possession = side;
	let log = match.log;
	const heat = club.attack / foe.defense;
	if (ballZ * dir > .62 && rand() < .42 * heat) {
		ballY = .55;
		if (rand() < .22 * heat) {
			if (side === "home") homeScore += 1;
			else awayScore += 1;
			log = pushLog(log, `${club.name} scores.`);
			ballX = 0;
			ballZ = 0;
			ballY = .15;
			possession = other(side);
		} else {
			log = pushLog(log, `${foe.name} keeps it out.`);
			possession = other(side);
			ballZ *= .35;
		}
	} else if (rand() < .14) {
		possession = other(side);
		log = pushLog(log, `${CLUBS.soccer[possession].name} takes the ball.`);
	}
	if (ballZ > 1 || ballZ < -1) {
		ballZ = Math.sign(ballZ) * .72;
		possession = other(possession);
	}
	const tick = match.tick + 1;
	return {
		...match,
		tick,
		homeScore,
		awayScore,
		possession,
		ballX,
		ballZ,
		ballY,
		log
	};
}
function advanceRunners(bases, bags) {
	const on = [
		true,
		(bases & 1) !== 0,
		(bases & 2) !== 0,
		(bases & 4) !== 0
	];
	const next = [
		false,
		false,
		false,
		false
	];
	let scored = 0;
	for (let i = 3; i >= 0; i -= 1) {
		if (!on[i]) continue;
		const dest = i + bags;
		if (dest >= 4) scored += 1;
		else next[dest] = true;
	}
	return {
		bases: (next[1] ? 1 : 0) | (next[2] ? 2 : 0) | (next[3] ? 4 : 0),
		scored
	};
}
function stepBaseball(match, home, away, rand) {
	if (match.inning > 9 && match.homeScore !== match.awayScore) return {
		...match,
		status: "final",
		log: pushLog(match.log, "Final.")
	};
	if (match.inning > 11) return {
		...match,
		status: "final",
		log: pushLog(match.log, "Final.")
	};
	const batting = match.half === "top" ? "away" : "home";
	const bat = batting === "home" ? home : away;
	const pit = batting === "home" ? away : home;
	const roll = rand();
	const outRate = Math.min(.78, .64 * (pit.defense / bat.attack));
	let outs = match.outs;
	let bases = match.bases;
	let homeScore = match.homeScore;
	let awayScore = match.awayScore;
	let log = match.log;
	let ballX = (rand() - .5) * .8;
	let ballZ = .2 + rand() * .5;
	let ballY = .4;
	if (roll < outRate) {
		outs += 1;
		log = pushLog(log, `${pit.name} gets the out.`);
		ballY = .8;
	} else if (roll < outRate + .2) {
		const moved = advanceRunners(bases, 1);
		bases = moved.bases;
		if (batting === "home") homeScore += moved.scored;
		else awayScore += moved.scored;
		log = pushLog(log, `${bat.name} singles.`);
	} else if (roll < outRate + .28) {
		const moved = advanceRunners(bases, 2);
		bases = moved.bases;
		if (batting === "home") homeScore += moved.scored;
		else awayScore += moved.scored;
		log = pushLog(log, `${bat.name} doubles.`);
		ballZ = -.2;
		ballY = .9;
	} else {
		const moved = advanceRunners(bases, 4);
		bases = 0;
		if (batting === "home") homeScore += moved.scored;
		else awayScore += moved.scored;
		log = pushLog(log, `${bat.name} goes deep.`);
		ballY = 1.4;
		ballZ = -.8;
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
		log
	};
}
function scoreSide(match, side, points) {
	return side === "home" ? {
		homeScore: match.homeScore + points,
		awayScore: match.awayScore
	} : {
		homeScore: match.homeScore,
		awayScore: match.awayScore + points
	};
}
function stepFootball(match, home, away, rand) {
	const side = match.possession;
	const club = side === "home" ? home : away;
	const foe = side === "home" ? away : home;
	const dir = side === "home" ? 1 : -1;
	let yard = match.yard;
	let down = match.down;
	let toGo = match.toGo;
	let possession = side;
	let scores = {
		homeScore: match.homeScore,
		awayScore: match.awayScore
	};
	let log = match.log;
	const gain = Math.round((rand() * 18 - 2) * (.72 + .5 * (club.attack / foe.defense)));
	if (rand() < .045) {
		possession = other(side);
		yard = Math.max(1, Math.min(99, yard));
		down = 1;
		toGo = 10;
		log = pushLog(log, `${foe.name} takes it away.`);
	} else {
		yard += gain * dir;
		if (side === "home" && yard >= 100 || side === "away" && yard <= 0) {
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
				if ((side === "home" ? yard >= 62 : yard <= 38) && rand() < .72) {
					scores = scoreSide({
						...match,
						...scores
					}, side, 3);
					log = pushLog(log, `${club.name} kicks it through.`);
					possession = other(side);
					yard = side === "home" ? 70 : 30;
				} else {
					possession = other(side);
					log = pushLog(log, `${foe.name} takes over.`);
				}
				down = 1;
				toGo = 10;
			} else log = pushLog(log, `${club.name} gains ${gain}.`);
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
		ballX: (rand() - .5) * .35,
		ballZ: (Math.max(1, Math.min(99, yard)) - 50) / 50,
		ballY: .25,
		log
	};
}
function poisson(k, lambda) {
	let p = Math.exp(-lambda);
	for (let i = 1; i <= k; i += 1) p *= lambda / i;
	return p;
}
function normCdf(x) {
	const sign = x < 0 ? -1 : 1;
	const ax = Math.abs(x);
	const t = 1 / (1 + .2316419 * ax);
	return .5 + sign * (.5 - .3989423 * Math.exp(-ax * ax / 2) * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))));
}
function fromProb(p) {
	const q = Math.min(.93, Math.max(.04, p * 1.05));
	if (q >= .5) return Math.round(-100 * q / (1 - q));
	return Math.round(100 * (1 - q) / q);
}
function soccerMass(homeLeft, awayLeft, homeNow, awayNow) {
	let home = 0;
	let draw = 0;
	let away = 0;
	let over = 0;
	const totalLine = 2.5;
	for (let i = 0; i <= 8; i += 1) for (let j = 0; j <= 8; j += 1) {
		const p = poisson(i, homeLeft) * poisson(j, awayLeft);
		const h = homeNow + i;
		const a = awayNow + j;
		if (h > a) home += p;
		else if (h === a) draw += p;
		else away += p;
		if (h + a > totalLine) over += p;
	}
	return {
		home,
		draw,
		away,
		over
	};
}
function offers(match) {
	const clubs = CLUBS[match.sport];
	const remain = Math.max(.04, 1 - match.tick / match.ticks);
	const home = clubs.home;
	const away = clubs.away;
	if (match.sport === "soccer") {
		const mass = soccerMass(1.05 * remain * (home.attack / away.defense), .98 * remain * (away.attack / home.defense), match.homeScore, match.awayScore);
		const spread = home.attack >= away.attack ? -.5 : .5;
		return [
			{
				market: "ml",
				side: "home",
				odds: fromProb(mass.home),
				line: null,
				label: `${home.abbr} ${american(fromProb(mass.home))}`
			},
			{
				market: "draw",
				side: "draw",
				odds: fromProb(mass.draw),
				line: null,
				label: `Draw ${american(fromProb(mass.draw))}`
			},
			{
				market: "ml",
				side: "away",
				odds: fromProb(mass.away),
				line: null,
				label: `${away.abbr} ${american(fromProb(mass.away))}`
			},
			{
				market: "spread",
				side: "home",
				odds: fromProb(mass.home > mass.away ? .56 : .48),
				line: spread,
				label: `${home.abbr} ${signed(spread)}`
			},
			{
				market: "spread",
				side: "away",
				odds: fromProb(mass.home > mass.away ? .48 : .56),
				line: -spread,
				label: `${away.abbr} ${signed(-spread)}`
			},
			{
				market: "total",
				side: "over",
				odds: fromProb(mass.over),
				line: 2.5,
				label: `Over 2.5 ${american(fromProb(mass.over))}`
			},
			{
				market: "total",
				side: "under",
				odds: fromProb(1 - mass.over),
				line: 2.5,
				label: `Under 2.5 ${american(fromProb(1 - mass.over))}`
			}
		];
	}
	const expHome = (match.sport === "baseball" ? 4.3 : 18) * remain * (home.attack / away.defense);
	const expAway = (match.sport === "baseball" ? 4 : 15.5) * remain * (away.attack / home.defense);
	const meanMargin = match.homeScore - match.awayScore + expHome - expAway;
	const sd = (match.sport === "baseball" ? 3.1 : 10) * Math.sqrt(remain);
	const pHome = 1 - normCdf((.5 - meanMargin) / sd);
	const spread = match.sport === "baseball" ? meanMargin >= 0 ? -1.5 : 1.5 : Math.max(-17, Math.min(17, Math.round(-meanMargin * 2) / 2)) || -3.5;
	const pCover = 1 - normCdf((-spread - meanMargin) / sd);
	const total = match.sport === "baseball" ? 8.5 : 33.5;
	const meanSum = match.homeScore + match.awayScore + expHome + expAway;
	const pOver = 1 - normCdf((total + .5 - meanSum) / (sd * 1.3));
	return [
		{
			market: "ml",
			side: "home",
			odds: fromProb(pHome),
			line: null,
			label: `${home.abbr} ${american(fromProb(pHome))}`
		},
		{
			market: "ml",
			side: "away",
			odds: fromProb(1 - pHome),
			line: null,
			label: `${away.abbr} ${american(fromProb(1 - pHome))}`
		},
		{
			market: "spread",
			side: "home",
			odds: fromProb(pCover),
			line: spread,
			label: `${home.abbr} ${signed(spread)} ${american(fromProb(pCover))}`
		},
		{
			market: "spread",
			side: "away",
			odds: fromProb(1 - pCover),
			line: -spread,
			label: `${away.abbr} ${signed(-spread)} ${american(fromProb(1 - pCover))}`
		},
		{
			market: "total",
			side: "over",
			odds: fromProb(pOver),
			line: total,
			label: `Over ${total} ${american(fromProb(pOver))}`
		},
		{
			market: "total",
			side: "under",
			odds: fromProb(1 - pOver),
			line: total,
			label: `Under ${total} ${american(fromProb(1 - pOver))}`
		}
	];
}
function gradeAgent(bet, match) {
	if (match.status !== "final" || bet.sport !== match.sport) return "open";
	const home = match.homeScore;
	const away = match.awayScore;
	if (bet.market === "draw") return home === away ? "win" : "loss";
	if (bet.market === "ml") {
		if (home === away) return "push";
		return bet.side === "home" === home > away ? "win" : "loss";
	}
	if (bet.market === "spread") {
		if (bet.line === null) return "open";
		const cover = bet.side === "home" ? home + bet.line - away : away + bet.line - home;
		if (Math.abs(cover) < .001) return "push";
		return cover > 0 ? "win" : "loss";
	}
	if (bet.line === null) return "open";
	const sum = home + away;
	if (sum === bet.line) return "push";
	if (bet.side === "over") return sum > bet.line ? "win" : "loss";
	return sum < bet.line ? "win" : "loss";
}
function agentPayout(stake, odds, grade) {
	if (grade === "push") return stake;
	if (grade !== "win") return 0;
	return stake + (odds > 0 ? stake * odds / 100 : stake * 100 / Math.abs(odds));
}
function clockLabel(match) {
	if (match.status === "card") return "Card";
	if (match.status === "final") return "Final";
	if (match.sport === "soccer") return `${match.tick}'`;
	if (match.sport === "baseball") return `${match.half === "top" ? "Top" : "Bot"} ${match.inning}`;
	return `Q${Math.min(4, Math.floor(match.tick / 14) + 1)} · ${match.down} and ${match.toGo}`;
}
function betsOpen(match) {
	return match.status === "card" || match.status === "live" && match.tick / match.ticks < .82;
}
function stagePose(match) {
	if (match.sport === "baseball") return baseballPose(match);
	if (match.sport === "football") return footballPose(match);
	return soccerPose(match);
}
function soccerPose(match) {
	const homeForm = [
		[0, -5.2],
		[-2.1, -3.3],
		[0, -3.1],
		[2.1, -3.3],
		[-3.1, -1],
		[-1, -.6],
		[1.1, -.4],
		[3, -.9],
		[-2, 1.3],
		[.3, 1.7],
		[2.1, 1.1]
	];
	const shift = match.ballZ * 1.4;
	const home = homeForm.map(([x, z]) => [
		x,
		.35,
		z + shift * .35
	]);
	const away = homeForm.map(([x, z]) => [
		-x,
		.35,
		-z + shift * .35
	]);
	return {
		ball: [
			match.ballX * 3.6,
			.22 + match.ballY,
			match.ballZ * 5.2
		],
		home,
		away
	};
}
function baseballPose(match) {
	const defense = [
		[
			.35,
			.35,
			4.3
		],
		[
			0,
			.4,
			2.3
		],
		[
			2.3,
			.35,
			2.1
		],
		[
			.2,
			.35,
			.1
		],
		[
			-.9,
			.35,
			.5
		],
		[
			-2.3,
			.35,
			2.1
		],
		[
			-3.2,
			.35,
			-1.6
		],
		[
			0,
			.35,
			-3.4
		],
		[
			3.2,
			.35,
			-1.6
		]
	];
	const batter = [
		match.half === "top" ? -.55 : .55,
		.35,
		4.5
	];
	const bags = [
		[
			2.2,
			.35,
			2.15
		],
		[
			0,
			.35,
			-.05
		],
		[
			-2.2,
			.35,
			2.15
		]
	];
	const offense = [
		batter,
		[
			3.6,
			.35,
			4.6
		],
		[
			3.9,
			.35,
			5
		],
		[
			-3.6,
			.35,
			4.6
		],
		[
			-3.9,
			.35,
			5
		]
	];
	[
		1,
		2,
		4
	].forEach((bit, index) => {
		if ((match.bases & bit) !== 0) {
			const bag = bags[index];
			if (bag) offense[index + 1] = bag;
		}
	});
	while (offense.length < 11) offense.push([
		6,
		-2,
		0
	]);
	const field = match.half === "top" ? defense : defense.map((spot) => [
		-spot[0],
		spot[1],
		spot[2]
	]);
	const bat = match.half === "top" ? offense : offense.map((spot) => [
		-spot[0],
		spot[1],
		spot[2]
	]);
	const home = match.half === "bot" ? bat : field;
	const away = match.half === "top" ? bat : field;
	return {
		ball: [
			match.ballX * 3,
			.35 + match.ballY,
			3.2 - match.ballZ * 4
		],
		home: home.slice(0, 11),
		away: away.slice(0, 11)
	};
}
function footballPose(match) {
	const z = match.ballZ * 5.4;
	const dir = match.possession === "home" ? 1 : -1;
	const home = [];
	const away = [];
	for (let i = 0; i < 11; i += 1) {
		const x = -3.2 + i % 6 * 1.25;
		const row = i < 6 ? 0 : .7;
		home.push([
			x,
			.35,
			z - dir * (.45 + row)
		]);
		away.push([
			x,
			.35,
			z + dir * (.45 + row)
		]);
	}
	return {
		ball: [
			match.ballX,
			.28,
			z
		],
		home,
		away
	};
}
var KEY = "gilt-house-v1";
var OPENING_BANK = 2500;
var EMPTY_PIT = {
	station: "",
	streak: 0,
	correct: 0,
	asked: 0,
	cleared: []
};
function isTicket(value) {
	if (!value || typeof value !== "object") return false;
	const row = value;
	return typeof row.id === "string" && typeof row.eventId === "string" && typeof row.label === "string" && typeof row.stake === "number" && typeof row.odds === "number" && (row.market === "ml" || row.market === "spread" || row.market === "total") && (row.side === "home" || row.side === "away" || row.side === "over" || row.side === "under");
}
function readPit(value) {
	if (!value || typeof value !== "object") return EMPTY_PIT;
	const row = value;
	return {
		station: typeof row.station === "string" ? row.station : "",
		streak: typeof row.streak === "number" ? row.streak : 0,
		correct: typeof row.correct === "number" ? row.correct : 0,
		asked: typeof row.asked === "number" ? row.asked : 0,
		cleared: Array.isArray(row.cleared) ? row.cleared.filter((id) => typeof id === "string") : []
	};
}
function readAgent(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
	if (row.sport !== "soccer" && row.sport !== "baseball" && row.sport !== "football") return null;
	if (row.status !== "card" && row.status !== "live" && row.status !== "final") return null;
	return {
		...freshMatch(row.sport, typeof row.seed === "number" ? row.seed : 1),
		...row,
		log: Array.isArray(row.log) ? row.log.filter((line) => typeof line === "string").slice(0, 5) : [],
		tick: typeof row.tick === "number" ? row.tick : 0,
		homeScore: typeof row.homeScore === "number" ? row.homeScore : 0,
		awayScore: typeof row.awayScore === "number" ? row.awayScore : 0
	};
}
function isAgentBet(value) {
	if (!value || typeof value !== "object") return false;
	const row = value;
	return (row.sport === "soccer" || row.sport === "baseball" || row.sport === "football") && typeof row.id === "string" && typeof row.label === "string" && typeof row.stake === "number" && typeof row.odds === "number";
}
function readSaved() {
	const fallback = {
		version: 1,
		bank: OPENING_BANK,
		sound: true,
		ledger: [],
		comps: 0,
		tickets: [],
		pit: EMPTY_PIT,
		agent: null,
		agentBets: []
	};
	if (typeof window === "undefined") return fallback;
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw);
		if (parsed.version !== 1 || typeof parsed.bank !== "number") return fallback;
		return {
			version: 1,
			bank: Math.max(0, Math.round(parsed.bank)),
			sound: parsed.sound !== false,
			ledger: Array.isArray(parsed.ledger) ? parsed.ledger.slice(0, 18) : [],
			comps: typeof parsed.comps === "number" ? parsed.comps : 0,
			tickets: Array.isArray(parsed.tickets) ? parsed.tickets.filter(isTicket).slice(0, 24) : [],
			pit: readPit(parsed.pit),
			agent: readAgent(parsed.agent),
			agentBets: Array.isArray(parsed.agentBets) ? parsed.agentBets.filter(isAgentBet).slice(0, 16) : []
		};
	} catch {
		return fallback;
	}
}
function writeSaved(saved) {
	localStorage.setItem(KEY, JSON.stringify(saved));
}
function persist(state) {
	writeSaved({
		version: 1,
		bank: state.bank,
		sound: state.sound,
		ledger: state.ledger,
		comps: state.comps,
		tickets: state.tickets,
		pit: state.pit,
		agent: state.agent,
		agentBets: state.agentBets
	});
}
var useCasino = create((set, get) => ({
	booted: false,
	bank: OPENING_BANK,
	sound: true,
	view: "floor",
	ledger: [],
	comps: 0,
	tickets: [],
	pit: EMPTY_PIT,
	agent: null,
	agentBets: [],
	boot: () => {
		if (get().booted) return;
		const saved = readSaved();
		set({
			booted: true,
			bank: saved.bank,
			sound: saved.sound,
			ledger: saved.ledger,
			comps: saved.comps,
			tickets: saved.tickets,
			pit: saved.pit,
			agent: saved.agent,
			agentBets: saved.agentBets
		});
	},
	setView: (view) => set({ view }),
	toggleSound: () => {
		set({ sound: !get().sound });
		persist(get());
	},
	settle: (net, game, note) => {
		const s = get();
		const delta = Math.round(net);
		set({
			bank: Math.max(0, s.bank + delta),
			ledger: [{
				id: crypto.randomUUID(),
				game,
				delta,
				note,
				at: Date.now()
			}, ...s.ledger].slice(0, 18)
		});
		persist(get());
	},
	marker: () => {
		const s = get();
		if (s.bank >= 50) return;
		const delta = 1e3;
		const bank = s.bank + delta;
		const comps = s.comps + 1;
		set({
			bank,
			ledger: [{
				id: crypto.randomUUID(),
				game: "house",
				delta,
				note: "House marker",
				at: Date.now()
			}, ...s.ledger].slice(0, 18),
			comps
		});
		persist(get());
	},
	resetPurse: () => {
		const s = get();
		const bank = OPENING_BANK;
		set({
			bank,
			ledger: [{
				id: crypto.randomUUID(),
				game: "house",
				delta: bank - s.bank,
				note: "Purse reset",
				at: Date.now()
			}, ...s.ledger].slice(0, 18),
			tickets: [],
			agent: null,
			agentBets: []
		});
		persist(get());
	},
	placeTicket: (draft) => {
		const s = get();
		const stake = Math.round(draft.stake);
		if (stake < 1 || stake > s.bank || s.tickets.length >= 24) return false;
		const ticket = {
			...draft,
			stake,
			id: crypto.randomUUID(),
			at: Date.now()
		};
		set({
			bank: s.bank - stake,
			ledger: [{
				id: crypto.randomUUID(),
				game: "sports",
				delta: -stake,
				note: ticket.label,
				at: ticket.at
			}, ...s.ledger].slice(0, 18),
			tickets: [ticket, ...s.tickets].slice(0, 24)
		});
		persist(get());
		return true;
	},
	gradeTickets: (rows) => {
		if (rows.length === 0) return;
		const s = get();
		const drop = new Set(rows.map((row) => row.id));
		let bank = s.bank;
		let ledger = s.ledger;
		for (const row of rows) {
			if (!s.tickets.some((ticket) => ticket.id === row.id)) continue;
			const delta = Math.round(row.net);
			bank = Math.max(0, bank + delta);
			ledger = [{
				id: crypto.randomUUID(),
				game: "sports",
				delta,
				note: row.note,
				at: Date.now()
			}, ...ledger];
		}
		set({
			bank,
			ledger: ledger.slice(0, 18),
			tickets: s.tickets.filter((ticket) => !drop.has(ticket.id))
		});
		persist(get());
	},
	focusStation: (station) => {
		const s = get();
		if (s.pit.station === station) return;
		set({ pit: {
			...s.pit,
			station,
			streak: 0
		} });
		persist(get());
	},
	markPit: (station, correct, need) => {
		const s = get();
		const same = s.pit.station === station;
		const streak = correct ? same ? s.pit.streak + 1 : 1 : 0;
		const cleared = s.pit.cleared.includes(station);
		const earned = correct && streak >= need && !cleared;
		const bank = s.bank + (earned ? 100 : 0);
		const comps = s.comps + (earned ? 1 : 0);
		const entry = {
			id: crypto.randomUUID(),
			game: "pit",
			delta: 100,
			note: "Pit comp",
			at: Date.now()
		};
		set({
			bank,
			comps,
			pit: {
				station,
				streak: earned ? 0 : streak,
				correct: s.pit.correct + (correct ? 1 : 0),
				asked: s.pit.asked + 1,
				cleared: earned ? [...s.pit.cleared, station] : s.pit.cleared
			},
			ledger: earned ? [entry, ...s.ledger].slice(0, 18) : s.ledger
		});
		persist(get());
	},
	openAgent: (sport) => {
		const s = get();
		if (s.agent?.status === "live") return false;
		const refund = s.agentBets.reduce((sum, bet) => sum + bet.stake, 0);
		set({
			bank: s.bank + refund,
			ledger: refund > 0 ? [{
				id: crypto.randomUUID(),
				game: "agents",
				delta: refund,
				note: "Agent card returned",
				at: Date.now()
			}, ...s.ledger].slice(0, 18) : s.ledger,
			agent: freshMatch(sport),
			agentBets: []
		});
		persist(get());
		return true;
	},
	kickAgent: () => {
		const s = get();
		if (!s.agent || s.agent.status !== "card") return;
		set({ agent: {
			...s.agent,
			status: "live",
			log: ["They kick it off.", ...s.agent.log].slice(0, 5)
		} });
		persist(get());
	},
	advanceAgent: () => {
		const s = get();
		if (!s.agent || s.agent.status !== "live") return;
		let next = stepMatch(s.agent);
		if (next.status !== "final" && next.tick >= next.ticks) next = {
			...next,
			status: "final",
			log: ["Final.", ...next.log].slice(0, 5)
		};
		if (next.status !== "final") {
			set({ agent: next });
			persist(get());
			return;
		}
		let bank = s.bank;
		let ledger = s.ledger;
		for (const bet of s.agentBets) {
			const grade = gradeAgent(bet, next);
			const delta = Math.round(agentPayout(bet.stake, bet.odds, grade));
			const word = grade === "win" ? "wins" : grade === "push" ? "pushes" : "loses";
			const entry = {
				id: crypto.randomUUID(),
				game: "agents",
				delta,
				note: `${bet.label} ${word}`,
				at: Date.now()
			};
			bank = Math.max(0, bank + delta);
			ledger = [entry, ...ledger];
		}
		set({
			agent: next,
			bank,
			ledger: ledger.slice(0, 18),
			agentBets: []
		});
		persist(get());
	},
	placeAgentBet: (draft) => {
		const s = get();
		const stake = Math.round(draft.stake);
		if (!s.agent || stake < 1 || stake > s.bank || s.agentBets.length >= 16) return false;
		if (s.agent.status === "final" || s.agent.status === "live" && s.agent.tick / s.agent.ticks >= .82) return false;
		const bet = {
			...draft,
			stake,
			id: crypto.randomUUID()
		};
		const entry = {
			id: crypto.randomUUID(),
			game: "agents",
			delta: -stake,
			note: bet.label,
			at: Date.now()
		};
		set({
			bank: s.bank - stake,
			ledger: [entry, ...s.ledger].slice(0, 18),
			agentBets: [bet, ...s.agentBets]
		});
		persist(get());
		return true;
	}
}));
function chips(n) {
	return Math.round(n).toLocaleString("en-US");
}
var GOLD = 15123306;
var OX = 9184310;
var CREAM = 16248278;
var INK = 1840401;
function Arena({ match, api }) {
	const canvasRef = (0, import_react.useRef)(null);
	const pose = (0, import_react.useRef)(stagePose(match));
	pose.current = stagePose(match);
	const rendererRef = (0, import_react.useRef)(null);
	(0, import_react.useImperativeHandle)(api, () => ({ enterVR: () => {
		const renderer = rendererRef.current;
		const xr = typeof navigator !== "undefined" ? navigator.xr : void 0;
		if (!renderer || !xr) return Promise.resolve("none");
		renderer.xr.enabled = true;
		return xr.requestSession("immersive-vr").then((session) => renderer.xr.setSession(session).then(() => "ok")).catch(() => "none");
	} }));
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		let dead = false;
		const look = {
			yaw: .55,
			pitch: .48,
			drag: false,
			x: 0,
			y: 0
		};
		const clean = [];
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const onDown = (event) => {
			look.drag = true;
			look.x = event.clientX;
			look.y = event.clientY;
			canvas.setPointerCapture(event.pointerId);
		};
		const onMove = (event) => {
			if (!look.drag) return;
			look.yaw += (event.clientX - look.x) * .008;
			look.pitch = Math.max(.18, Math.min(1.05, look.pitch + (event.clientY - look.y) * .005));
			look.x = event.clientX;
			look.y = event.clientY;
		};
		const onUp = () => {
			look.drag = false;
		};
		canvas.addEventListener("pointerdown", onDown);
		canvas.addEventListener("pointermove", onMove);
		canvas.addEventListener("pointerup", onUp);
		canvas.addEventListener("pointercancel", onUp);
		(async () => {
			const THREE = await import("../_libs/three.mjs").then((n) => n.t);
			if (dead || !canvasRef.current) return;
			let renderer;
			try {
				renderer = new THREE.WebGLRenderer({
					canvas,
					antialias: true,
					alpha: false
				});
			} catch {
				return;
			}
			renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
			renderer.setClearColor(1051658, 1);
			renderer.outputColorSpace = THREE.SRGBColorSpace;
			renderer.xr.enabled = true;
			rendererRef.current = renderer;
			const scene = new THREE.Scene();
			scene.fog = new THREE.Fog(1051658, 14, 32);
			const camera = new THREE.PerspectiveCamera(46, 1, .1, 50);
			scene.add(new THREE.HemisphereLight(16248278, 1708558, .7));
			const sun = new THREE.DirectionalLight(16773584, 1.15);
			sun.position.set(6, 10, 4);
			scene.add(sun);
			const geos = [];
			const mats = [];
			const add = (geo, mat) => {
				geos.push(geo);
				return new THREE.Mesh(geo, mat);
			};
			const keep = (mat) => {
				mats.push(mat);
				return mat;
			};
			const sport = match.sport;
			const chalk = keep(new THREE.MeshStandardMaterial({
				color: CREAM,
				roughness: .55
			}));
			const felt = keep(new THREE.MeshStandardMaterial({
				color: sport === "baseball" ? 1722930 : 1196599,
				roughness: .92
			}));
			const feltDark = keep(new THREE.MeshStandardMaterial({
				color: 799532,
				roughness: .95
			}));
			const inkMat = keep(new THREE.MeshStandardMaterial({
				color: INK,
				roughness: .8
			}));
			const standMat = keep(new THREE.MeshStandardMaterial({
				color: 2365460,
				roughness: .9
			}));
			const lampMat = keep(new THREE.MeshStandardMaterial({
				color: 16773576,
				emissive: 15123306,
				emissiveIntensity: .8
			}));
			const poleMat = keep(new THREE.MeshStandardMaterial({
				color: 3811874,
				metalness: .35,
				roughness: .45
			}));
			const netMat = keep(new THREE.MeshStandardMaterial({
				color: CREAM,
				transparent: true,
				opacity: .16,
				roughness: 1,
				side: THREE.DoubleSide
			}));
			const groundW = sport === "baseball" ? 14 : 8.4;
			const groundD = sport === "soccer" ? 13.2 : sport === "football" ? 13.4 : 14;
			const ground = add(new THREE.PlaneGeometry(groundW, groundD), felt);
			ground.rotation.x = -Math.PI / 2;
			scene.add(ground);
			if (sport === "soccer") for (let i = 0; i < 8; i += 1) {
				if (i % 2 === 0) continue;
				const stripe = add(new THREE.PlaneGeometry(7.2, 1.35), feltDark);
				stripe.rotation.x = -Math.PI / 2;
				stripe.position.set(0, .01, -5.2 + i * 1.5);
				scene.add(stripe);
			}
			const mark = (w, d, x, z) => {
				const mesh = add(new THREE.BoxGeometry(w, .025, d), chalk);
				mesh.position.set(x, .03, z);
				scene.add(mesh);
			};
			if (sport === "soccer") {
				mark(.07, 11.4, 0, 0);
				mark(7.2, .07, 0, 0);
				mark(7.2, .07, 0, 5.6);
				mark(7.2, .07, 0, -5.6);
				mark(.07, 11.4, -3.6, 0);
				mark(.07, 11.4, 3.6, 0);
				mark(3.2, .06, 0, 4.15);
				mark(3.2, .06, 0, -4.15);
				mark(.06, 2.9, -1.6, 4.15);
				mark(.06, 2.9, 1.6, 4.15);
				mark(.06, 2.9, -1.6, -4.15);
				mark(.06, 2.9, 1.6, -4.15);
				const ring = add(new THREE.RingGeometry(1.15, 1.24, 40), chalk);
				ring.rotation.x = -Math.PI / 2;
				ring.position.y = .03;
				scene.add(ring);
				const goal = (z) => {
					const post = (x) => {
						const mesh = add(new THREE.CylinderGeometry(.045, .045, 1.15, 8), chalk);
						mesh.position.set(x, .58, z);
						scene.add(mesh);
					};
					post(-1.25);
					post(1.25);
					const bar = add(new THREE.CylinderGeometry(.04, .04, 2.5, 8), chalk);
					bar.rotation.z = Math.PI / 2;
					bar.position.set(0, 1.15, z);
					scene.add(bar);
					const net = add(new THREE.PlaneGeometry(2.5, 1.15), netMat);
					net.position.set(0, .58, z + Math.sign(z) * .35);
					scene.add(net);
				};
				goal(5.6);
				goal(-5.6);
			} else if (sport === "football") {
				const zoneMat = keep(new THREE.MeshStandardMaterial({
					color: GOLD,
					roughness: .8
				}));
				const zoneAway = keep(new THREE.MeshStandardMaterial({
					color: OX,
					roughness: .8
				}));
				const zone = (z, mat) => {
					const mesh = add(new THREE.BoxGeometry(6.6, .03, 1.15), mat);
					mesh.position.set(0, .02, z);
					scene.add(mesh);
				};
				zone(5.9, zoneMat);
				zone(-5.9, zoneAway);
				for (let i = -5; i <= 5; i += 1) mark(6.4, .045, 0, i * 1.02);
				mark(.06, 11.2, -3.3, 0);
				mark(.06, 11.2, 3.3, 0);
				const uprights = (z) => {
					const stem = add(new THREE.CylinderGeometry(.05, .05, 1.5, 8), chalk);
					stem.position.set(0, .75, z);
					scene.add(stem);
					const bar = add(new THREE.CylinderGeometry(.04, .04, 2.2, 8), chalk);
					bar.rotation.z = Math.PI / 2;
					bar.position.set(0, 1.5, z);
					scene.add(bar);
					for (const x of [-1.1, 1.1]) {
						const post = add(new THREE.CylinderGeometry(.04, .04, 1.6, 8), chalk);
						post.position.set(x, 2.3, z);
						scene.add(post);
					}
				};
				uprights(6.45);
				uprights(-6.45);
			} else {
				mark(.07, 5.2, 0, 1.7);
				mark(5.2, .07, 0, 1.7);
				const dirt = add(new THREE.CircleGeometry(1.7, 28), keep(new THREE.MeshStandardMaterial({
					color: 7031346,
					roughness: 1
				})));
				dirt.rotation.x = -Math.PI / 2;
				dirt.position.set(0, .015, 2.2);
				scene.add(dirt);
				const mound = add(new THREE.CylinderGeometry(.38, .48, .08, 16), keep(new THREE.MeshStandardMaterial({
					color: 9069124,
					roughness: 1
				})));
				mound.position.set(0, .04, 2.25);
				scene.add(mound);
				for (const [x, z] of [
					[2.2, 2.15],
					[0, -.05],
					[-2.2, 2.15],
					[.15, 4.25]
				]) {
					const base = add(new THREE.BoxGeometry(.28, .04, .28), chalk);
					base.position.set(x, .04, z);
					scene.add(base);
				}
				const wallMat = keep(new THREE.MeshStandardMaterial({
					color: 1720116,
					roughness: .85
				}));
				for (let i = -4; i <= 4; i += 1) {
					const wall = add(new THREE.BoxGeometry(1.35, .85, .22), wallMat);
					wall.position.set(i * 1.2, .42, -5.1);
					scene.add(wall);
				}
			}
			const radius = sport === "baseball" ? 8.6 : 8.1;
			for (let i = 0; i < 16; i += 1) {
				const angle = i / 16 * Math.PI * 2;
				const box = add(new THREE.BoxGeometry(1.8, .55 + i % 3 * .28, .9), standMat);
				box.position.set(Math.sin(angle) * radius, .35 + i % 3 * .12, Math.cos(angle) * radius * (sport === "soccer" ? 1.15 : 1));
				box.lookAt(0, .4, 0);
				scene.add(box);
			}
			for (const [x, z] of [
				[-5.4, -6.4],
				[5.4, -6.4],
				[-5.4, 6.6],
				[5.4, 6.6]
			]) {
				const pole = add(new THREE.CylinderGeometry(.06, .08, 4.4, 8), poleMat);
				pole.position.set(x, 2.2, z);
				scene.add(pole);
				const lamp = add(new THREE.BoxGeometry(.85, .16, .36), lampMat);
				lamp.position.set(x * .92, 4.35, z * .94);
				scene.add(lamp);
				const light = new THREE.PointLight(16773584, 4.5, 20, 2);
				light.position.set(x * .88, 4.2, z * .9);
				scene.add(light);
			}
			const homeMat = keep(new THREE.MeshStandardMaterial({
				color: GOLD,
				roughness: .4,
				metalness: .18
			}));
			const awayMat = keep(new THREE.MeshStandardMaterial({
				color: OX,
				roughness: .4,
				metalness: .12
			}));
			const torsoGeo = new THREE.CapsuleGeometry(.13, .28, 4, 8);
			const headGeo = new THREE.SphereGeometry(.11, 12, 10);
			geos.push(torsoGeo, headGeo);
			const figure = (mat) => {
				const group = new THREE.Group();
				const torso = new THREE.Mesh(torsoGeo, mat);
				torso.position.y = .42;
				const head = new THREE.Mesh(headGeo, mat);
				head.position.y = .74;
				group.add(torso, head);
				scene.add(group);
				return group;
			};
			const homeGroups = Array.from({ length: 11 }, () => figure(homeMat));
			const awayGroups = Array.from({ length: 11 }, () => figure(awayMat));
			const ball = add(new THREE.SphereGeometry(.16, 18, 14), keep(new THREE.MeshStandardMaterial({
				color: CREAM,
				roughness: .32
			})));
			scene.add(ball);
			const rail = add(new THREE.BoxGeometry(sport === "baseball" ? 12.6 : 8.8, .22, .16), inkMat);
			rail.position.set(0, .12, sport === "soccer" ? 6.7 : 6.2);
			scene.add(rail);
			const fit = () => {
				const w = canvas.clientWidth || 640;
				const h = canvas.clientHeight || 320;
				renderer.setSize(w, h, false);
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
			};
			fit();
			const onResize = () => fit();
			window.addEventListener("resize", onResize);
			const loop = () => {
				if (dead) return;
				const frame = pose.current;
				const t = performance.now() * .001;
				ball.position.set(frame.ball[0], frame.ball[1] + (reduce ? 0 : Math.sin(t * 2) * .02), frame.ball[2]);
				const place = (spots, groups) => {
					spots.forEach((spot, index) => {
						const group = groups[index];
						if (!group) return;
						const on = spot[1] > -1;
						group.visible = on;
						if (!on) return;
						const bob = reduce ? 0 : Math.sin(t * 3 + index * .7) * .02;
						group.position.set(spot[0], bob, spot[2]);
						const dx = ball.position.x - spot[0];
						const dz = ball.position.z - spot[2];
						if (dx * dx + dz * dz > .05) group.rotation.y = Math.atan2(dx, dz);
					});
				};
				place(frame.home, homeGroups);
				place(frame.away, awayGroups);
				if (!renderer.xr.isPresenting) {
					const dist = sport === "baseball" ? 11.2 : 10.4;
					camera.position.set(Math.sin(look.yaw) * dist * Math.cos(look.pitch * .85), 2.1 + Math.sin(look.pitch) * dist * .42, Math.cos(look.yaw) * dist * Math.cos(look.pitch * .85));
					camera.lookAt(0, .3, 0);
				}
				renderer.render(scene, camera);
			};
			renderer.setAnimationLoop(loop);
			clean.push(() => {
				window.removeEventListener("resize", onResize);
				renderer.setAnimationLoop(null);
				renderer.dispose();
				for (const geo of geos) geo.dispose();
				for (const mat of mats) mat.dispose();
				rendererRef.current = null;
			});
		})();
		return () => {
			dead = true;
			canvas.removeEventListener("pointerdown", onDown);
			canvas.removeEventListener("pointermove", onMove);
			canvas.removeEventListener("pointerup", onUp);
			canvas.removeEventListener("pointercancel", onUp);
			for (const fn of clean) fn();
		};
	}, [match.sport]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "h-72 w-full touch-none rounded-xl border border-line bg-ink sm:h-96",
		"aria-label": "Agent field. Drag to look around."
	});
}
function TopBar({ title, eyebrow }) {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const toggleSound = useCasino((s) => s.toggleSound);
	const view = useCasino((s) => s.view);
	const setView = useCasino((s) => s.setView);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "mb-4 flex items-center gap-2",
		children: [
			view === "floor" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "crown-glow flex size-11 shrink-0 items-center justify-center rounded-full border border-gold text-gold",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, {
					className: "size-5",
					"aria-hidden": true
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setView("floor"),
				className: "press flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-ink-2 text-cream",
				"aria-label": "Back to the floor",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-widest text-cream-dim uppercase",
					children: eyebrow ?? "The Strip"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: `truncate font-display text-3xl leading-none italic ${view === "floor" ? "marquee" : "text-cream"}`,
					children: title
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: toggleSound,
				className: "press flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-ink-2 text-cream",
				"aria-label": sound ? "Mute the room" : "Turn the room on",
				"aria-pressed": sound,
				children: sound ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 items-center gap-1.5 rounded-full border border-gold bg-ink-2 px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, {
					className: "size-4 text-gold",
					"aria-hidden": true
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "bank-pop font-display text-lg leading-none text-gold tabular-nums",
					children: chips(bank)
				}, bank)]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-5 flex items-center gap-3",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-gold/40" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rotate-45 bg-gold" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-gold/40" })
		]
	})] });
}
function BrokeBanner() {
	const bank = useCasino((s) => s.bank);
	const marker = useCasino((s) => s.marker);
	if (bank >= 50) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: marker,
		className: "press mb-4 w-full rounded-xl border border-gold bg-panel px-4 py-3 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block font-medium text-gold",
			children: "Take a house marker"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 block text-sm text-cream-dim",
			children: "1,000 play chips. They cannot be cashed, transferred, or redeemed."
		})]
	});
}
function Frame({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "room relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pt-5 pb-16 sm:px-6",
		children
	});
}
var STAKES$7 = [
	25,
	50,
	100,
	250
];
var SPORTS = [
	"soccer",
	"baseball",
	"football"
];
function AgentBook() {
	const setView = useCasino((s) => s.setView);
	const agent = useCasino((s) => s.agent);
	const clubs = agent ? CLUBS[agent.sport] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => setView("agents"),
		className: "press mb-4 w-full rounded-xl border border-gold/60 bg-ink-2 px-4 py-3 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs tracking-widest text-gold uppercase",
			children: "Agent card"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 block text-sm text-cream",
			children: agent && clubs ? `${clubs.home.name} vs ${clubs.away.name} · ${clockLabel(agent)} ${agent.homeScore}–${agent.awayScore}` : "Simulated soccer, baseball, and football. Same chips. A 3D field, and VR if a headset is paired."
		})]
	});
}
function Agents() {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const agent = useCasino((s) => s.agent);
	const agentBets = useCasino((s) => s.agentBets);
	const openAgent = useCasino((s) => s.openAgent);
	const kickAgent = useCasino((s) => s.kickAgent);
	const placeAgentBet = useCasino((s) => s.placeAgentBet);
	const arena = (0, import_react.useRef)(null);
	const [stake, setStake] = (0, import_react.useState)(25);
	const [pick, setPick] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)("");
	const [vrNote, setVrNote] = (0, import_react.useState)("Drag the field to look around. VR uses a paired headset.");
	const clubs = agent ? CLUBS[agent.sport] : null;
	const board = agent ? offers(agent) : [];
	const open = agent ? betsOpen(agent) : false;
	(0, import_react.useEffect)(() => {
		if (!useCasino.getState().agent) openAgent("soccer");
	}, [openAgent]);
	function bet() {
		if (!agent || !pick || !open || stake > bank) return;
		if (!placeAgentBet({
			sport: agent.sport,
			label: `${CLUBS[agent.sport].away.abbr}/${CLUBS[agent.sport].home.abbr} ${pick.label}`,
			market: pick.market,
			side: pick.side,
			odds: pick.odds,
			line: pick.line,
			stake
		})) return;
		playCue("chip", sound);
		setPick(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "The Agents",
			eyebrow: "Simulated field · play chips"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-xl text-sm leading-relaxed text-cream-dim",
			children: "Two agents play a full match on the field. The price is the house card, not a league wire. Chips lock until the final. No cash."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			role: "group",
			"aria-label": "Agent sport",
			children: SPORTS.map((sport) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					if (agent?.sport === sport && agent.status !== "final") return;
					if (!openAgent(sport)) {
						setNote("This one is live. The card changes after the final.");
						return;
					}
					setNote("");
					setPick(null);
				},
				className: `press min-h-11 rounded-full border px-4 text-sm capitalize ${agent?.sport === sport ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				"aria-pressed": agent?.sport === sport,
				children: sport
			}, sport))
		}),
		note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-gold",
			children: note
		}) : null,
		agent && clubs ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arena, {
					match: agent,
					api: arena
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						arena.current?.enterVR().then((result) => {
							setVrNote(result === "ok" ? "Headset on. Look around the field." : "No headset on this screen. Drag the field to look around.");
						});
					},
					className: "press min-h-11 rounded-full border border-gold px-4 text-sm text-gold",
					children: "Enter VR"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-cream-dim",
					children: vrNote
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-display text-4xl text-cream tabular-nums lining-nums",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-oxblood",
							children: clubs.away.abbr
						}),
						" ",
						agent.awayScore,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-cream-dim",
							children: " · "
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-gold",
							children: clubs.home.abbr
						}),
						" ",
						agent.homeScore
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-gold tabular-nums",
					children: clockLabel(agent)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-cream-dim",
				children: [
					clubs.away.name,
					" at ",
					clubs.home.name,
					". Gold is home. Oxblood is away."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-1 text-sm text-cream-dim",
				children: agent.log.slice(0, 3).map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, `${line}-${index}`))
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid grid-cols-2 gap-2",
				children: board.map((offer) => {
					const on = pick?.label === offer.label && pick.market === offer.market;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setPick(offer),
						className: `press min-h-11 rounded-lg border px-3 py-2 text-left text-sm ${on ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
						"aria-pressed": on,
						children: offer.label
					}, `${offer.market}-${offer.side}-${offer.label}`);
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-cream-dim",
				children: agent.status === "final" ? "Final. Open a new card to bet the next match." : "The window is closed."
			}),
			open && pick && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-xl border border-gold bg-panel p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-cream",
						children: pick.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: STAKES$7.map((amount) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: bank < amount,
							onClick: () => setStake(amount),
							className: `press min-h-11 rounded-full border px-4 text-sm tabular-nums disabled:opacity-40 ${stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-ink-2 text-cream"}`,
							"aria-pressed": stake === amount,
							children: chips(amount)
						}, amount))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: bet,
						disabled: stake > bank,
						className: "press mt-3 min-h-12 w-full rounded-xl bg-gold font-medium text-ink disabled:opacity-40",
						children: ["Bet ", chips(stake)]
					})
				]
			}),
			agent.status === "card" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					kickAgent();
					playCue("spin", sound);
				},
				className: "press mt-3 min-h-12 w-full rounded-xl border border-gold text-base text-gold",
				children: "Kick off"
			}),
			agent.status === "final" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => openAgent(agent.sport),
				className: "press mt-3 min-h-12 w-full rounded-xl border border-line text-cream",
				children: "New card"
			}),
			agentBets.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line rounded-xl border border-line bg-ink-2",
				children: agentBets.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "px-4 py-3 text-sm text-cream",
					children: [
						row.label,
						" · ",
						chips(row.stake),
						" held"
					]
				}, row.id))
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 rounded-xl border border-line bg-ink-2 px-4 py-4 text-sm text-cream-dim",
			children: "Pick a sport. The field builds in 3D, then the card opens."
		})
	] });
}
var NIGHT_PAY = {
	gem: {
		w: 5,
		p3: 56,
		p2: 7,
		label: "Gem"
	},
	coupe: {
		w: 9,
		p3: 26,
		p2: 5,
		label: "Coupe"
	},
	star: {
		w: 14,
		p3: 14,
		p2: 3,
		label: "Star"
	},
	olive: {
		w: 22,
		p3: 8,
		p2: 2,
		label: "Olive"
	},
	chip: {
		w: 32,
		p3: 5,
		p2: 1,
		label: "Chip"
	}
};
var NIGHTS = Object.keys(NIGHT_PAY);
var IDLE_LINE = [
	"gem",
	"coupe",
	"star"
];
function randomNight() {
	const total = NIGHTS.reduce((sum, key) => sum + NIGHT_PAY[key].w, 0);
	let roll = Math.random() * total;
	for (const key of NIGHTS) {
		roll -= NIGHT_PAY[key].w;
		if (roll <= 0) return key;
	}
	return "chip";
}
function spinLine() {
	return [
		randomNight(),
		randomNight(),
		randomNight()
	];
}
function evaluateHours(line, bet) {
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
	return {
		mult,
		payout,
		net: payout - bet,
		note
	};
}
function ReelColumn({ stopped, rolling, rows, next, render }) {
	const track = (0, import_react.useRef)(null);
	const rollingRef = (0, import_react.useRef)(rolling);
	const stoppedRef = (0, import_react.useRef)(stopped);
	const nextRef = (0, import_react.useRef)(next);
	rollingRef.current = rolling;
	stoppedRef.current = stopped;
	nextRef.current = next;
	const [strip, setStrip] = (0, import_react.useState)(() => [...stopped, stopped[0] ?? stopped[0]].filter(Boolean));
	(0, import_react.useEffect)(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let raf = 0;
		let y = 0;
		let mode = "rest";
		let alive = true;
		const loop = () => {
			if (!alive) return;
			const node = track.current;
			const child = node?.firstElementChild;
			const step = child ? child.offsetHeight + 8 : 72;
			if (mode === "rest" && rollingRef.current) mode = "spin";
			if (mode === "spin" && !rollingRef.current) {
				mode = "stop";
				const finalStrip = stoppedRef.current.slice(0, rows);
				setStrip((prev) => {
					const top = prev[0];
					return top === void 0 ? finalStrip : [top, ...finalStrip];
				});
			}
			if (mode === "spin") {
				y += 640 / 60;
				if (y >= step) {
					y -= step;
					setStrip((prev) => {
						const copy = prev.slice(1);
						copy.push(nextRef.current());
						return copy;
					});
				}
			} else if (mode === "stop") {
				y += 7;
				if (y >= step) {
					y = 0;
					mode = "rest";
					const finalStrip = stoppedRef.current.slice(0, rows);
					const extra = finalStrip[0];
					setStrip(extra === void 0 ? finalStrip : [...finalStrip, extra]);
				}
			}
			if (node) node.style.transform = `translate3d(0, ${-y}px, 0)`;
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => {
			alive = false;
			cancelAnimationFrame(raf);
		};
	}, [rows]);
	(0, import_react.useEffect)(() => {
		if (rolling) return;
		if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const extra = stopped[0];
		setStrip(extra === void 0 ? stopped.slice(0, rows) : [...stopped.slice(0, rows), extra]);
	}, [
		rolling,
		rows,
		stopped
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "invisible grid gap-2",
			"aria-hidden": true,
			children: Array.from({ length: rows }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "aspect-square" }, index))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 overflow-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: track,
				className: "grid gap-2",
				children: strip.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: render(item, index) }, index))
			})
		})]
	});
}
var STAKES$6 = [
	20,
	50,
	100,
	200
];
var FACE$1 = {
	gem: {
		tile: "bg-gold",
		fg: "text-ink",
		icon: Gem
	},
	coupe: {
		tile: "bg-oxblood",
		fg: "text-cream",
		icon: Martini
	},
	star: {
		tile: "bg-cream",
		fg: "text-ink",
		icon: Star
	},
	olive: {
		tile: "bg-felt",
		fg: "text-gold",
		icon: CircleDot
	},
	chip: {
		tile: "bg-panel",
		fg: "text-gold",
		text: "¢"
	}
};
function AfterHours() {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const settle = useCasino((s) => s.settle);
	const [stake, setStake] = (0, import_react.useState)(20);
	const [line, setLine] = (0, import_react.useState)(IDLE_LINE);
	const [rolling, setRolling] = (0, import_react.useState)([
		false,
		false,
		false
	]);
	const [spinning, setSpinning] = (0, import_react.useState)(false);
	const [win, setWin] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)("One line. The first two reels open the pay.");
	const [net, setNet] = (0, import_react.useState)(null);
	const token = (0, import_react.useRef)(0);
	const timers = (0, import_react.useRef)([]);
	(0, import_react.useEffect)(() => {
		return () => {
			token.current += 1;
			for (const id of timers.current) window.clearTimeout(id);
		};
	}, []);
	function finish(finalLine, bet, id) {
		if (token.current !== id) return;
		const scored = evaluateHours(finalLine, bet);
		setLine(finalLine);
		setSpinning(false);
		setRolling([
			false,
			false,
			false
		]);
		setWin(scored.mult > 0);
		setNote(scored.note);
		setNet(scored.net);
		settle(scored.net, "afterhours", scored.note);
		playCue(scored.net > 0 ? "win" : "lose", sound);
	}
	function spin() {
		if (spinning || stake > bank) return;
		const finalLine = spinLine();
		const id = token.current + 1;
		token.current = id;
		for (const timer of timers.current) window.clearTimeout(timer);
		timers.current = [];
		setSpinning(true);
		setRolling([
			true,
			true,
			true
		]);
		setWin(false);
		setNet(null);
		setNote("Reels turning.");
		playCue("spin", sound);
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			finish(finalLine, stake, id);
			return;
		}
		[
			0,
			1,
			2
		].forEach((col) => {
			const timer = window.setTimeout(() => {
				if (token.current !== id) return;
				setLine((prev) => {
					const next = [...prev];
					const symbol = finalLine[col];
					if (symbol) next[col] = symbol;
					return next;
				});
				setRolling((prev) => {
					const next = [
						prev[0],
						prev[1],
						prev[2]
					];
					next[col] = false;
					return next;
				});
				if (col === 2) {
					const later = window.setTimeout(() => finish(finalLine, stake, id), 280);
					timers.current.push(later);
				}
			}, 800 + col * 550);
			timers.current.push(timer);
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "After Hours",
			eyebrow: "One line · three reels"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sr-only",
			"aria-live": "polite",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "felt-well rounded-xl border border-gold/50 bg-felt-deep p-3 sm:p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid max-w-md grid-cols-3 gap-2",
				children: [
					0,
					1,
					2
				].map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelColumn, {
					rows: 1,
					rolling: rolling[col] ?? false,
					stopped: [line[col] ?? "chip"],
					next: randomNight,
					render: (sym) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NightTile, {
						sym,
						win: win && !spinning
					})
				}, col))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl text-cream italic",
				children: note
			}), net !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `mt-1 text-sm tabular-nums ${net > 0 ? "win-note text-gold" : "text-cream-dim"}`,
				children: [net > 0 ? "+" : "", chips(net)]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			role: "group",
			"aria-label": "Spin stake",
			children: STAKES$6.map((amount) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: spinning || bank < amount,
				onClick: () => {
					setStake(amount);
					playCue("chip", sound);
				},
				className: `press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				"aria-pressed": stake === amount,
				children: chips(amount)
			}, amount))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: spin,
			disabled: spinning || stake > bank,
			className: "press mt-3 min-h-12 w-full rounded-xl bg-gold text-base font-medium text-ink disabled:opacity-40",
			children: spinning ? "Spinning" : `Spin ${chips(stake)}`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
			className: "mt-5 rounded-xl border border-line bg-ink-2 px-4 py-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "min-h-11 cursor-pointer text-sm font-medium text-cream",
					children: "Paytable"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-cream-dim",
					children: "One line, stake on the line. Two of a kind must be the first two reels. Three of a kind pays the whole window."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "mt-3 w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-xs tracking-widest text-cream-dim uppercase",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Symbol"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Two"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Three"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: NIGHTS.map((sym) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2 text-cream",
								children: NIGHT_PAY[sym].label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "py-2 text-gold tabular-nums",
								children: [NIGHT_PAY[sym].p2, "×"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "py-2 text-gold tabular-nums",
								children: [NIGHT_PAY[sym].p3, "×"]
							})
						]
					}, sym)) })]
				})
			]
		})
	] });
}
function NightTile({ sym, win }) {
	const face = FACE$1[sym];
	const Icon = face.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `flex aspect-square items-center justify-center rounded-lg ${face.tile} ${face.fg} ${win ? "win-pulse ring-2 ring-gold" : ""}`,
		children: face.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-4xl italic",
			children: face.text
		}) : Icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-10",
			"aria-hidden": true
		}) : null
	});
}
var RANKS = [
	"A",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"J",
	"Q",
	"K"
];
var SUITS = [
	"s",
	"h",
	"d",
	"c"
];
var SUIT_NAME = {
	s: "spades",
	h: "hearts",
	d: "diamonds",
	c: "clubs"
};
function freshShoe(decks = 6) {
	const cards = [];
	let n = 0;
	for (let d = 0; d < decks; d++) for (const suit of SUITS) for (const rank of RANKS) cards.push({
		rank,
		suit,
		id: `${d}-${suit}-${rank}-${n++}`
	});
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
function handValue(cards) {
	let total = 0;
	let aces = 0;
	for (const card of cards) if (card.rank === "A") {
		aces += 1;
		total += 11;
	} else if (card.rank === "K" || card.rank === "Q" || card.rank === "J" || card.rank === "10") total += 10;
	else total += Number(card.rank);
	while (total > 21 && aces > 0) {
		total -= 10;
		aces -= 1;
	}
	return {
		total,
		soft: aces > 0
	};
}
function isBlackjack(cards) {
	return cards.length === 2 && handValue(cards).total === 21;
}
function take(shoe) {
	const [card, ...rest] = shoe;
	if (!card) {
		const [next, ...tail] = freshShoe();
		if (!next) throw new Error("Shoe failed to shuffle");
		return {
			card: next,
			shoe: tail
		};
	}
	return {
		card,
		shoe: rest
	};
}
function emptyRound() {
	return {
		shoe: [],
		phase: "bet",
		player: [],
		dealer: [],
		hideHole: false,
		stake: 0,
		note: "Place a wager. The shoe is six decks.",
		net: null
	};
}
function result(player, dealer, stake, natural) {
	const pv = handValue(player).total;
	const dv = handValue(dealer).total;
	const pBJ = natural && isBlackjack(player);
	const dBJ = natural && isBlackjack(dealer);
	if (pBJ && dBJ) return {
		note: "Push. Both have blackjack.",
		net: 0
	};
	if (pBJ) return {
		note: "Blackjack pays three to two.",
		net: Math.round(stake * 3 / 2)
	};
	if (dBJ) return {
		note: "Dealer blackjack.",
		net: -stake
	};
	if (pv > 21) return {
		note: `You bust at ${pv}.`,
		net: -stake
	};
	if (dv > 21) return {
		note: `Dealer busts at ${dv}.`,
		net: stake
	};
	if (pv > dv) return {
		note: `${pv} beats ${dv}.`,
		net: stake
	};
	if (pv < dv) return {
		note: `Dealer ${dv} beats ${pv}.`,
		net: -stake
	};
	return {
		note: `Push at ${pv}.`,
		net: 0
	};
}
function dealRound(prev, bet) {
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
			net: settled.net
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
		net: null
	};
}
function hitRound(prev) {
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
			net: settled.net
		};
	}
	return {
		...prev,
		shoe: drawn.shoe,
		player,
		note: `${handValue(player).total}. Hit or stand.`
	};
}
function standRound(prev) {
	let shoe = prev.shoe;
	let dealer = [...prev.dealer];
	if (handValue(prev.player).total <= 21) while (handValue(dealer).total < 17) {
		const drawn = take(shoe);
		shoe = drawn.shoe;
		dealer = [...dealer, drawn.card];
	}
	const settled = result(prev.player, dealer, prev.stake, false);
	return {
		...prev,
		shoe,
		dealer,
		hideHole: false,
		phase: "done",
		note: settled.note,
		net: settled.net
	};
}
function doubleRound(prev) {
	const drawn = take(prev.shoe);
	const player = [...prev.player, drawn.card];
	const stake = prev.stake * 2;
	const mid = {
		...prev,
		shoe: drawn.shoe,
		player,
		stake
	};
	if (handValue(player).total > 21) {
		const settled = result(player, prev.dealer, stake, false);
		return {
			...mid,
			hideHole: false,
			phase: "done",
			note: settled.note,
			net: settled.net
		};
	}
	return standRound(mid);
}
function pip(rank) {
	if (rank === "A") return 1;
	if (rank === "10" || rank === "J" || rank === "Q" || rank === "K") return 0;
	return Number(rank);
}
function baccaratTotal(cards) {
	return cards.reduce((sum, card) => sum + pip(card.rank), 0) % 10;
}
function draw(shoe) {
	const [card, ...rest] = shoe.length < 6 ? freshShoe() : shoe;
	if (!card) return draw(freshShoe());
	return {
		card,
		shoe: rest
	};
}
function bankerDraws(total, playerThird) {
	if (playerThird === null) return total <= 5;
	if (total <= 2) return true;
	if (total === 3) return playerThird !== 8;
	if (total === 4) return playerThird >= 2 && playerThird <= 7;
	if (total === 5) return playerThird >= 4 && playerThird <= 7;
	if (total === 6) return playerThird === 6 || playerThird === 7;
	return false;
}
function playCoup(prevShoe, side, stake) {
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
	if (!(p0 >= 8 || b0 >= 8)) {
		let third = null;
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
	else if (winner === side) net = side === "banker" ? Math.round(stake * 19 / 20) : stake;
	const note = `${winner === "tie" ? "Tie" : winner === "player" ? "Player" : "Banker"} ${winner === "player" ? pt : winner === "banker" ? bt : pt}. ${pt} to ${bt}.`;
	return {
		shoe,
		player,
		banker,
		winner,
		net,
		note
	};
}
var ICONS = {
	s: Spade,
	h: Heart,
	d: Diamond,
	c: Club
};
function PlayingCard({ card, faceDown, compact, index = 0 }) {
	const box = compact ? "h-20 w-14" : "h-24 w-16 sm:h-28 sm:w-20";
	const motion = { animationDelay: `${index * 55}ms` };
	if (faceDown || !card) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `deal flex ${box} items-center justify-center rounded-lg border-2 border-gold bg-felt shadow-lg`,
		style: motion,
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spade, { className: "size-5 text-gold" })
	});
	const red = card.suit === "h" || card.suit === "d";
	const Icon = ICONS[card.suit];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `deal flex ${box} flex-col justify-between rounded-lg bg-cream p-1.5 shadow-lg ${red ? "text-oxblood" : "text-ink"}`,
		style: motion,
		"aria-label": `${card.rank} of ${SUIT_NAME[card.suit]}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-0.5 text-sm leading-none font-semibold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: card.rank }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "size-3",
					"aria-hidden": true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "mx-auto size-6 sm:size-8",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex rotate-180 items-center gap-0.5 self-end text-sm leading-none font-semibold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: card.rank }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "size-3",
					"aria-hidden": true
				})]
			})
		]
	});
}
var STAKES$5 = [
	20,
	100,
	200
];
function Baccarat() {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const settle = useCasino((s) => s.settle);
	const [shoe, setShoe] = (0, import_react.useState)([]);
	const [side, setSide] = (0, import_react.useState)("player");
	const [stake, setStake] = (0, import_react.useState)(20);
	const [player, setPlayer] = (0, import_react.useState)([]);
	const [banker, setBanker] = (0, import_react.useState)([]);
	const [note, setNote] = (0, import_react.useState)("Player, banker, or a tie. One coup.");
	const [net, setNet] = (0, import_react.useState)(null);
	function deal() {
		if (bank < stake) return;
		playCue("card", sound);
		const coup = playCoup(shoe, side, stake);
		setShoe(coup.shoe);
		setPlayer(coup.player);
		setBanker(coup.banker);
		setNote(coup.note);
		setNet(coup.net);
		settle(coup.net, "baccarat", coup.note);
		playCue(coup.net > 0 ? "win" : coup.net < 0 ? "lose" : "chip", sound);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "The Salon",
			eyebrow: "Baccarat · punto banco"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sr-only",
			"aria-live": "polite",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "felt-well rounded-xl border border-line bg-felt-deep px-3 py-5 sm:px-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Side, {
					label: "Player",
					total: player.length ? baccaratTotal(player) : null,
					cards: player
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-5 h-px bg-line" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Side, {
					label: "Banker",
					total: banker.length ? baccaratTotal(banker) : null,
					cards: banker
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl text-cream italic",
				children: note
			}), net !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `text-sm tabular-nums ${net > 0 ? "win-note text-gold" : "text-cream-dim"}`,
				children: [net > 0 ? "+" : "", chips(net)]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid grid-cols-3 gap-2",
			children: [
				[
					"player",
					"Player",
					"1:1"
				],
				[
					"banker",
					"Banker",
					"19:20"
				],
				[
					"tie",
					"Tie",
					"8:1"
				]
			].map(([id, label, odds]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setSide(id),
				className: `press min-h-12 rounded-xl border text-sm font-medium ${side === id ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				"aria-pressed": side === id,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `block text-xs ${side === id ? "text-ink" : "text-cream-dim"}`,
					children: odds
				})]
			}, id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 flex flex-wrap gap-2",
			children: STAKES$5.map((amount) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: bank < amount,
				onClick: () => {
					setStake(amount);
					playCue("chip", sound);
				},
				className: `press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				children: chips(amount)
			}, amount))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: deal,
			disabled: bank < stake,
			className: "press mt-3 min-h-12 w-full rounded-xl bg-gold font-medium text-ink disabled:opacity-40",
			children: ["Deal ", chips(stake)]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm leading-relaxed text-cream-dim",
			children: "Totals are the pip count modulo ten. Banker wins pay nineteen for twenty. A tie pays eight to one and pushes the other two bets."
		})
	] });
}
function Side({ label, total, cards }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 flex items-baseline justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-xs tracking-widest text-cream uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-lg text-cream tabular-nums",
			children: total === null ? "—" : total
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-24 flex-wrap gap-2",
		children: [cards.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, { faceDown: true }), cards.map((card, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
			card,
			index
		}, card.id))]
	})] });
}
function smoothstep(t) {
	const x = Math.min(1, Math.max(0, t));
	return x * x * (3 - 2 * x);
}
function osc(time, speed, phase = 0) {
	return Math.sin(time * speed + phase);
}
function Bartender({ place = "side" }) {
	const body = (0, import_react.useRef)(null);
	const arm = (0, import_react.useRef)(null);
	const shaker = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let raf = 0;
		let alive = true;
		const started = performance.now();
		const loop = (now) => {
			if (!alive) return;
			const time = (now - started) / 1e3;
			const sway = osc(time, 1.15) * 1.6;
			const wipe = osc(time, 1.85, .4) * 16;
			const shake = Math.abs(osc(time, 3.1, 1.1)) * 8;
			body.current?.setAttribute("transform", `rotate(${sway.toFixed(3)} 46 78)`);
			arm.current?.setAttribute("transform", `rotate(${wipe.toFixed(3)} 58 64)`);
			shaker.current?.setAttribute("transform", `rotate(${(-shake).toFixed(3)} 112 46)`);
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => {
			alive = false;
			cancelAnimationFrame(raf);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: place === "side" ? "pointer-events-none fixed top-24 right-3 z-20 hidden w-52 min-[1180px]:block" : "pointer-events-none relative z-20 mb-4 w-full min-[1180px]:hidden",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "piano-rail rounded-2xl border border-line bg-ink-2/95 px-3 pt-2 pb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-widest text-cream-dim uppercase",
				children: "The bar"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 160 108",
				className: "mt-1 h-24 w-full",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "8",
						y: "78",
						width: "144",
						height: "18",
						rx: "3",
						fill: "var(--color-oxblood)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "8",
						y: "78",
						width: "144",
						height: "5",
						fill: "var(--color-gold)",
						opacity: "0.85"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
						ref: shaker,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "104",
							y: "28",
							width: "14",
							height: "36",
							rx: "3",
							fill: "var(--color-cream)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "106",
							y: "22",
							width: "10",
							height: "8",
							rx: "2",
							fill: "var(--color-gold)"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "124",
						y: "40",
						width: "8",
						height: "32",
						rx: "2",
						fill: "var(--color-felt)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "136",
						y: "48",
						width: "8",
						height: "24",
						rx: "2",
						fill: "var(--color-gold)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
						ref: body,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M28 80c2-22 8-34 18-34s16 12 18 34",
								fill: "var(--color-ink)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M42 52l6 16h-12z",
								fill: "var(--color-cream)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M40 54h10",
								stroke: "var(--color-gold)",
								strokeWidth: "1.6",
								strokeLinecap: "round"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: "46",
								cy: "34",
								r: "12",
								fill: "var(--color-cream-dim)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M34 34c1-14 24-14 24 1-2-8-22-10-24-1z",
								fill: "var(--color-ink)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								ref: arm,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M58 62c16 2 28-6 40-16",
									fill: "none",
									stroke: "var(--color-cream-dim)",
									strokeWidth: "4",
									strokeLinecap: "round"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "98",
									cy: "46",
									r: "3.2",
									fill: "var(--color-cream)"
								})]
							})
						]
					})
				]
			})]
		})
	});
}
var WAGERS = [
	50,
	100,
	250,
	500
];
function Blackjack() {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const settle = useCasino((s) => s.settle);
	const [wager, setWager] = (0, import_react.useState)(50);
	const [round, setRound] = (0, import_react.useState)(emptyRound);
	const playerTotal = round.player.length ? handValue(round.player).total : null;
	const dealerShown = round.hideHole ? round.dealer.slice(0, 1) : round.dealer;
	const dealerTotal = dealerShown.length ? handValue(dealerShown).total : null;
	const canDeal = (round.phase === "bet" || round.phase === "done") && bank >= wager;
	const canDouble = round.phase === "play" && round.player.length === 2 && bank >= round.stake * 2;
	function apply(next) {
		setRound(next);
		if (next.phase === "done" && next.net !== null) {
			settle(next.net, "blackjack", next.note);
			playCue(next.net > 0 ? "win" : next.net < 0 ? "lose" : "card", sound);
		}
	}
	function onDeal() {
		if (!canDeal) return;
		playCue("card", sound);
		apply(dealRound(round.phase === "done" ? {
			...round,
			phase: "bet",
			net: null
		} : round, wager));
	}
	function onHit() {
		if (round.phase !== "play") return;
		playCue("card", sound);
		apply(hitRound(round));
	}
	function onStand() {
		if (round.phase !== "play") return;
		playCue("card", sound);
		apply(standRound(round));
	}
	function onDouble() {
		if (!canDouble) return;
		playCue("card", sound);
		apply(doubleRound(round));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "The Shoe",
			eyebrow: "Blackjack · stands on 17"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "sr-only",
			"aria-live": "polite",
			children: [round.note, round.net !== null ? ` ${round.net > 0 ? "Up" : "Down"} ${chips(Math.abs(round.net))}` : ""]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "felt-well rounded-xl border border-line bg-felt-deep px-3 py-5 sm:px-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hand, {
					label: "Dealer",
					total: dealerTotal,
					hide: round.hideHole,
					cards: round.dealer
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-5 h-px bg-line" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hand, {
					label: "You",
					total: playerTotal,
					cards: round.player
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 rounded-xl border border-line bg-ink-2 px-4 py-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl text-cream italic",
					children: round.note
				}),
				round.net !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: `mt-1 text-sm tabular-nums ${round.net > 0 ? "win-note text-gold" : "text-cream-dim"}`,
					children: [
						round.net > 0 ? "+" : "",
						chips(round.net),
						" on ",
						chips(round.stake)
					]
				}),
				round.phase === "play" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-cream-dim tabular-nums",
					children: ["In play · ", chips(round.stake)]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			role: "group",
			"aria-label": "Wager",
			children: WAGERS.map((amount) => {
				const active = wager === amount;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: round.phase === "play" || bank < amount,
					onClick: () => {
						setWager(amount);
						playCue("chip", sound);
					},
					className: `press min-h-11 min-w-16 rounded-full border px-4 text-sm font-medium tabular-nums ${active ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream disabled:opacity-40"}`,
					"aria-pressed": active,
					children: chips(amount)
				}, amount);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4",
			children: round.phase === "play" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
					onClick: onHit,
					children: "Hit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
					onClick: onStand,
					children: "Stand"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
					onClick: onDouble,
					disabled: !canDouble,
					children: "Double"
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
				onClick: onDeal,
				disabled: !canDeal,
				wide: true,
				children: round.phase === "done" ? "Deal again" : "Deal"
			})
		})
	] });
}
function Hand({ label, total, cards, hide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 flex items-baseline justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-xs tracking-widest text-cream uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-lg text-cream tabular-nums",
			children: total === null ? "—" : total
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-24 flex-wrap gap-2",
		children: [cards.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, { faceDown: true }), cards.map((card, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
			card,
			faceDown: Boolean(hide && index === 1),
			index
		}, card.id))]
	})] });
}
function Action({ children, onClick, disabled, wide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		disabled,
		className: `press min-h-12 rounded-xl bg-gold px-4 font-medium text-ink disabled:opacity-40 ${wide ? "col-span-2 sm:col-span-1" : ""}`,
		children
	});
}
function rollDice() {
	return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
}
function resolveCraps(phase, point, dice, side, stake) {
	const sum = dice[0] + dice[1];
	const faces = `${dice[0]} and ${dice[1]}`;
	if (phase === "comeout") {
		if (sum === 7 || sum === 11) return {
			phase: "comeout",
			point: null,
			net: side === "pass" ? stake : -stake,
			note: side === "pass" ? `${faces}. Natural ${sum}.` : `${faces}. Natural ${sum} beats don't pass.`
		};
		if (sum === 2 || sum === 3 || sum === 12) {
			if (side === "pass") return {
				phase: "comeout",
				point: null,
				net: -stake,
				note: `${faces}. Craps ${sum}.`
			};
			if (sum === 12) return {
				phase: "comeout",
				point: null,
				net: 0,
				note: `${faces}. Twelve bars don't pass.`
			};
			return {
				phase: "comeout",
				point: null,
				net: stake,
				note: `${faces}. Craps ${sum} pays don't pass.`
			};
		}
		return {
			phase: "point",
			point: sum,
			net: null,
			note: `${faces}. Point is ${sum}.`
		};
	}
	if (sum === point) return {
		phase: "comeout",
		point: null,
		net: side === "pass" ? stake : -stake,
		note: side === "pass" ? `${faces}. Point ${sum} hits.` : `${faces}. Point ${sum} takes don't pass.`
	};
	if (sum === 7) return {
		phase: "comeout",
		point: null,
		net: side === "pass" ? -stake : stake,
		note: side === "pass" ? `${faces}. Seven out.` : `${faces}. Seven out pays don't pass.`
	};
	return {
		phase: "point",
		point,
		net: null,
		note: `${faces}. Point stays ${point}.`
	};
}
var ID_Q = {
	x: 0,
	y: 0,
	z: 0,
	w: 1
};
function axisQ(ax, ay, az, rad) {
	const h = rad * .5;
	const s = Math.sin(h);
	const len = Math.hypot(ax, ay, az) || 1;
	return {
		x: ax / len * s,
		y: ay / len * s,
		z: az / len * s,
		w: Math.cos(h)
	};
}
function qmul(a, b) {
	return {
		x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
		y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
		z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
		w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
	};
}
function qnorm(q) {
	const n = Math.hypot(q.x, q.y, q.z, q.w) || 1;
	return {
		x: q.x / n,
		y: q.y / n,
		z: q.z / n,
		w: q.w / n
	};
}
function slerp(a, b, t) {
	let bx = b.x;
	let by = b.y;
	let bz = b.z;
	let bw = b.w;
	let dot = a.x * bx + a.y * by + a.z * bz + a.w * bw;
	if (dot < 0) {
		dot = -dot;
		bx = -bx;
		by = -by;
		bz = -bz;
		bw = -bw;
	}
	if (dot > .9995) return qnorm({
		x: a.x + (bx - a.x) * t,
		y: a.y + (by - a.y) * t,
		z: a.z + (bz - a.z) * t,
		w: a.w + (bw - a.w) * t
	});
	const theta = Math.acos(Math.min(1, dot));
	const s = Math.sin(theta);
	const w1 = Math.sin((1 - t) * theta) / s;
	const w2 = Math.sin(t * theta) / s;
	return {
		x: a.x * w1 + bx * w2,
		y: a.y * w1 + by * w2,
		z: a.z * w1 + bz * w2,
		w: a.w * w1 + bw * w2
	};
}
function modelMatrix(q, tx, ty, tz, s) {
	const { x, y, z, w } = qnorm(q);
	const m = /* @__PURE__ */ new Float32Array(16);
	m[0] = s * (1 - 2 * (y * y + z * z));
	m[1] = s * (2 * (x * y + w * z));
	m[2] = s * (2 * (x * z - w * y));
	m[4] = s * (2 * (x * y - w * z));
	m[5] = s * (1 - 2 * (x * x + z * z));
	m[6] = s * (2 * (y * z + w * x));
	m[8] = s * (2 * (x * z + w * y));
	m[9] = s * (2 * (y * z - w * x));
	m[10] = s * (1 - 2 * (x * x + y * y));
	m[12] = tx;
	m[13] = ty;
	m[14] = tz;
	m[15] = 1;
	return m;
}
function perspective(fovy, aspect, near, far) {
	const f = 1 / Math.tan(fovy / 2);
	const m = /* @__PURE__ */ new Float32Array(16);
	m[0] = f / aspect;
	m[5] = f;
	m[10] = (far + near) / (near - far);
	m[11] = -1;
	m[14] = 2 * far * near / (near - far);
	return m;
}
function lookAt(eye, target, up) {
	let zx = eye[0] - target[0];
	let zy = eye[1] - target[1];
	let zz = eye[2] - target[2];
	const zl = Math.hypot(zx, zy, zz) || 1;
	zx /= zl;
	zy /= zl;
	zz /= zl;
	let xx = up[1] * zz - up[2] * zy;
	let xy = up[2] * zx - up[0] * zz;
	let xz = up[0] * zy - up[1] * zx;
	const xl = Math.hypot(xx, xy, xz) || 1;
	xx /= xl;
	xy /= xl;
	xz /= xl;
	const yx = zy * xz - zz * xy;
	const yy = zz * xx - zx * xz;
	const yz = zx * xy - zy * xx;
	const m = /* @__PURE__ */ new Float32Array(16);
	m[0] = xx;
	m[1] = yx;
	m[2] = zx;
	m[4] = xy;
	m[5] = yy;
	m[6] = zy;
	m[8] = xz;
	m[9] = yz;
	m[10] = zz;
	m[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
	m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
	m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
	m[15] = 1;
	return m;
}
function mul4(a, b) {
	const o = /* @__PURE__ */ new Float32Array(16);
	for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
	return o;
}
var VERT$2 = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUv;
layout(location = 3) in float aVal;
uniform mat4 uMvp;
uniform mat4 uModel;
out vec3 vN;
out vec2 vUv;
out float vVal;
void main() {
  vN = mat3(uModel) * aNrm;
  vUv = aUv;
  vVal = aVal;
  gl_Position = uMvp * vec4(aPos, 1.0);
}
`;
var FRAG$2 = `#version 300 es
precision highp float;
in vec3 vN;
in vec2 vUv;
in float vVal;
out vec4 frag;

float pip(vec2 uv, vec2 c) {
  return 1.0 - smoothstep(0.055, 0.078, distance(uv, c));
}

void main() {
  vec2 uv = vUv;
  int v = int(vVal + 0.5);
  float spots = 0.0;
  if (v == 1 || v == 3 || v == 5) spots = max(spots, pip(uv, vec2(0.5)));
  if (v == 2 || v == 3) {
    spots = max(spots, max(pip(uv, vec2(0.28, 0.72)), pip(uv, vec2(0.72, 0.28))));
  }
  if (v == 4 || v == 5) {
    spots = max(spots, pip(uv, vec2(0.28, 0.28)));
    spots = max(spots, pip(uv, vec2(0.72, 0.28)));
    spots = max(spots, pip(uv, vec2(0.28, 0.72)));
    spots = max(spots, pip(uv, vec2(0.72, 0.72)));
  }
  if (v == 6) {
    spots = max(spots, pip(uv, vec2(0.28, 0.26)));
    spots = max(spots, pip(uv, vec2(0.28, 0.5)));
    spots = max(spots, pip(uv, vec2(0.28, 0.74)));
    spots = max(spots, pip(uv, vec2(0.72, 0.26)));
    spots = max(spots, pip(uv, vec2(0.72, 0.5)));
    spots = max(spots, pip(uv, vec2(0.72, 0.74)));
  }
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  vec3 cream = vec3(0.953, 0.918, 0.847);
  vec3 ink = vec3(0.09, 0.06, 0.05);
  vec3 col = mix(cream, ink, clamp(spots, 0.0, 1.0));
  col *= smoothstep(0.0, 0.08, edge);
  vec3 n = normalize(vN);
  float lambert = clamp(dot(n, normalize(vec3(0.35, 0.85, 0.4))), 0.0, 1.0);
  float fill = clamp(dot(n, normalize(vec3(-0.5, 0.1, -0.3))), 0.0, 1.0);
  col *= 0.38 + lambert * 0.72 + fill * 0.12;
  float spec = pow(clamp(dot(n, normalize(vec3(0.2, 0.6, 0.75))), 0.0, 1.0), 28.0);
  col += vec3(1.0, 0.94, 0.82) * spec * 0.28;
  frag = vec4(col, 1.0);
}
`;
function cubeGeometry() {
	const faces = [
		{
			n: [
				0,
				1,
				0
			],
			u: [
				1,
				0,
				0
			],
			v: [
				0,
				0,
				-1
			],
			value: 1
		},
		{
			n: [
				0,
				-1,
				0
			],
			u: [
				1,
				0,
				0
			],
			v: [
				0,
				0,
				1
			],
			value: 6
		},
		{
			n: [
				1,
				0,
				0
			],
			u: [
				0,
				0,
				-1
			],
			v: [
				0,
				1,
				0
			],
			value: 3
		},
		{
			n: [
				-1,
				0,
				0
			],
			u: [
				0,
				0,
				1
			],
			v: [
				0,
				1,
				0
			],
			value: 4
		},
		{
			n: [
				0,
				0,
				1
			],
			u: [
				1,
				0,
				0
			],
			v: [
				0,
				1,
				0
			],
			value: 2
		},
		{
			n: [
				0,
				0,
				-1
			],
			u: [
				-1,
				0,
				0
			],
			v: [
				0,
				1,
				0
			],
			value: 5
		}
	];
	const data = [];
	const push = (pos, n, uv, value) => {
		data.push(pos[0] ?? 0, pos[1] ?? 0, pos[2] ?? 0, n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, uv[0] ?? 0, uv[1] ?? 0, value);
	};
	for (const face of faces) {
		const c = face.n.map((n) => n * .5);
		const corner = (su, sv) => [
			(c[0] ?? 0) + (face.u[0] ?? 0) * .5 * su + (face.v[0] ?? 0) * .5 * sv,
			(c[1] ?? 0) + (face.u[1] ?? 0) * .5 * su + (face.v[1] ?? 0) * .5 * sv,
			(c[2] ?? 0) + (face.u[2] ?? 0) * .5 * su + (face.v[2] ?? 0) * .5 * sv
		];
		const quad = [
			{
				p: corner(-1, -1),
				uv: [0, 0]
			},
			{
				p: corner(1, -1),
				uv: [1, 0]
			},
			{
				p: corner(1, 1),
				uv: [1, 1]
			},
			{
				p: corner(-1, 1),
				uv: [0, 1]
			}
		];
		for (const i of [
			0,
			1,
			2,
			0,
			2,
			3
		]) {
			const vert = quad[i];
			if (vert) push(vert.p, face.n, vert.uv, face.value);
		}
	}
	return new Float32Array(data);
}
var FACE_UP = {
	1: ID_Q,
	6: axisQ(1, 0, 0, Math.PI),
	2: axisQ(1, 0, 0, -Math.PI / 2),
	5: axisQ(1, 0, 0, Math.PI / 2),
	3: axisQ(0, 0, 1, -Math.PI / 2),
	4: axisQ(0, 0, 1, Math.PI / 2)
};
function compile$2(gl, type, source) {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}
function DiceGL({ token, left, right, onSettled }) {
	const ref = (0, import_react.useRef)(null);
	const done = (0, import_react.useRef)(0);
	const onSettledRef = (0, import_react.useRef)(onSettled);
	onSettledRef.current = onSettled;
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const gl = canvas.getContext("webgl2", {
			alpha: true,
			antialias: true,
			premultipliedAlpha: false
		});
		if (!gl) {
			if (token > 0 && done.current !== token) {
				done.current = token;
				onSettledRef.current();
			}
			return;
		}
		const vs = compile$2(gl, gl.VERTEX_SHADER, VERT$2);
		const fs = compile$2(gl, gl.FRAGMENT_SHADER, FRAG$2);
		if (!vs || !fs) return;
		const program = gl.createProgram();
		if (!program) return;
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, cubeGeometry(), gl.STATIC_DRAW);
		const uMvp = gl.getUniformLocation(program, "uMvp");
		const uModel = gl.getUniformLocation(program, "uModel");
		const stride = 36;
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const values = [left, right];
		const targets = values.map((value) => FACE_UP[value] ?? ID_Q);
		const axes = [[
			.35,
			1,
			.2
		], [
			-.25,
			.9,
			.45
		]];
		const yaw = [axisQ(0, 1, 0, Math.random() * Math.PI), axisQ(0, 1, 0, Math.random() * Math.PI)];
		let frame = 0;
		let dead = false;
		const started = performance.now();
		const duration = token === 0 || reduce ? 0 : 1500;
		const draw = (now) => {
			if (dead) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
			const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
			}
			gl.viewport(0, 0, w, h);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			const vp = mul4(perspective(.62, w / Math.max(1, h), .1, 30), lookAt([
				0,
				2.35,
				3.7
			], [
				0,
				.25,
				0
			], [
				0,
				1,
				0
			]));
			const t = duration === 0 ? 1 : Math.min(1, (now - started) / duration);
			const tumble = t < .68 ? t / .68 : 1;
			const settle = t < .68 ? 0 : (t - .68) / .32;
			gl.useProgram(program);
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(0);
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
			gl.enableVertexAttribArray(1);
			gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
			gl.enableVertexAttribArray(2);
			gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 24);
			gl.enableVertexAttribArray(3);
			gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 32);
			values.forEach((_, i) => {
				const axis = axes[i] ?? [
					0,
					1,
					0
				];
				const spin = qmul(axisQ(axis[0], axis[1], axis[2], tumble * 14), yaw[i] ?? ID_Q);
				const upright = qnorm(qmul(yaw[i] ?? ID_Q, targets[i] ?? ID_Q));
				const pose = settle === 0 ? spin : slerp(qnorm(spin), upright, settle * settle);
				const model = modelMatrix(t >= 1 ? upright : pose, i === 0 ? -1.15 : 1.15, .25 + Math.sin(tumble * Math.PI) * .45 * (1 - settle), 0, 1.15);
				gl.uniformMatrix4fv(uModel, false, model);
				gl.uniformMatrix4fv(uMvp, false, mul4(vp, model));
				gl.drawArrays(gl.TRIANGLES, 0, 36);
			});
			if (t < 1) frame = requestAnimationFrame(draw);
			else if (token > 0 && done.current !== token) {
				done.current = token;
				onSettledRef.current();
			}
		};
		frame = requestAnimationFrame(draw);
		return () => {
			dead = true;
			cancelAnimationFrame(frame);
			gl.deleteProgram(program);
			gl.deleteShader(vs);
			gl.deleteShader(fs);
			gl.deleteBuffer(buffer);
		};
	}, [
		token,
		left,
		right
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		className: "h-64 w-full sm:h-72",
		"aria-hidden": true
	});
}
var STAKES$4 = [
	25,
	50,
	100,
	250
];
function Craps() {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const settle = useCasino((s) => s.settle);
	const [stake, setStake] = (0, import_react.useState)(25);
	const [side, setSide] = (0, import_react.useState)("pass");
	const [phase, setPhase] = (0, import_react.useState)("comeout");
	const [point, setPoint] = (0, import_react.useState)(null);
	const [left, setLeft] = (0, import_react.useState)(1);
	const [right, setRight] = (0, import_react.useState)(1);
	const [token, setToken] = (0, import_react.useState)(0);
	const [rolling, setRolling] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)("Pass or don't pass. Come-out roll.");
	const [net, setNet] = (0, import_react.useState)(null);
	const pending = (0, import_react.useRef)(null);
	const locked = phase === "point" || rolling;
	const canRoll = !rolling && bank >= stake;
	function roll() {
		if (!canRoll) return;
		const dice = rollDice();
		pending.current = {
			dice,
			side,
			stake,
			phase,
			point
		};
		setLeft(dice[0]);
		setRight(dice[1]);
		setNet(null);
		setNote("Dice are out.");
		setRolling(true);
		setToken((value) => value + 1);
		playCue("spin", sound);
	}
	function landed() {
		const job = pending.current;
		if (!job) return;
		pending.current = null;
		const outcome = resolveCraps(job.phase, job.point, job.dice, job.side, job.stake);
		setPhase(outcome.phase);
		setPoint(outcome.point);
		setNote(outcome.note);
		setRolling(false);
		playCue("dice", sound);
		if (outcome.net !== null) {
			setNet(outcome.net);
			settle(outcome.net, "craps", outcome.note);
			playCue(outcome.net > 0 ? "win" : outcome.net < 0 ? "lose" : "chip", sound);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "The Rail",
			eyebrow: "Craps · pass line"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sr-only",
			"aria-live": "polite",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "felt-well overflow-hidden rounded-xl border border-line bg-felt-deep",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiceGL, {
				token,
				left,
				right,
				onSettled: landed
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-3 px-4 pb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-widest text-cream uppercase",
						children: point === null ? "Come-out" : `Point ${point}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl text-cream italic",
						children: note
					}),
					net !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: `text-sm tabular-nums ${net > 0 ? "win-note text-gold" : "text-cream-dim"}`,
						children: [net > 0 ? "+" : "", chips(net)]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-4xl text-gold tabular-nums",
					children: token === 0 ? "—" : left + right
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid grid-cols-2 gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
				active: side === "pass",
				disabled: locked,
				onClick: () => setSide("pass"),
				children: "Pass"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
				active: side === "dont",
				disabled: locked,
				onClick: () => setSide("dont"),
				children: "Don't pass"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 flex flex-wrap gap-2",
			children: STAKES$4.map((amount) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: locked || bank < amount,
				onClick: () => {
					setStake(amount);
					playCue("chip", sound);
				},
				className: `press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				children: chips(amount)
			}, amount))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: roll,
			disabled: !canRoll,
			className: "press mt-3 min-h-12 w-full rounded-xl bg-gold font-medium text-ink disabled:opacity-40",
			children: rolling ? "Rolling" : phase === "point" ? `Roll the point · ${chips(stake)}` : `Roll ${chips(stake)}`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm leading-relaxed text-cream-dim",
			children: "Come-out: 7 and 11 win the pass line. 2, 3, and 12 lose it. Twelve is a push on don't pass. After a point, the pass line wants that number before a seven."
		})
	] });
}
function Choice({ children, active, disabled, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		disabled,
		onClick,
		className: `press min-h-12 rounded-xl border font-medium disabled:opacity-40 ${active ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
		"aria-pressed": active,
		children
	});
}
var WHITES = [
	0,
	1,
	2,
	3,
	4,
	5,
	6
];
var BLACKS = [
	{
		key: 7,
		left: "10%"
	},
	{
		key: 8,
		left: "24%"
	},
	{
		key: 9,
		left: "52%"
	},
	{
		key: 10,
		left: "66%"
	},
	{
		key: 11,
		left: "80%"
	}
];
function Pianist({ place = "side" }) {
	const [lit, setLit] = (0, import_react.useState)([]);
	const timer = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		const onPlay = (event) => {
			const keys = event.detail?.keys ?? [];
			setLit(keys);
			window.clearTimeout(timer.current);
			timer.current = window.setTimeout(() => setLit([]), 620);
		};
		window.addEventListener("gilt-piano", onPlay);
		return () => {
			window.removeEventListener("gilt-piano", onPlay);
			window.clearTimeout(timer.current);
		};
	}, []);
	const whites = lit.filter((key) => key < 7);
	const hand = `${8 + (whites.length ? whites.reduce((sum, key) => sum + key, 0) / whites.length : 3) * 11}%`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: place === "side" ? "pointer-events-none fixed top-24 left-3 z-20 hidden w-52 min-[1180px]:block" : "pointer-events-none relative z-20 mb-4 w-full min-[1180px]:hidden",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "piano-rail flex items-end gap-2 rounded-2xl border border-line bg-ink-2/95 px-2.5 pt-2 pb-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 72 96",
				className: "pianist-sway h-20 w-14 shrink-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "12",
						y: "80",
						width: "40",
						height: "5",
						rx: "1.5",
						fill: "var(--color-oxblood)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M20 84v8M44 82v10",
						stroke: "var(--color-ink)",
						strokeWidth: "3",
						strokeLinecap: "round"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M22 48c-1 12 0 26 4 34h24c3-10 1-24-2-34-6 5-16 6-26 0z",
						fill: "var(--color-ink)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M34 50l5 18h-10z",
						fill: "var(--color-cream)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M31 52h8",
						stroke: "var(--color-gold)",
						strokeWidth: "1.6",
						strokeLinecap: "round"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M28 52l-4 2M42 52l4 2",
						stroke: "var(--color-gold)",
						strokeWidth: "1.4",
						strokeLinecap: "round"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
						className: "pianist-arm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M40 54c12 2 22 10 28 20",
							fill: "none",
							stroke: "var(--color-ink)",
							strokeWidth: "4.5",
							strokeLinecap: "round"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "68",
							cy: "74",
							r: "3",
							fill: "var(--color-cream)"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "36",
						cy: "32",
						r: "12",
						fill: "var(--color-cream-dim)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M24 34c1-16 24-16 24 2-2-10-22-12-24-2z",
						fill: "var(--color-ink)"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1 pb-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-1 text-xs tracking-widest text-cream-dim uppercase",
					children: "House piano"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative h-12 rounded-md bg-ink px-1 pt-1.5 pb-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pianist-hands absolute top-0 z-10 flex gap-2",
							style: { left: hand },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-cream" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-cream-dim" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-full gap-px",
							children: WHITES.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-full flex-1 rounded-sm transition-colors duration-300 ease-out ${lit.includes(key) ? "bg-gold" : "bg-cream"}` }, key))
						}),
						BLACKS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `absolute top-1.5 h-6 w-2.5 -translate-x-1/2 rounded-sm transition-colors duration-300 ease-out ${lit.includes(key.key) ? "bg-gold" : "bg-ink"}`,
							style: { left: key.left }
						}, key.key))
					]
				})]
			})]
		})
	});
}
var TABLES = [
	{
		id: "blackjack",
		name: "The Shoe",
		kicker: "From 50",
		copy: "Six decks. Dealer stands on every seventeen. A natural pays three to two.",
		icon: Spade
	},
	{
		id: "roulette",
		name: "The Wheel",
		kicker: "Single zero",
		copy: "European wheel, lit in the room. Inside numbers pay thirty-five to one.",
		icon: Dices
	},
	{
		id: "craps",
		name: "The Rail",
		kicker: "Pass line",
		copy: "Two dice. Seven and eleven on the come-out. A point, then the long way home.",
		icon: Dice5
	},
	{
		id: "baccarat",
		name: "The Salon",
		kicker: "Punto banco",
		copy: "Player, banker, or the tie. Totals modulo ten. Banker pays nineteen to twenty.",
		icon: Club
	},
	{
		id: "poker",
		name: "The Draw",
		kicker: "Jacks or better",
		copy: "Five cards. Hold the ones you trust. A royal pays eight hundred to one.",
		icon: Diamond
	},
	{
		id: "slots",
		name: "Vesper Reels",
		kicker: "Three lines",
		copy: "Left to right. Sevens are rare and rude when they line up. A thin house edge.",
		icon: Cherry
	},
	{
		id: "afterhours",
		name: "After Hours",
		kicker: "One line",
		copy: "Three windows. The first two reels have to agree. A gem across pays fifty-six.",
		icon: Gem
	},
	{
		id: "keno",
		name: "The Cage",
		kicker: "Keno",
		copy: "Mark two to six spots. Ten numbers leave the cage. Catch them and the ticket pays.",
		icon: Grid3x3
	},
	{
		id: "sports",
		name: "The Wire",
		kicker: "Live prices",
		copy: "NFL, MLB, NBA, and NHL. The posted number, locked in chips. No cash, no cash-out.",
		icon: Radio
	},
	{
		id: "workshop",
		name: "The Pit",
		kicker: "Workshop",
		copy: "The decisions that actually matter. Shoe, rail, cage, draw, and how to read a price.",
		icon: BookOpen
	},
	{
		id: "agents",
		name: "The Agents",
		kicker: "3D · VR",
		copy: "Simulated soccer, baseball, and football. Bet the card. Drag the field, or step into it with a headset.",
		icon: Bot
	}
];
function gameLabel(game) {
	if (game === "blackjack") return "Shoe";
	if (game === "roulette") return "Wheel";
	if (game === "slots") return "Reels";
	if (game === "craps") return "Rail";
	if (game === "baccarat") return "Salon";
	if (game === "poker") return "Draw";
	if (game === "keno") return "Cage";
	if (game === "afterhours") return "Hours";
	if (game === "sports") return "Wire";
	if (game === "pit") return "Pit";
	if (game === "agents") return "Agents";
	return "House";
}
function Floor() {
	const setView = useCasino((s) => s.setView);
	const ledger = useCasino((s) => s.ledger);
	const resetPurse = useCasino((s) => s.resetPurse);
	const net = ledger.reduce((sum, row) => sum + row.delta, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "Gilt House",
			eyebrow: "Las Vegas · chips only"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-xl text-base leading-relaxed text-cream-dim",
			children: "The wire is live. The agent field runs soccer, baseball, and football in 3D. Chips stay in this browser and cannot be cashed."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pianist, { place: "bar" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bartender, { place: "bar" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "stagger mt-6 grid gap-3 sm:grid-cols-2",
			children: TABLES.map((table) => {
				const Icon = table.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setView(table.id),
					className: "press table-card rise rounded-xl border border-line p-5 text-left hover:border-gold",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-5 text-gold",
								"aria-hidden": true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs tracking-widest text-cream-dim uppercase",
								children: table.kicker
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-5 font-display text-3xl text-cream italic",
							children: table.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-lg text-sm leading-relaxed text-cream-dim",
							children: table.copy
						})
					]
				}, table.id);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-8",
			"aria-label": "Recent hands",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl text-cream italic",
					children: "The book"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-cream-dim tabular-nums",
					children: [
						"Session ",
						net > 0 ? "+" : "",
						chips(net)
					]
				})]
			}), ledger.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl border border-line bg-ink-2 px-4 py-4 text-sm text-cream-dim",
				children: "No hands yet. The felt is open."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-line overflow-hidden rounded-xl border border-line bg-ink-2",
				children: ledger.slice(0, 6).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-baseline justify-between gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-widest text-gold uppercase",
							children: gameLabel(row.game)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm text-cream-dim",
							children: row.note
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: `shrink-0 font-medium tabular-nums ${row.delta >= 0 ? "text-gold" : "text-cream"}`,
						children: [row.delta > 0 ? "+" : "", chips(row.delta)]
					})]
				}, row.id))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
			className: "mt-8 flex flex-col gap-3 border-t border-line pt-5 text-sm text-cream-dim",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "A supper club, not a cashier. Entertainment only. You should be 18 or older. Chips have no cash value." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: resetPurse,
				className: "press self-start text-sm text-gold underline-offset-4 hover:underline",
				children: ["Reset purse to ", chips(OPENING_BANK)]
			})]
		})
	] });
}
var VERT$1 = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;
var FRAG$1 = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
out vec4 frag;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= uRes.x / max(uRes.y, 1.0);

  vec3 ink = vec3(0.043, 0.031, 0.027);
  vec3 velvet = vec3(0.45, 0.09, 0.15);
  vec3 gold = vec3(0.90, 0.76, 0.42);
  vec3 felt = vec3(0.06, 0.22, 0.18);
  vec3 wood = vec3(0.28, 0.14, 0.07);
  vec3 col = ink;

  float pool = exp(-dot(p * vec2(0.48, 0.72), p * vec2(0.48, 0.72)));
  col = mix(col, felt * 0.85 + ink, pool * 0.5);

  float fold = 0.55 + 0.45 * sin(p.y * 22.0 + sin(p.y * 3.0));
  float sheen = pow(fold, 2.4);
  vec3 curtain = mix(velvet * 0.42, velvet, 0.4 + sheen * 0.6);
  curtain += gold * sheen * 0.12;
  float curtainL = smoothstep(-0.22, -0.62, p.x);
  float curtainR = smoothstep(0.22, 0.62, p.x);
  col = mix(col, curtain, clamp(curtainL + curtainR, 0.0, 1.0));

  float ropeL = smoothstep(0.018, 0.0, abs(p.x + 0.48));
  float ropeR = smoothstep(0.018, 0.0, abs(p.x - 0.48));
  float ropeH = smoothstep(-0.95, -0.2, p.y) * smoothstep(0.98, 0.7, p.y);
  col = mix(col, gold, (ropeL + ropeR) * ropeH);

  float floorMask = smoothstep(0.08, -0.35, p.y);
  float plank = step(0.5, fract(p.x * 7.0 + step(0.5, fract(p.y * 5.0)) * 0.5));
  float grain = hash(floor(vec2(p.x * 40.0, p.y * 24.0)));
  vec3 boards = mix(wood * 0.72, wood, plank);
  boards += gold * grain * 0.04;
  col = mix(col, boards, floorMask);

  float chain = smoothstep(0.012, 0.0, abs(p.x)) * smoothstep(0.62, 0.98, p.y);
  col = mix(col, gold * 0.7, chain);

  vec2 hub = p - vec2(0.0, 0.72);
  col += gold * exp(-dot(hub, hub) * 6.5) * (0.45 + 0.08 * sin(uTime * 2.1));

  col += gold * exp(-dot(p - vec2(-0.22, 0.58), p - vec2(-0.22, 0.58)) * 70.0);
  col += gold * exp(-dot(p - vec2(0.22, 0.58), p - vec2(0.22, 0.58)) * 70.0);
  col += gold * exp(-dot(p - vec2(-0.11, 0.52), p - vec2(-0.11, 0.52)) * 90.0) * 0.8;
  col += gold * exp(-dot(p - vec2(0.11, 0.52), p - vec2(0.11, 0.52)) * 90.0) * 0.8;
  col += vec3(1.0, 0.95, 0.8) * exp(-dot(p - vec2(0.0, 0.66), p - vec2(0.0, 0.66)) * 140.0);

  float marquee = smoothstep(0.012, 0.0, abs(p.y - 0.9)) * smoothstep(0.85, 0.25, abs(p.x));
  float flicker = 0.82 + 0.18 * sin(uTime * 7.5) * sin(uTime * 2.2);
  col += gold * marquee * flicker;

  vec2 smokeP = p * vec2(1.15, 0.85);
  smokeP.y -= uTime * 0.03;
  float smoke = sin(smokeP.x * 2.2 + sin(smokeP.y * 1.6 + uTime * 0.18));
  smoke += sin(smokeP.x * 3.8 - smokeP.y * 1.9 + uTime * 0.12);
  smoke = smoke * 0.25 + 0.5;
  float haze = smoothstep(-0.35, 0.9, p.y) * smoke;
  col = mix(col, gold * 0.28 + ink, haze * 0.16);
  vec2 pianoLamp = p - vec2(-0.95, -0.78);
  col += gold * exp(-dot(pianoLamp, pianoLamp) * 1.8) * 0.42;

  vec2 drift = vec2(uTime * 0.02, uTime * 0.03);
  float dust = smoothstep(0.992, 1.0, hash(floor(gl_FragCoord.xy * 0.04 + drift)));
  dust += smoothstep(0.996, 1.0, hash(floor(gl_FragCoord.xy * 0.07 - drift.yx)));
  col += gold * dust * 0.65;

  float vig = smoothstep(1.45, 0.35, length(p * vec2(0.78, 1.0)));
  col *= mix(0.55, 1.0, vig);
  frag = vec4(col, 1.0);
}
`;
function compile$1(gl, type, source) {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}
function RoomGL() {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const gl = canvas.getContext("webgl2", {
			alpha: false,
			antialias: false,
			powerPreference: "low-power"
		});
		if (!gl) return;
		const vs = compile$1(gl, gl.VERTEX_SHADER, VERT$1);
		const fs = compile$1(gl, gl.FRAGMENT_SHADER, FRAG$1);
		if (!vs || !fs) return;
		const program = gl.createProgram();
		if (!program) return;
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.bindAttribLocation(program, 0, "aPos");
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			-1,
			-1,
			3,
			-1,
			-1,
			3
		]), gl.STATIC_DRAW);
		const uRes = gl.getUniformLocation(program, "uRes");
		const uTime = gl.getUniformLocation(program, "uTime");
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let frame = 0;
		let running = true;
		const started = performance.now();
		const draw = (now) => {
			if (!running) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
			const w = Math.max(1, Math.floor(window.innerWidth * dpr));
			const h = Math.max(1, Math.floor(window.innerHeight * dpr));
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
			}
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(program);
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(0);
			gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
			gl.uniform2f(uRes, canvas.width, canvas.height);
			gl.uniform1f(uTime, reduce ? 0 : (now - started) / 1e3);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			if (!reduce && document.visibilityState === "visible") frame = requestAnimationFrame(draw);
		};
		frame = requestAnimationFrame(draw);
		const onVis = () => {
			if (document.visibilityState === "visible" && !reduce) frame = requestAnimationFrame(draw);
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			running = false;
			cancelAnimationFrame(frame);
			document.removeEventListener("visibilitychange", onVis);
			gl.deleteProgram(program);
			gl.deleteShader(vs);
			gl.deleteShader(fs);
			gl.deleteBuffer(buffer);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		className: "pointer-events-none fixed inset-0 z-0 h-full w-full",
		"aria-hidden": true
	});
}
function makePuffs() {
	return Array.from({ length: 28 }, (_, index) => ({
		x: Math.random(),
		y: Math.random(),
		r: 28 + Math.random() * 70,
		speed: .012 + Math.random() * .02,
		seed: index * 1.7,
		alpha: .035 + Math.random() * .06
	}));
}
function Smoke() {
	const canvasRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const gl = canvas.getContext("2d");
		if (!gl) return;
		const puffs = makePuffs();
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let raf = 0;
		let alive = true;
		const paint = (time) => {
			const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
			const width = window.innerWidth;
			const height = window.innerHeight;
			if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
				canvas.width = Math.floor(width * dpr);
				canvas.height = Math.floor(height * dpr);
			}
			gl.setTransform(dpr, 0, 0, dpr, 0, 0);
			gl.clearRect(0, 0, width, height);
			for (const puff of puffs) {
				if (!reduce) {
					puff.y -= puff.speed * .016;
					if (puff.y < -.12) puff.y = 1.08;
				}
				const drift = osc(time, .35 + puff.seed * .01, puff.seed) * 36;
				const x = puff.x * width + drift;
				const y = puff.y * height;
				const fade = gl.createRadialGradient(x, y, 0, x, y, puff.r);
				fade.addColorStop(0, `rgba(247, 237, 214, ${puff.alpha})`);
				fade.addColorStop(.45, `rgba(230, 195, 106, ${puff.alpha * .45})`);
				fade.addColorStop(1, "rgba(247, 237, 214, 0)");
				gl.fillStyle = fade;
				gl.beginPath();
				gl.arc(x, y, puff.r, 0, Math.PI * 2);
				gl.fill();
			}
		};
		const loop = (now) => {
			if (!alive) return;
			paint(now / 1e3);
			if (!reduce) raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => {
			alive = false;
			cancelAnimationFrame(raf);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "pointer-events-none fixed inset-0 z-[1] h-full w-full",
		"aria-hidden": true
	});
}
var KENO_PAY = {
	2: { 2: 16 },
	3: {
		2: 4,
		3: 32
	},
	4: {
		2: 2,
		3: 8,
		4: 80
	},
	5: {
		3: 7,
		4: 30,
		5: 200
	},
	6: {
		3: 4,
		4: 14,
		5: 40,
		6: 250
	}
};
function drawKeno(picks) {
	const pool = Array.from({ length: 40 }, (_, index) => index + 1);
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const swap = pool[i] ?? 1;
		pool[i] = pool[j] ?? swap;
		pool[j] = swap;
	}
	const drawn = pool.slice(0, 10);
	const hitList = picks.filter((spot) => drawn.includes(spot));
	const mult = KENO_PAY[picks.length]?.[hitList.length] ?? 0;
	return {
		drawn,
		hits: hitList.length,
		mult
	};
}
var STAKES$3 = [
	25,
	50,
	100,
	250
];
var SPOTS = Array.from({ length: 40 }, (_, index) => index + 1);
function Keno() {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const settle = useCasino((s) => s.settle);
	const [stake, setStake] = (0, import_react.useState)(25);
	const [picks, setPicks] = (0, import_react.useState)([]);
	const [drawn, setDrawn] = (0, import_react.useState)([]);
	const [seen, setSeen] = (0, import_react.useState)(0);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)("Pick two to six spots. Ten numbers come out of the cage.");
	const [net, setNet] = (0, import_react.useState)(null);
	const token = (0, import_react.useRef)(0);
	const frame = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		return () => {
			token.current += 1;
			cancelAnimationFrame(frame.current);
		};
	}, []);
	function toggle(spot) {
		if (busy) return;
		setDrawn([]);
		setSeen(0);
		setNet(null);
		setPicks((current) => {
			if (current.includes(spot)) return current.filter((value) => value !== spot);
			if (current.length >= 6) return current;
			return [...current, spot];
		});
		playCue("chip", sound);
	}
	function play() {
		if (busy || picks.length < 2 || stake > bank) return;
		const ticket = drawKeno(picks);
		const id = token.current + 1;
		token.current = id;
		setBusy(true);
		setNet(null);
		setDrawn(ticket.drawn);
		setSeen(0);
		setNote("The cage is turning.");
		playCue("spin", sound);
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const close = () => {
			if (token.current !== id) return;
			const scored = ticket.mult * stake - stake;
			setSeen(ticket.drawn.length);
			setBusy(false);
			setNet(scored);
			setNote(ticket.hits === 0 ? "No catches. The house keeps the ticket." : `${ticket.hits} caught · ${ticket.mult}×`);
			settle(scored, "keno", ticket.hits === 0 ? "Keno miss" : `Keno ${ticket.hits} hit`);
			playCue(scored > 0 ? "win" : "lose", sound);
		};
		if (reduce) {
			close();
			return;
		}
		const started = performance.now();
		const loop = (now) => {
			if (token.current !== id) return;
			const t = Math.min(1, (now - started) / 1700);
			setSeen(smoothstep(t) * ticket.drawn.length);
			if (t < 1) frame.current = requestAnimationFrame(loop);
			else close();
		};
		frame.current = requestAnimationFrame(loop);
	}
	const visible = drawn.slice(0, Math.floor(seen));
	const pay = KENO_PAY[picks.length] ?? {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "The Cage",
			eyebrow: "Keno · ten out of forty"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sr-only",
			"aria-live": "polite",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-5 gap-1.5 sm:grid-cols-8",
			children: SPOTS.map((spot) => {
				const picked = picks.includes(spot);
				const hit = visible.includes(spot) && picked;
				const missed = visible.includes(spot) && !picked;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: busy,
					onClick: () => toggle(spot),
					className: `press min-h-11 rounded-md border text-sm font-medium tabular-nums disabled:opacity-80 ${hit ? "border-gold bg-gold text-ink" : missed ? "border-line bg-oxblood text-cream" : picked ? "border-gold bg-panel text-gold" : "border-line bg-ink-2 text-cream"}`,
					"aria-pressed": picked,
					children: spot
				}, spot);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl text-cream italic",
				children: note
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-cream-dim tabular-nums",
				children: [
					picks.length,
					" spot",
					picks.length === 1 ? "" : "s",
					net !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: net > 0 ? "win-note text-gold" : "",
						children: [
							" ",
							"· ",
							net > 0 ? "+" : "",
							chips(net)
						]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			role: "group",
			"aria-label": "Keno stake",
			children: STAKES$3.map((amount) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: busy || bank < amount,
				onClick: () => {
					setStake(amount);
					playCue("chip", sound);
				},
				className: `press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				"aria-pressed": stake === amount,
				children: chips(amount)
			}, amount))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: play,
			disabled: busy || picks.length < 2 || stake > bank,
			className: "press mt-3 min-h-12 w-full rounded-xl bg-gold text-base font-medium text-ink disabled:opacity-40",
			children: busy ? "Drawing" : `Draw ${chips(stake)}`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
			className: "mt-5 rounded-xl border border-line bg-ink-2 px-4 py-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "min-h-11 cursor-pointer text-sm font-medium text-cream",
					children: "Paytable"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-cream-dim",
					children: "Returns are times the stake. Catches below the first paying hit return nothing. Ten numbers are drawn from forty."
				}),
				picks.length >= 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-1 text-sm",
					children: Object.entries(pay).map(([hits, mult]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between border-t border-line py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-cream",
							children: [hits, " caught"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-gold tabular-nums",
							children: [mult, "×"]
						})]
					}, hits))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-cream-dim",
					children: "Mark at least two spots to see the pays."
				})
			]
		})
	] });
}
var VALUE = {
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
	K: 13
};
function scorePoker(cards) {
	const values = cards.map((card) => VALUE[card.rank]).sort((a, b) => a - b);
	const flush = cards.every((card) => card.suit === cards[0]?.suit);
	const unique = [...new Set(values)];
	const wheel = unique.length === 5 && unique.join() === "2,3,4,5,14";
	const straight = unique.length === 5 && (values[4] - values[0] === 4 || wheel);
	const counts = /* @__PURE__ */ new Map();
	for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
	const groups = [...counts.values()].sort((a, b) => b - a);
	const pairHigh = [...counts.entries()].filter(([, n]) => n === 2).map(([v]) => v);
	if (straight && flush && !wheel && values[0] === 10) return {
		name: "Royal flush",
		mult: 800
	};
	if (straight && flush) return {
		name: "Straight flush",
		mult: 50
	};
	if (groups[0] === 4) return {
		name: "Four of a kind",
		mult: 25
	};
	if (groups[0] === 3 && groups[1] === 2) return {
		name: "Full house",
		mult: 9
	};
	if (flush) return {
		name: "Flush",
		mult: 6
	};
	if (straight) return {
		name: "Straight",
		mult: 4
	};
	if (groups[0] === 3) return {
		name: "Three of a kind",
		mult: 3
	};
	if (groups[0] === 2 && groups[1] === 2) return {
		name: "Two pair",
		mult: 2
	};
	if (groups[0] === 2 && Math.max(...pairHigh) >= 11) return {
		name: "Jacks or better",
		mult: 1
	};
	return {
		name: "No pair",
		mult: 0
	};
}
function dealPoker() {
	const deck = freshShoe(1);
	return {
		deck: deck.slice(5),
		hand: deck.slice(0, 5)
	};
}
function drawPoker(deck, hand, held) {
	const next = hand.slice();
	const rest = deck.slice();
	for (let i = 0; i < 5; i++) {
		if (held[i]) continue;
		const card = rest.shift();
		if (card) next[i] = card;
	}
	return {
		deck: rest,
		hand: next
	};
}
var STAKES$2 = [
	5,
	25,
	50,
	100
];
var PAYS = [
	["Royal flush", "800×"],
	["Straight flush", "50×"],
	["Four of a kind", "25×"],
	["Full house", "9×"],
	["Flush", "6×"],
	["Straight", "4×"],
	["Three of a kind", "3×"],
	["Two pair", "2×"],
	["Jacks or better", "1×"]
];
function Poker() {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const settle = useCasino((s) => s.settle);
	const [stake, setStake] = (0, import_react.useState)(5);
	const [phase, setPhase] = (0, import_react.useState)("bet");
	const [deck, setDeck] = (0, import_react.useState)([]);
	const [hand, setHand] = (0, import_react.useState)([]);
	const [held, setHeld] = (0, import_react.useState)([
		false,
		false,
		false,
		false,
		false
	]);
	const [note, setNote] = (0, import_react.useState)("Jacks or better. Hold what you want, then draw.");
	const [net, setNet] = (0, import_react.useState)(null);
	function deal() {
		if (bank < stake || phase === "draw") return;
		const next = dealPoker();
		setDeck(next.deck);
		setHand(next.hand);
		setHeld([
			false,
			false,
			false,
			false,
			false
		]);
		setPhase("draw");
		setNet(null);
		setNote("Tap cards to hold them.");
		playCue("card", sound);
	}
	function draw() {
		if (phase !== "draw") return;
		const next = drawPoker(deck, hand, held);
		const scored = scorePoker(next.hand);
		const delta = scored.mult * stake - stake;
		setDeck(next.deck);
		setHand(next.hand);
		setPhase("done");
		setNote(scored.mult > 0 ? `${scored.name}. Pays ${scored.mult}×.` : scored.name);
		setNet(delta);
		settle(delta, "poker", scored.name);
		playCue(delta > 0 ? "win" : delta < 0 ? "lose" : "chip", sound);
	}
	function toggle(index) {
		if (phase !== "draw") return;
		setHeld((prev) => prev.map((value, i) => i === index ? !value : value));
		playCue("chip", sound);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "The Draw",
			eyebrow: "Jacks or better"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sr-only",
			"aria-live": "polite",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "felt-well rounded-xl border border-line bg-felt-deep px-2 py-4 sm:px-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center gap-1.5 sm:gap-2",
				children: hand.length === 0 ? [
					0,
					1,
					2,
					3,
					4
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
					faceDown: true,
					compact: true,
					index: i
				}, i)) : hand.map((card, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => toggle(index),
					className: `press text-left transition-transform duration-200 ${held[index] ? "-translate-y-2" : ""}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
						card,
						compact: true,
						index
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `mt-1 block text-center text-xs tracking-widest uppercase ${held[index] ? "text-gold" : "text-cream-dim"}`,
						children: held[index] ? "Hold" : phase === "draw" ? "Tap" : ""
					})]
				}, card.id))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl text-cream italic",
				children: note
			}), net !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `text-sm tabular-nums ${net > 0 ? "win-note text-gold" : "text-cream-dim"}`,
				children: [net > 0 ? "+" : "", chips(net)]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: STAKES$2.map((amount) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: phase === "draw" || bank < amount,
				onClick: () => setStake(amount),
				className: `press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				children: chips(amount)
			}, amount))
		}),
		phase === "draw" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: draw,
			className: "press mt-3 min-h-12 w-full rounded-xl bg-gold font-medium text-ink",
			children: "Draw"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: deal,
			disabled: bank < stake,
			className: "press mt-3 min-h-12 w-full rounded-xl bg-gold font-medium text-ink disabled:opacity-40",
			children: [
				phase === "done" ? "Deal again" : "Deal",
				" ",
				chips(stake)
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
			className: "mt-5 rounded-xl border border-line bg-ink-2 px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
				className: "min-h-11 cursor-pointer text-sm font-medium text-cream",
				children: "Paytable"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 divide-y divide-line",
				children: PAYS.map(([name, pay]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-baseline justify-between py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-cream",
						children: name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-gold tabular-nums",
						children: pay
					})]
				}, name))
			})]
		})
	] });
}
var WHEEL = [
	0,
	32,
	15,
	19,
	4,
	21,
	2,
	25,
	17,
	34,
	6,
	27,
	13,
	36,
	11,
	30,
	8,
	23,
	10,
	5,
	24,
	16,
	33,
	1,
	20,
	14,
	31,
	9,
	22,
	18,
	29,
	7,
	28,
	12,
	35,
	3,
	26
];
var REDS = /* @__PURE__ */ new Set([
	1,
	3,
	5,
	7,
	9,
	12,
	14,
	16,
	18,
	19,
	21,
	23,
	25,
	27,
	30,
	32,
	34,
	36
]);
function pocketTone(n) {
	if (n === 0) return "felt";
	return REDS.has(n) ? "oxblood" : "ink";
}
function pocketName(n) {
	if (n === 0) return "0";
	return `${n} ${REDS.has(n) ? "red" : "black"}`;
}
function betKey(bet) {
	switch (bet.kind) {
		case "straight": return `n:${bet.n}`;
		case "color": return `c:${bet.color}`;
		case "parity": return `p:${bet.parity}`;
		case "half": return `h:${bet.half}`;
		case "dozen": return `d:${bet.dozen}`;
		case "column": return `col:${bet.column}`;
	}
}
function betLabel(bet) {
	switch (bet.kind) {
		case "straight": return bet.n === 0 ? "0" : String(bet.n);
		case "color": return bet.color === "red" ? "Red" : "Black";
		case "parity": return bet.parity === "even" ? "Even" : "Odd";
		case "half": return bet.half === "low" ? "1–18" : "19–36";
		case "dozen": return bet.dozen === 1 ? "1st 12" : bet.dozen === 2 ? "2nd 12" : "3rd 12";
		case "column": return `Column ${bet.column}`;
	}
}
function betOdds(bet) {
	if (bet.kind === "straight") return "35:1";
	if (bet.kind === "dozen" || bet.kind === "column") return "2:1";
	return "1:1";
}
function returnMultiple(bet) {
	if (bet.kind === "straight") return 36;
	if (bet.kind === "dozen" || bet.kind === "column") return 3;
	return 2;
}
function betWins(bet, n) {
	switch (bet.kind) {
		case "straight": return bet.n === n;
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
function settleWheel(lines, n) {
	let stake = 0;
	let payout = 0;
	for (const line of lines) {
		stake += line.amount;
		if (betWins(line.bet, n)) payout += line.amount * returnMultiple(line.bet);
	}
	return {
		payout,
		stake,
		net: payout - stake
	};
}
360 / WHEEL.length;
var VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
var FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uRot;
uniform float uBallAng;
uniform float uBallRad;
uniform sampler2D uPockets;
out vec4 frag;
const float PI = 3.141592653589793;
const float SLICE = 6.283185307179586 / 37.0;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) {
    frag = vec4(0.0);
    return;
  }
  float ang = atan(p.x, p.y);
  float local = mod(ang - uRot + PI * 4.0, PI * 2.0);
  int idx = clamp(int(floor(local / SLICE)), 0, 36);
  vec3 pocket = texelFetch(uPockets, ivec2(idx, 0), 0).rgb;
  vec2 n2 = r > 0.001 ? p / r : vec2(0.0, 1.0);
  float light = clamp(dot(n2, normalize(vec2(-0.35, 0.85))), 0.0, 1.0);
  vec3 col = pocket * (0.62 + 0.5 * light);
  float along = abs(fract(local / SLICE) - 0.5);
  float seam = smoothstep(0.455, 0.498, along);
  vec3 gold = vec3(0.831, 0.659, 0.325);
  float rim = smoothstep(0.885, 0.915, r) * (1.0 - smoothstep(0.975, 0.998, r));
  float inlay = smoothstep(0.40, 0.43, r) * (1.0 - smoothstep(0.455, 0.49, r));
  col = mix(col, gold * (0.65 + 0.55 * light), clamp(rim + inlay, 0.0, 1.0));
  col = mix(col, gold * 0.9, seam * step(0.49, r) * step(r, 0.90));
  if (r < 0.40) {
    vec3 hub = vec3(0.07, 0.05, 0.04);
    col = mix(hub, gold, smoothstep(0.33, 0.38, r));
  }
  float groove = smoothstep(0.70, 0.73, r) * (1.0 - smoothstep(0.78, 0.81, r));
  col *= 1.0 - groove * 0.18;
  vec2 ball = vec2(sin(uBallAng), cos(uBallAng)) * uBallRad;
  float bd = length(p - ball);
  if (bd < 0.058) {
    float z = sqrt(max(0.0, 1.0 - pow(bd / 0.058, 2.0)));
    vec3 bn = normalize(vec3((p - ball) / 0.058, z));
    float bl = clamp(dot(bn, normalize(vec3(-0.35, 0.55, 0.76))), 0.0, 1.0);
    vec3 ivory = vec3(0.953, 0.918, 0.847);
    col = ivory * (0.28 + bl);
    col += vec3(1.0) * pow(bl, 18.0) * 0.65;
  }
  col *= smoothstep(1.0, 0.94, r);
  frag = vec4(col, 1.0);
}
`;
var TAU = Math.PI * 2;
var SLICE = TAU / 37;
function compile(gl, type, source) {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}
function drawNumbers(ctx, width, rot) {
	ctx.clearRect(0, 0, width, width);
	const cx = width / 2;
	const radius = width * .34;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "#f3ead8";
	ctx.font = `600 ${Math.max(10, Math.round(width * .042))}px Fraunces, Palatino, serif`;
	for (let i = 0; i < WHEEL.length; i++) {
		const ang = rot + (i + .5) * SLICE;
		const x = cx + Math.sin(ang) * radius;
		const y = cx - Math.cos(ang) * radius;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(ang);
		ctx.fillText(String(WHEEL[i]), 0, 0);
		ctx.restore();
	}
}
function WheelGL({ token, pocketIndex, onSettled }) {
	const glRef = (0, import_react.useRef)(null);
	const numRef = (0, import_react.useRef)(null);
	const settled = (0, import_react.useRef)(0);
	const onSettledRef = (0, import_react.useRef)(onSettled);
	onSettledRef.current = onSettled;
	(0, import_react.useEffect)(() => {
		const canvas = glRef.current;
		const numbers = numRef.current;
		if (!canvas || !numbers) return;
		const gl = canvas.getContext("webgl2", {
			alpha: true,
			antialias: true,
			premultipliedAlpha: false
		});
		const ctx = numbers.getContext("2d");
		if (!gl || !ctx) return;
		const vs = compile(gl, gl.VERTEX_SHADER, VERT);
		const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
		if (!vs || !fs) return;
		const program = gl.createProgram();
		if (!program) return;
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			-1,
			-1,
			1,
			-1,
			-1,
			1,
			-1,
			1,
			1,
			-1,
			1,
			1
		]), gl.STATIC_DRAW);
		const pixels = /* @__PURE__ */ new Uint8Array(148);
		WHEEL.forEach((n, i) => {
			const color = n === 0 ? [
				18,
				66,
				55
			] : REDS.has(n) ? [
				138,
				42,
				56
			] : [
				28,
				21,
				17
			];
			pixels[i * 4] = color[0] ?? 0;
			pixels[i * 4 + 1] = color[1] ?? 0;
			pixels[i * 4 + 2] = color[2] ?? 0;
			pixels[i * 4 + 3] = 255;
		});
		const tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 37, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		const uRot = gl.getUniformLocation(program, "uRot");
		const uBallAng = gl.getUniformLocation(program, "uBallAng");
		const uBallRad = gl.getUniformLocation(program, "uBallRad");
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let frame = 0;
		let dead = false;
		const paint = (rot, ballAng, ballRad) => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const size = Math.max(1, Math.floor(canvas.clientWidth * dpr));
			if (canvas.width !== size) {
				canvas.width = size;
				canvas.height = size;
				numbers.width = size;
				numbers.height = size;
			}
			gl.viewport(0, 0, size, size);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.useProgram(program);
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(0);
			gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.uniform1i(gl.getUniformLocation(program, "uPockets"), 0);
			gl.uniform1f(uRot, rot);
			gl.uniform1f(uBallAng, ballAng);
			gl.uniform1f(uBallRad, ballRad);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
			drawNumbers(ctx, size, rot);
		};
		const finalRot = -((pocketIndex + .5) * SLICE);
		if (token === 0 || settled.current === token) {
			paint(finalRot, 0, .7);
			return () => {
				dead = true;
				gl.deleteProgram(program);
				gl.deleteShader(vs);
				gl.deleteShader(fs);
				gl.deleteBuffer(buffer);
				gl.deleteTexture(tex);
			};
		}
		const duration = reduce ? 0 : 4300;
		const started = performance.now();
		const from = finalRot - TAU * 6;
		const ballFrom = Math.random() * TAU;
		const loop = (now) => {
			if (dead) return;
			const t = duration === 0 ? 1 : Math.min(1, (now - started) / duration);
			const e = 1 - (1 - t) ** 3;
			const rot = from + (finalRot - from) * e;
			const ballAng = ballFrom + (TAU * 8 - ballFrom) * e;
			const ballRad = .86 + (.7 - .86) * (t < .62 ? 0 : (t - .62) / .38);
			paint(rot, ballAng, ballRad);
			if (t < 1) frame = requestAnimationFrame(loop);
			else if (settled.current !== token) {
				settled.current = token;
				onSettledRef.current();
			}
		};
		frame = requestAnimationFrame(loop);
		return () => {
			dead = true;
			cancelAnimationFrame(frame);
			gl.deleteProgram(program);
			gl.deleteShader(vs);
			gl.deleteShader(fs);
			gl.deleteBuffer(buffer);
			gl.deleteTexture(tex);
		};
	}, [token, pocketIndex]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "wheel-bezel relative mx-auto size-64 overflow-hidden rounded-full border-4 border-gold bg-ink sm:size-80",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: glRef,
				className: "absolute inset-0 h-full w-full",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: numRef,
				className: "pointer-events-none absolute inset-0 h-full w-full",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-0 left-1/2 z-10 -translate-x-1/2",
				"aria-hidden": true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-x-8 border-t-8 border-x-transparent border-t-gold" })
			})
		]
	});
}
var DENOMS = [
	5,
	25,
	100,
	500
];
var TONE = {
	felt: "bg-felt text-cream",
	oxblood: "bg-oxblood text-cream",
	ink: "bg-ink text-cream border border-line"
};
function Roulette() {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const settle = useCasino((s) => s.settle);
	const [denom, setDenom] = (0, import_react.useState)(25);
	const [slip, setSlip] = (0, import_react.useState)([]);
	const [spinning, setSpinning] = (0, import_react.useState)(false);
	const [token, setToken] = (0, import_react.useState)(0);
	const [aim, setAim] = (0, import_react.useState)(0);
	const [landed, setLanded] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)("Choose a chip, then touch the layout.");
	const [net, setNet] = (0, import_react.useState)(null);
	const [history, setHistory] = (0, import_react.useState)([]);
	const pending = (0, import_react.useRef)(null);
	const lines = (0, import_react.useMemo)(() => aggregate(slip), [slip]);
	const stake = lines.reduce((sum, line) => sum + line.amount, 0);
	const covered = new Map(lines.map((line) => [betKey(line.bet), line.amount]));
	function place(bet) {
		if (spinning) return;
		if (stake + denom > bank) {
			setNote("That chip is more than the purse allows.");
			return;
		}
		playCue("chip", sound);
		setNet(null);
		setSlip((prev) => [...prev, {
			id: crypto.randomUUID(),
			bet,
			amount: denom
		}]);
		setNote(`${betLabel(bet)} · ${betOdds(bet)}`);
	}
	function undo() {
		if (spinning || slip.length === 0) return;
		setSlip((prev) => prev.slice(0, -1));
	}
	function clearSlip() {
		if (spinning) return;
		setSlip([]);
		setNote("Layout cleared.");
	}
	function finish() {
		const job = pending.current;
		if (!job) return;
		pending.current = null;
		setSpinning(false);
		const settled = settleWheel(job.lines, job.n);
		setLanded(job.n);
		setHistory((prev) => [job.n, ...prev].slice(0, 10));
		setNet(settled.net);
		const text = settled.net > 0 ? `${pocketName(job.n)} pays.` : settled.net === 0 ? `${pocketName(job.n)}. Push.` : `${pocketName(job.n)}. The house keeps the slip.`;
		setNote(text);
		settle(settled.net, "roulette", `${pocketName(job.n)} · ${text}`);
		setSlip([]);
		playCue(settled.net > 0 ? "win" : "lose", sound);
	}
	function spin() {
		if (spinning || stake <= 0 || stake > bank) return;
		const n = Math.floor(Math.random() * 37);
		const idx = WHEEL.indexOf(n);
		pending.current = {
			n,
			lines
		};
		setLanded(null);
		setNet(null);
		setNote("The ball is out.");
		setSpinning(true);
		setAim(idx);
		setToken((value) => value + 1);
		playCue("spin", sound);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "The Wheel",
			eyebrow: "European · one zero"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sr-only",
			"aria-live": "polite",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto w-full max-w-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelGL, {
				token,
				pocketIndex: aim,
				onSettled: finish
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl text-cream italic",
					children: landed === null ? "Awaiting the drop" : pocketName(landed)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-cream-dim",
					children: note
				}),
				net !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: `text-sm tabular-nums ${net > 0 ? "win-note text-gold" : "text-cream-dim"}`,
					children: [net > 0 ? "+" : "", chips(net)]
				})
			] }), history.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap justify-end gap-1",
				"aria-label": "Recent numbers",
				children: history.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `flex size-8 items-center justify-center rounded-full text-xs tabular-nums ${TONE[pocketTone(n)]}`,
					children: n
				}, `${n}-${i}`))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			role: "group",
			"aria-label": "Chip value",
			children: DENOMS.map((amount) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: spinning,
				onClick: () => setDenom(amount),
				className: `press min-h-11 min-w-14 rounded-full border px-3 text-sm font-medium tabular-nums ${denom === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				"aria-pressed": denom === amount,
				children: chips(amount)
			}, amount))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `mt-4 ${spinning ? "pointer-events-none opacity-60" : ""}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-4 gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pocket, {
						n: 0,
						hot: covered.has("n:0"),
						onPlace: place,
						span: true
					}), Array.from({ length: 36 }, (_, i) => i + 1).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pocket, {
						n,
						hot: covered.has(`n:${n}`),
						onPlace: place
					}, n))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 grid grid-cols-3 gap-1",
					children: [
						1,
						2,
						3
					].map((dozen) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
						label: dozen === 1 ? "1st 12" : dozen === 2 ? "2nd 12" : "3rd 12",
						odds: "2:1",
						hot: covered.has(`d:${dozen}`),
						onClick: () => place({
							kind: "dozen",
							dozen
						})
					}, dozen))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 grid grid-cols-3 gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
							label: "1–18",
							odds: "1:1",
							hot: covered.has("h:low"),
							onClick: () => place({
								kind: "half",
								half: "low"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
							label: "Even",
							odds: "1:1",
							hot: covered.has("p:even"),
							onClick: () => place({
								kind: "parity",
								parity: "even"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
							label: "Red",
							odds: "1:1",
							hot: covered.has("c:red"),
							tone: "oxblood",
							onClick: () => place({
								kind: "color",
								color: "red"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
							label: "Black",
							odds: "1:1",
							hot: covered.has("c:black"),
							tone: "ink",
							onClick: () => place({
								kind: "color",
								color: "black"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
							label: "Odd",
							odds: "1:1",
							hot: covered.has("p:odd"),
							onClick: () => place({
								kind: "parity",
								parity: "odd"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
							label: "19–36",
							odds: "1:1",
							hot: covered.has("h:high"),
							onClick: () => place({
								kind: "half",
								half: "high"
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 grid grid-cols-3 gap-1",
					children: [
						1,
						2,
						3
					].map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
						label: `Col ${column}`,
						odds: "2:1",
						hot: covered.has(`col:${column}`),
						onClick: () => place({
							kind: "column",
							column
						})
					}, column))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4 rounded-xl border border-line bg-ink-2 px-4 py-3",
			"aria-label": "Betting slip",
			children: [lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-cream-dim",
				children: "Slip is empty."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1",
				children: lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-baseline justify-between gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-cream",
						children: [
							line.label,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-cream-dim",
								children: betOdds(line.bet)
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-gold tabular-nums",
						children: chips(line.amount)
					})]
				}, betKey(line.bet)))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-cream-dim tabular-nums",
				children: ["On the table · ", chips(stake)]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid grid-cols-4 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: undo,
					disabled: spinning || slip.length === 0,
					className: "press flex min-h-12 items-center justify-center rounded-xl border border-line bg-panel text-cream disabled:opacity-40",
					"aria-label": "Undo last chip",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: clearSlip,
					disabled: spinning || slip.length === 0,
					className: "press min-h-12 rounded-xl border border-line bg-panel text-sm text-cream disabled:opacity-40",
					children: "Clear"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: spin,
					disabled: spinning || stake <= 0 || stake > bank,
					className: "press col-span-2 min-h-12 rounded-xl bg-gold text-base font-medium text-ink disabled:opacity-40",
					children: spinning ? "Spinning" : `Spin ${chips(stake)}`
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-cream-dim",
			children: "Zero loses every outside bet. Each pocket is 1 in 37. House edge 2.7%."
		})
	] });
}
function aggregate(slip) {
	const map = /* @__PURE__ */ new Map();
	for (const chip of slip) {
		const key = betKey(chip.bet);
		const found = map.get(key);
		if (found) found.amount += chip.amount;
		else map.set(key, {
			bet: chip.bet,
			amount: chip.amount,
			label: betLabel(chip.bet)
		});
	}
	return [...map.values()];
}
function Pocket({ n, hot, onPlace, span }) {
	const tone = pocketTone(n);
	const col = span ? 1 : (n - 1) % 3 + 2;
	const row = span ? void 0 : Math.ceil(n / 3);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => onPlace({
			kind: "straight",
			n
		}),
		style: span ? {
			gridColumn: 1,
			gridRow: "1 / span 12"
		} : {
			gridColumn: col,
			gridRow: row
		},
		className: `press flex min-h-11 items-center justify-center rounded-md text-sm font-medium tabular-nums ${TONE[tone]} ${hot ? "ring-2 ring-gold" : ""}`,
		"aria-label": `Bet ${pocketName(n)} straight`,
		children: n
	});
}
function Outside({ label, odds, onClick, hot, tone = "panel" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: `press min-h-12 rounded-md px-2 text-sm font-medium ${tone === "oxblood" ? "bg-oxblood text-cream" : tone === "ink" ? "bg-ink text-cream border border-line" : "bg-panel text-cream border border-line"} ${hot ? "ring-2 ring-gold" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-xs text-cream-dim",
			children: odds
		})]
	});
}
var PAY = {
	seven: {
		w: 6,
		p3: 32,
		p2: 8,
		label: "Seven"
	},
	crown: {
		w: 9,
		p3: 18,
		p2: 5,
		label: "Crown"
	},
	bell: {
		w: 14,
		p3: 11,
		p2: 3,
		label: "Bell"
	},
	cherry: {
		w: 18,
		p3: 7,
		p2: 3,
		label: "Cherry"
	},
	citrus: {
		w: 24,
		p3: 5,
		p2: 2,
		label: "Citrus"
	}
};
var SYMBOLS = Object.keys(PAY);
var ROW_NAME = [
	"Top",
	"Middle",
	"Bottom"
];
function randomSym() {
	const entries = SYMBOLS;
	const total = entries.reduce((sum, key) => sum + PAY[key].w, 0);
	let r = Math.random() * total;
	for (const key of entries) {
		r -= PAY[key].w;
		if (r <= 0) return key;
	}
	return "citrus";
}
function spinGrid() {
	return [
		0,
		1,
		2
	].map(() => [
		randomSym(),
		randomSym(),
		randomSym()
	]);
}
var IDLE_GRID = [
	[
		"seven",
		"cherry",
		"bell"
	],
	[
		"crown",
		"citrus",
		"cherry"
	],
	[
		"bell",
		"crown",
		"seven"
	]
];
function evaluate(grid, bet) {
	const lineBet = bet / 3;
	const lines = [];
	let payout = 0;
	for (const row of [
		0,
		1,
		2
	]) {
		const a = grid[0][row];
		const b = grid[1][row];
		const c = grid[2][row];
		if (!a || !b || !c) continue;
		if (a === b && b === c) {
			const mult = PAY[a].p3;
			lines.push({
				row,
				sym: a,
				count: 3,
				mult
			});
			payout += mult * lineBet;
		} else if (a === b) {
			const mult = PAY[a].p2;
			lines.push({
				row,
				sym: a,
				count: 2,
				mult
			});
			payout += mult * lineBet;
		}
	}
	const net = payout - bet;
	let note = "No line. The house keeps the spin.";
	if (lines.length === 1) {
		const line = lines[0];
		if (line) note = `${ROW_NAME[line.row]} · ${line.count} ${PAY[line.sym].label} · ${line.mult}× line`;
	} else if (lines.length > 1) note = `${lines.length} lines hit.`;
	return {
		lines,
		payout,
		net,
		note
	};
}
var STAKES$1 = [
	15,
	30,
	75,
	150
];
var FACE = {
	seven: {
		tile: "bg-oxblood",
		fg: "text-cream",
		text: "7"
	},
	crown: {
		tile: "bg-gold",
		fg: "text-ink",
		icon: Crown
	},
	bell: {
		tile: "bg-cream",
		fg: "text-ink",
		icon: Bell
	},
	cherry: {
		tile: "bg-panel",
		fg: "text-oxblood",
		icon: Cherry
	},
	citrus: {
		tile: "bg-felt",
		fg: "text-gold",
		icon: Citrus
	}
};
function Slots() {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const settle = useCasino((s) => s.settle);
	const [stake, setStake] = (0, import_react.useState)(15);
	const [grid, setGrid] = (0, import_react.useState)(IDLE_GRID);
	const [spinning, setSpinning] = (0, import_react.useState)(false);
	const [winRows, setWinRows] = (0, import_react.useState)([]);
	const [note, setNote] = (0, import_react.useState)("Three lines. Left to right. Sevens pay the room.");
	const [net, setNet] = (0, import_react.useState)(null);
	const [rolling, setRolling] = (0, import_react.useState)([
		false,
		false,
		false
	]);
	const token = (0, import_react.useRef)(0);
	const timers = (0, import_react.useRef)([]);
	(0, import_react.useEffect)(() => {
		return () => {
			token.current += 1;
			for (const id of timers.current) window.clearTimeout(id);
		};
	}, []);
	function finish(finalGrid, bet, id) {
		if (token.current !== id) return;
		const scored = evaluate(finalGrid, bet);
		setGrid(finalGrid);
		setSpinning(false);
		setWinRows(scored.lines.map((line) => line.row));
		setNote(scored.note);
		setNet(scored.net);
		settle(scored.net, "slots", scored.note);
		playCue(scored.net > 0 ? "win" : "lose", sound);
	}
	function spin() {
		if (spinning || stake > bank) return;
		const finalGrid = spinGrid();
		const id = token.current + 1;
		token.current = id;
		for (const timer of timers.current) window.clearTimeout(timer);
		timers.current = [];
		setSpinning(true);
		setRolling([
			true,
			true,
			true
		]);
		setWinRows([]);
		setNet(null);
		setNote("Reels turning.");
		playCue("spin", sound);
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			finish(finalGrid, stake, id);
			return;
		}
		const stopAt = (col, delay) => {
			const timer = window.setTimeout(() => {
				if (token.current !== id) return;
				setGrid((prev) => {
					const next = prev.map((column) => [...column]);
					const column = finalGrid[col];
					if (column) next[col] = column;
					return next;
				});
				setRolling((prev) => {
					const next = [
						prev[0],
						prev[1],
						prev[2]
					];
					next[col] = false;
					return next;
				});
				if (col === 2) {
					const later = window.setTimeout(() => finish(finalGrid, stake, id), 280);
					timers.current.push(later);
				}
			}, delay);
			timers.current.push(timer);
		};
		stopAt(0, 900);
		stopAt(1, 1450);
		stopAt(2, 2e3);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "Vesper Reels",
			eyebrow: "One spin · three lines"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sr-only",
			"aria-live": "polite",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "felt-well rounded-xl border border-gold/50 bg-felt-deep p-3 sm:p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					0,
					1,
					2
				].map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelColumn, {
					rows: 3,
					rolling: rolling[col] ?? false,
					stopped: grid[col] ?? [
						"citrus",
						"citrus",
						"citrus"
					],
					next: randomSym,
					render: (sym, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SymbolTile, {
						sym,
						win: !spinning && index < 3 && winRows.includes(index),
						spinning: false
					})
				}, col))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl text-cream italic",
				children: note
			}), net !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `mt-1 text-sm tabular-nums ${net > 0 ? "win-note text-gold" : "text-cream-dim"}`,
				children: [net > 0 ? "+" : "", chips(net)]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			role: "group",
			"aria-label": "Spin stake",
			children: STAKES$1.map((amount) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: spinning || bank < amount,
				onClick: () => {
					setStake(amount);
					playCue("chip", sound);
				},
				className: `press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				"aria-pressed": stake === amount,
				children: chips(amount)
			}, amount))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: spin,
			disabled: spinning || stake > bank,
			className: "press mt-3 min-h-12 w-full rounded-xl bg-gold text-base font-medium text-ink disabled:opacity-40",
			children: spinning ? "Spinning" : `Spin ${chips(stake)}`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
			className: "mt-5 rounded-xl border border-line bg-ink-2 px-4 py-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "min-h-11 cursor-pointer text-sm font-medium text-cream",
					children: "Paytable"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-cream-dim",
					children: "Pays are times the line bet. A spin covers three lines, so each line is one third of the stake. Two of a kind must be the first two reels."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "mt-3 w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-xs tracking-widest text-cream-dim uppercase",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Symbol"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Two"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Three"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: SYMBOLS.map((sym) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2 text-cream",
								children: PAY[sym].label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "py-2 text-gold tabular-nums",
								children: [PAY[sym].p2, "×"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "py-2 text-gold tabular-nums",
								children: [PAY[sym].p3, "×"]
							})
						]
					}, sym)) })]
				})
			]
		})
	] });
}
function SymbolTile({ sym, win, spinning }) {
	const face = FACE[sym];
	const Icon = face.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `flex aspect-square items-center justify-center overflow-hidden rounded-lg ${face.tile} ${face.fg} ${win ? "win-pulse ring-2 ring-gold" : ""} ${spinning ? "reel-spin" : "reel-land"}`,
		children: face.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-4xl italic sm:text-5xl",
			children: face.text
		}) : Icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-8 sm:size-10",
			"aria-hidden": true
		}) : null
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var ALLOWED = new Set([
	{
		sport: "football",
		league: "nfl",
		label: "NFL"
	},
	{
		sport: "baseball",
		league: "mlb",
		label: "MLB"
	},
	{
		sport: "basketball",
		league: "nba",
		label: "NBA"
	},
	{
		sport: "hockey",
		league: "nhl",
		label: "NHL"
	}
].map((league) => `${league.sport}/${league.league}`));
var loadWire = createServerFn({ method: "POST" }).validator((data) => {
	return { lookups: (Array.isArray(data?.lookups) ? data.lookups : []).filter(isLookup).slice(0, 8) };
}).handler(createSsrRpc("73ba4f6f20bdced3e262d46c3a422bee818c51b792ab19cdbd50ce972ecdfe68"));
function isLookup(value) {
	if (!value || typeof value !== "object") return false;
	const row = value;
	return ALLOWED.has(`${row.sport}/${row.league}`) && /^\d{5,12}$/.test(row.eventId ?? "") && /^\d{8}$/.test(row.dateKey ?? "");
}
function paintCard(game) {
	const canvas = document.createElement("canvas");
	canvas.width = 640;
	canvas.height = 360;
	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;
	ctx.fillStyle = "#1c1511";
	ctx.fillRect(0, 0, 640, 360);
	ctx.strokeStyle = "#e6c36a";
	ctx.lineWidth = 10;
	ctx.strokeRect(12, 12, 616, 336);
	ctx.fillStyle = "#e6c36a";
	ctx.font = "600 28px sans-serif";
	ctx.fillText(game.state === "in" ? `${game.leagueLabel} · LIVE` : game.leagueLabel, 36, 64);
	ctx.fillStyle = "#f7edd6";
	ctx.font = "italic 64px Georgia, serif";
	const away = game.spreadAway === null ? game.awayAbbr : `${game.awayAbbr}  ${signed(game.spreadAway)}`;
	const home = game.spreadHome === null ? game.homeAbbr : `${game.homeAbbr}  ${signed(game.spreadHome)}`;
	ctx.fillText(away, 36, 160);
	ctx.fillText(home, 36, 240);
	ctx.fillStyle = "#c9bba3";
	ctx.font = "28px sans-serif";
	const total = game.total === null ? game.detail : `Total ${game.total}`;
	const score = game.state === "pre" ? total : `${game.awayScore} – ${game.homeScore}`;
	ctx.fillText(score, 36, 310);
	return canvas;
}
function WireBoard({ games }) {
	const canvasRef = (0, import_react.useRef)(null);
	const featured = games.filter((game) => game.state !== "post").slice(0, 2);
	const sig = featured.map((game) => `${game.eventId}:${game.spreadHome}:${game.homeScore}:${game.awayScore}`).join("|");
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas || featured.length === 0) return;
		let dead = false;
		let raf = 0;
		const cleanups = [];
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		(async () => {
			const THREE = await import("../_libs/three.mjs").then((n) => n.t);
			if (dead || !canvasRef.current) return;
			let renderer;
			try {
				renderer = new THREE.WebGLRenderer({
					canvas,
					alpha: true,
					antialias: true
				});
			} catch {
				return;
			}
			renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
			renderer.setClearColor(0, 0);
			renderer.outputColorSpace = THREE.SRGBColorSpace;
			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(46, 1, .1, 20);
			camera.position.set(0, .2, 4.6);
			camera.lookAt(0, 0, 0);
			const group = new THREE.Group();
			scene.add(group);
			const width = 1.28;
			const gap = 1.48;
			featured.forEach((game, index) => {
				const texture = new THREE.CanvasTexture(paintCard(game));
				texture.colorSpace = THREE.SRGBColorSpace;
				const material = new THREE.MeshBasicMaterial({ map: texture });
				const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, .72), material);
				const x = (index - (featured.length - 1) / 2) * gap;
				mesh.position.set(x, 0, -Math.abs(x) * .08);
				mesh.rotation.y = -x * .12;
				group.add(mesh);
				cleanups.push(() => {
					texture.dispose();
					material.dispose();
					mesh.geometry.dispose();
				});
			});
			const fit = () => {
				const w = canvas.clientWidth || 640;
				const h = canvas.clientHeight || 220;
				renderer.setSize(w, h, false);
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
			};
			fit();
			const draw = (now) => {
				const t = now / 1e3;
				group.rotation.y = reduce ? 0 : Math.sin(t * .35) * .22;
				group.position.y = reduce ? 0 : Math.sin(t * .7) * .03;
				renderer.render(scene, camera);
			};
			if (reduce) draw(0);
			else {
				const loop = (now) => {
					if (dead) return;
					draw(now);
					raf = requestAnimationFrame(loop);
				};
				raf = requestAnimationFrame(loop);
			}
			const onResize = () => fit();
			window.addEventListener("resize", onResize);
			cleanups.push(() => {
				window.removeEventListener("resize", onResize);
				renderer.dispose();
			});
		})();
		return () => {
			dead = true;
			cancelAnimationFrame(raf);
			for (const fn of cleanups) fn();
		};
	}, [sig, featured.length]);
	if (featured.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "mb-4 h-52 w-full rounded-xl border border-line bg-ink/40",
		"aria-hidden": true
	});
}
var STAKES = [
	25,
	50,
	100,
	250
];
var LEAGUES = [
	"NFL",
	"MLB",
	"NBA",
	"NHL"
];
function offer(game, market, side) {
	if (game.state === "post") return null;
	if (market === "ml" && side === "home" && game.mlHome !== null) return {
		eventId: game.eventId,
		market,
		side,
		odds: game.mlHome,
		line: null,
		label: `${game.homeAbbr} ML ${american(game.mlHome)}`
	};
	if (market === "ml" && side === "away" && game.mlAway !== null) return {
		eventId: game.eventId,
		market,
		side,
		odds: game.mlAway,
		line: null,
		label: `${game.awayAbbr} ML ${american(game.mlAway)}`
	};
	if (market === "spread" && side === "home" && game.spreadHome !== null && game.spreadHomeOdds !== null) return {
		eventId: game.eventId,
		market,
		side,
		odds: game.spreadHomeOdds,
		line: game.spreadHome,
		label: `${game.homeAbbr} ${signed(game.spreadHome)} ${american(game.spreadHomeOdds)}`
	};
	if (market === "spread" && side === "away" && game.spreadAway !== null && game.spreadAwayOdds !== null) return {
		eventId: game.eventId,
		market,
		side,
		odds: game.spreadAwayOdds,
		line: game.spreadAway,
		label: `${game.awayAbbr} ${signed(game.spreadAway)} ${american(game.spreadAwayOdds)}`
	};
	if (market === "total" && side === "over" && game.total !== null && game.overOdds !== null) return {
		eventId: game.eventId,
		market,
		side,
		odds: game.overOdds,
		line: game.total,
		label: `Over ${game.total} ${american(game.overOdds)}`
	};
	if (market === "total" && side === "under" && game.total !== null && game.underOdds !== null) return {
		eventId: game.eventId,
		market,
		side,
		odds: game.underOdds,
		line: game.total,
		label: `Under ${game.total} ${american(game.underOdds)}`
	};
	return null;
}
function Sportsbook() {
	const bank = useCasino((s) => s.bank);
	const sound = useCasino((s) => s.sound);
	const tickets = useCasino((s) => s.tickets);
	const placeTicket = useCasino((s) => s.placeTicket);
	const gradeTickets = useCasino((s) => s.gradeTickets);
	const [games, setGames] = (0, import_react.useState)([]);
	const [league, setLeague] = (0, import_react.useState)("NFL");
	const [slip, setSlip] = (0, import_react.useState)(null);
	const [stake, setStake] = (0, import_react.useState)(25);
	const [pulse, setPulse] = (0, import_react.useState)(0);
	const [note, setNote] = (0, import_react.useState)("Calling the wire.");
	const [quiet, setQuiet] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let alive = true;
		const pull = async () => {
			const open = useCasino.getState().tickets;
			try {
				const board = await loadWire({ data: { lookups: open.map((ticket) => ({
					sport: ticket.sport,
					league: ticket.league,
					eventId: ticket.eventId,
					dateKey: ticket.dateKey
				})) } });
				if (!alive) return;
				setGames(board.games);
				setQuiet(board.quiet);
				setNote(board.quiet ? "The wire is quiet. Try the refresh." : "Prices are the posted number. Chips lock until the final.");
				const byId = new Map(board.games.map((game) => [game.eventId, game]));
				const graded = open.flatMap((ticket) => {
					const grade = gradeTicket(ticket, byId.get(ticket.eventId));
					if (grade === "open") return [];
					const net = returnChips(ticket.stake, ticket.odds, grade);
					const word = grade === "win" ? "wins" : grade === "push" ? "pushes" : "loses";
					return [{
						id: ticket.id,
						net,
						note: `${ticket.label} ${word}`
					}];
				});
				if (graded.length) {
					gradeTickets(graded);
					playCue(graded.some((row) => row.net > 0) ? "win" : "lose", sound);
				}
			} catch {
				if (alive) setNote("The wire did not answer.");
			}
		};
		pull();
		const timer = window.setInterval(() => void pull(), 4e4);
		return () => {
			alive = false;
			window.clearInterval(timer);
		};
	}, [
		gradeTickets,
		pulse,
		sound
	]);
	const shown = games.filter((game) => game.leagueLabel === league);
	const slipGame = slip ? games.find((game) => game.eventId === slip.eventId) : void 0;
	function place() {
		if (!slip || !slipGame || slipGame.state === "post" || stake > bank) return;
		const fresh = offer(slipGame, slip.market, slip.side);
		if (!fresh) return;
		if (!placeTicket({
			eventId: slipGame.eventId,
			sport: slipGame.sport,
			league: slipGame.league,
			dateKey: slipGame.dateKey,
			label: `${slipGame.awayAbbr}/${slipGame.homeAbbr} ${fresh.label}`,
			market: fresh.market,
			side: fresh.side,
			odds: fresh.odds,
			line: fresh.line,
			stake
		})) return;
		playCue("chip", sound);
		setSlip(null);
		setNote("Ticket down. The price is locked. Chips come back if it wins or pushes.");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "The Wire",
			eyebrow: "Live numbers · play chips"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentBook, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-xl text-sm leading-relaxed text-cream-dim",
			children: "Real games and the posted price. The purse is still chips. Nothing here is a cash bet, and the ticket cannot be cashed."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sr-only",
			"aria-live": "polite",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WireBoard, { games: shown.length ? shown : games }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex flex-wrap gap-2",
			role: "group",
			"aria-label": "League",
			children: [LEAGUES.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					setLeague(name);
					setSlip(null);
				},
				className: `press min-h-11 rounded-full border px-4 text-sm font-medium ${league === name ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				"aria-pressed": league === name,
				children: name
			}, name)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setPulse((value) => value + 1),
				className: "press min-h-11 rounded-full border border-line px-4 text-sm text-cream-dim",
				children: "Refresh"
			})]
		}),
		quiet && shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "rounded-xl border border-line bg-ink-2 px-4 py-4 text-sm text-cream-dim",
			children: "The wire is quiet right now."
		}) : shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "rounded-xl border border-line bg-ink-2 px-4 py-4 text-sm text-cream-dim",
			children: "Nothing posted on this league."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3",
			children: shown.map((game) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-xl border border-line bg-ink-2 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-widest text-gold uppercase",
							children: game.state === "in" ? "Live" : game.state === "post" ? "Final" : game.detail
						}), game.state !== "pre" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-cream tabular-nums",
							children: [
								game.awayAbbr,
								" ",
								game.awayScore,
								" · ",
								game.homeAbbr,
								" ",
								game.homeScore
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "mt-2 font-display text-2xl text-cream italic",
						children: [
							game.away,
							" at ",
							game.home
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [
							["spread", "away"],
							["spread", "home"],
							["ml", "away"],
							["ml", "home"],
							["total", "over"],
							["total", "under"]
						].map(([market, side]) => {
							const next = offer(game, market, side);
							const on = slip?.eventId === game.eventId && slip.market === market && slip.side === side;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: !next,
								onClick: () => next && setSlip(next),
								className: `press min-h-11 rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-40 ${on ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
								"aria-pressed": on,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block",
									children: next ? next.label : "No price"
								})
							}, `${market}-${side}`);
						})
					})
				]
			}, game.eventId))
		}),
		slip && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 rounded-xl border border-gold bg-panel p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium text-cream",
					children: slip.label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-cream-dim",
					children: [
						"A ",
						chips(stake),
						" chip ticket wins ",
						chips(profit(stake, slip.odds)),
						" if it hits. The stake is held until the final."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					role: "group",
					"aria-label": "Ticket stake",
					children: STAKES.map((amount) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: bank < amount,
						onClick: () => setStake(amount),
						className: `press min-h-11 rounded-full border px-4 text-sm font-medium tabular-nums disabled:opacity-40 ${stake === amount ? "border-gold bg-gold text-ink" : "border-line bg-ink-2 text-cream"}`,
						"aria-pressed": stake === amount,
						children: chips(amount)
					}, amount))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: place,
					disabled: stake > bank,
					className: "press mt-3 min-h-12 w-full rounded-xl bg-gold text-base font-medium text-ink disabled:opacity-40",
					children: ["Bet ", chips(stake)]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6",
			"aria-label": "Open tickets",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl text-cream italic",
				children: "Open tickets"
			}), tickets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-cream-dim",
				children: "No tickets down."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line bg-ink-2",
				children: tickets.map((ticket) => {
					const game = games.find((row) => row.eventId === ticket.eventId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-cream",
							children: ticket.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-cream-dim tabular-nums",
							children: [
								chips(ticket.stake),
								" held",
								game?.state === "in" ? ` · ${game.awayScore}–${game.homeScore}` : " · waiting on the final"
							]
						})]
					}, ticket.id);
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-cream-dim",
			children: note
		})
	] });
}
var STATIONS = [
	{
		id: "shoe",
		name: "The Shoe",
		kicker: "Blackjack",
		need: 5,
		lesson: "The dealer stands on every seventeen. Hard 12 hits against a 2 or a 3, and stands against 4, 5, and 6. Hard 13 through 16 stands against 2 through 6 and hits against 7 through ace. Double hard 9 against 3 through 6, hard 10 against 2 through 9, and hard 11 against anything. Soft 18 hits against 9, 10, and ace. Soft 17 doubles against 3 through 6, otherwise hit. Hold a pair of tens.",
		drills: [
			{
				prompt: "Hard 16. Dealer shows a 10.",
				choices: [
					"Hit",
					"Stand",
					"Double"
				],
				answer: 0,
				why: "A stiff against a ten loses if you stand and the dealer makes a hand. Take the hit."
			},
			{
				prompt: "Hard 12. Dealer shows a 4.",
				choices: [
					"Hit",
					"Stand",
					"Double"
				],
				answer: 1,
				why: "A 4 busts often enough. A 12 already beats a bust. Leave it."
			},
			{
				prompt: "Hard 12. Dealer shows a 2.",
				choices: [
					"Hit",
					"Stand",
					"Double"
				],
				answer: 0,
				why: "Twelve against a 2 or a 3 is the exception. Hit it."
			},
			{
				prompt: "Hard 11. Dealer shows a 6.",
				choices: [
					"Hit",
					"Stand",
					"Double"
				],
				answer: 2,
				why: "Eleven wants exactly one card, and a 6 is a bust card. Double."
			},
			{
				prompt: "Hard 11. Dealer shows an ace.",
				choices: [
					"Hit",
					"Stand",
					"Double"
				],
				answer: 2,
				why: "At this shoe the dealer stands on soft 17, and hard 11 still doubles against an ace."
			},
			{
				prompt: "Soft 18. Dealer shows a 9.",
				choices: [
					"Hit",
					"Stand",
					"Double"
				],
				answer: 0,
				why: "Soft 18 loses to 9, 10, and ace. A hit cannot bust a soft 18."
			},
			{
				prompt: "Hard 10. Dealer shows a 9.",
				choices: [
					"Hit",
					"Stand",
					"Double"
				],
				answer: 2,
				why: "Hard 10 doubles against 2 through 9."
			},
			{
				prompt: "Hard 13. Dealer shows a 6.",
				choices: [
					"Hit",
					"Stand",
					"Double"
				],
				answer: 1,
				why: "Thirteen through sixteen stands against 2 through 6."
			}
		]
	},
	{
		id: "wheel",
		name: "The Wheel",
		kicker: "Roulette",
		need: 3,
		lesson: "One zero. Every standard bet keeps one chip in thirty-seven, about 2.7 percent. Red is not cheaper than a single number. It only swings less. Five reds do not make black due. A martingale raises the stake until the limit or the purse stops the run. It does not change the edge.",
		drills: [
			{
				prompt: "Which bet has the smaller house edge, red or 17?",
				choices: [
					"Red",
					"17",
					"The same edge"
				],
				answer: 2,
				why: "The percent is the same. Seventeen just pays more because it hits less."
			},
			{
				prompt: "The wheel has rolled five reds. The next spin is",
				choices: [
					"Due black",
					"Still 18 red, 18 black, 1 zero",
					"A lock for red"
				],
				answer: 1,
				why: "The wheel has no memory. The last five spins are not a debt."
			},
			{
				prompt: "A martingale after a loss",
				choices: [
					"Removes the house edge",
					"Raises the stake until you cannot",
					"Is required at this wheel"
				],
				answer: 1,
				why: "Doubling back only works until the purse or the table says no. The edge is still there."
			}
		]
	},
	{
		id: "rail",
		name: "The Rail",
		kicker: "Craps",
		need: 3,
		lesson: "Pass wins the come-out on 7 and 11 and loses on 2, 3, and 12. Once a point is set, the odds bet behind the pass line is paid at true odds. That is the best bet on the rail. The field is a one-roll bet with an edge near 5 percent. Any seven is worse than both.",
		drills: [
			{
				prompt: "The point is 6. Which bet is the fair one?",
				choices: [
					"Odds behind the pass",
					"The field",
					"Any seven"
				],
				answer: 0,
				why: "Odds behind the pass are paid at true odds. The field and any seven are taxed."
			},
			{
				prompt: "Come-out. Which bet is the worst of these?",
				choices: [
					"Pass line",
					"Don't pass",
					"Any seven"
				],
				answer: 2,
				why: "Pass and don't pass are close. Any seven is a one-roll bet the house prices badly."
			},
			{
				prompt: "Come-out, you have the pass line. A 7",
				choices: [
					"Wins",
					"Loses",
					"Sets the point"
				],
				answer: 0,
				why: "Seven and eleven win the come-out. The point comes later, on 4, 5, 6, 8, 9, or 10."
			}
		]
	},
	{
		id: "salon",
		name: "The Salon",
		kicker: "Baccarat",
		need: 3,
		lesson: "Banker wins a little more often than player. The house takes five percent and the banker bet is still the cheapest on the layout, near 1.06 percent. Player is near 1.24 percent. The tie pays 8 to 1 and costs about 14 percent. The pit does not play the tie.",
		drills: [
			{
				prompt: "Which bet has the lowest edge?",
				choices: [
					"Player",
					"Banker",
					"Tie"
				],
				answer: 1,
				why: "Commission and all, banker is still the small number."
			},
			{
				prompt: "The tie is",
				choices: [
					"The best price on the layout",
					"A long shot the house keeps most of",
					"Required with a banker bet"
				],
				answer: 1,
				why: "Eight to one does not pay for how rarely the totals match."
			},
			{
				prompt: "The banker commission is",
				choices: [
					"Five percent of a winning banker bet",
					"Five percent of every bet",
					"Taken only on a tie"
				],
				answer: 0,
				why: "This house pays banker nineteen to twenty. That is the five percent."
			}
		]
	},
	{
		id: "draw",
		name: "The Draw",
		kicker: "Jacks or better",
		need: 3,
		lesson: "The machine pays a pair of jacks or higher. Hold a paying pair and drop the kickers. A low pair still beats three random suited cards. Four cards to a flush are worth holding. Two cards to a royal beat a low pair. Do not break jacks or better for a one-card flush draw.",
		drills: [
			{
				prompt: "J♠ J♦ 9♣ 4♥ 2♠. What do you hold?",
				choices: [
					"The jacks",
					"Jacks and the nine",
					"All five"
				],
				answer: 0,
				why: "A high pair is already paid. Kickers do not help it."
			},
			{
				prompt: "10♠ 10♥ A♦ 7♣ 3♠. What do you hold?",
				choices: [
					"The tens",
					"The ace",
					"Tens and the ace"
				],
				answer: 0,
				why: "A low pair is the made hand. An ace kicker is a draw to nothing that pays."
			},
			{
				prompt: "Q♥ J♥ 9♥ 4♥ 2♣. What do you hold?",
				choices: [
					"The four hearts",
					"Queen and jack only",
					"All five"
				],
				answer: 0,
				why: "Four to a flush is the hold. The deuce of clubs is in the way."
			}
		]
	},
	{
		id: "reels",
		name: "The reels",
		kicker: "Vesper and After Hours",
		need: 3,
		lesson: "Neither machine remembers the last spin. A cold run is not a debt the next spin has to pay. The stake changes how much you swing. It does not change the edge. Vesper pays three lines. After Hours pays one line, and the first two reels have to agree.",
		drills: [
			{
				prompt: "Ten spins missed. The next spin is",
				choices: [
					"Due",
					"The same odds as the first spin",
					"A better price"
				],
				answer: 1,
				why: "The reels draw again. The past is not in the math."
			},
			{
				prompt: "Raising the stake",
				choices: [
					"Lowers the house edge",
					"Wins the same percent on a bigger number",
					"Forces a jackpot"
				],
				answer: 1,
				why: "More chips in, more chips out, same percent kept by the house."
			},
			{
				prompt: "After Hours pays when",
				choices: [
					"Any two symbols match",
					"The first two reels match, or all three",
					"The middle symbol is a gem"
				],
				answer: 1,
				why: "It is one line. Two of a kind has to be the first two windows."
			}
		]
	},
	{
		id: "cage",
		name: "The Cage",
		kicker: "Keno",
		need: 3,
		lesson: "Ten numbers come out of forty. Catching all six spots on a six-spot ticket is about one in ten thousand. Two hundred fifty times the stake does not pay for that miss. Smaller tickets miss less often and the house still keeps a slice. Play it for the draw, not for a wage.",
		drills: [
			{
				prompt: "The six-spot jackpot is the right chase because",
				choices: [
					"It is not. The catch is far rarer than the pay",
					"It is due after a dry week",
					"More spots always pay better"
				],
				answer: 0,
				why: "A 250× ticket against a one-in-ten-thousand catch is a bad price."
			},
			{
				prompt: "The cage draws",
				choices: [
					"10 of 40",
					"20 of 80",
					"6 of 40"
				],
				answer: 0,
				why: "This cage is the small board. Ten numbers leave it."
			},
			{
				prompt: "A sensible cage ticket is",
				choices: [
					"A small stake you can watch",
					"The whole purse on six spots",
					"A system that adds a spot after each miss"
				],
				answer: 0,
				why: "The edge does not flip because you stayed for another draw."
			}
		]
	},
	{
		id: "wire",
		name: "The Wire",
		kicker: "Sports",
		need: 3,
		lesson: "−110 means you lay 110 chips to win 100. +150 means you lay 100 to win 150. The number locks when you bet, not when the game ends. If both sides are minus money, the gap is the juice. A push gives the stake back. A final game is closed. The pit cannot pick the winner. It can read the price.",
		drills: [
			{
				prompt: "+150 on 100 chips. If it hits, the profit is",
				choices: [
					"150",
					"250",
					"100"
				],
				answer: 0,
				why: "Plus money pays that many chips on a 100-chip stake. The stake was already put up."
			},
			{
				prompt: "The game is already final. You",
				choices: [
					"Can still bet the closing number",
					"Cannot bet it",
					"Get the price from the open"
				],
				answer: 1,
				why: "The wire closes when the game is final. There is nothing left to price."
			},
			{
				prompt: "Your spread lands exactly on the number. The ticket",
				choices: [
					"Loses",
					"Pays −110",
					"Pushes and returns the stake"
				],
				answer: 2,
				why: "A push is a tie with the number. The held chips come back."
			}
		]
	}
];
function Workshop() {
	const sound = useCasino((s) => s.sound);
	const pit = useCasino((s) => s.pit);
	const focusStation = useCasino((s) => s.focusStation);
	const markPit = useCasino((s) => s.markPit);
	const [stationId, setStationId] = (0, import_react.useState)(STATIONS[0]?.id ?? "shoe");
	const [step, setStep] = (0, import_react.useState)(0);
	const [picked, setPicked] = (0, import_react.useState)(null);
	const station = STATIONS.find((row) => row.id === stationId) ?? STATIONS[0];
	const drill = station?.drills[step % (station.drills.length || 1)];
	if (!station || !drill) return null;
	function choose(index) {
		if (picked !== null || !station) return;
		setPicked(index);
		const correct = index === drill?.answer;
		markPit(station.id, correct, station.need);
		playCue(correct ? "win" : "lose", sound);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Frame, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			title: "The Pit",
			eyebrow: "Workshop · play chips"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-xl text-sm leading-relaxed text-cream-dim",
			children: "The math of the house, said plainly. Five clean answers at the shoe, or a clean pass at the other stations, comps 100 chips once. It does not change the edge of the game."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 text-sm text-gold tabular-nums",
			children: [
				pit.correct,
				" of ",
				pit.asked,
				" right · streak ",
				pit.streak,
				pit.cleared.length > 0 ? ` · cleared ${pit.cleared.length}` : ""
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex w-full min-w-0 gap-2 overflow-x-auto pb-1",
			role: "group",
			"aria-label": "Stations",
			children: STATIONS.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => {
					setStationId(row.id);
					setStep(0);
					setPicked(null);
					focusStation(row.id);
				},
				className: `press min-h-11 shrink-0 rounded-full border px-4 text-sm ${row.id === station.id ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"}`,
				"aria-pressed": row.id === station.id,
				children: [row.name, pit.cleared.includes(row.id) ? " ·" : ""]
			}, row.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "mt-4 rounded-xl border border-line bg-ink-2 p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-widest text-gold uppercase",
					children: station.kicker
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-3xl text-cream italic",
					children: station.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-relaxed text-cream-dim",
					children: station.lesson
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4",
			"aria-label": "Drill",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl text-cream italic",
					children: drill.prompt
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid gap-2",
					children: drill.choices.map((choice, index) => {
						const show = picked !== null;
						const right = index === drill.answer;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: picked !== null,
							onClick: () => choose(index),
							className: `press min-h-12 rounded-xl border px-4 text-left text-sm disabled:opacity-100 ${show && right ? "border-gold bg-gold text-ink" : show && index === picked ? "border-oxblood bg-oxblood text-cream" : "border-line bg-panel text-cream"}`,
							children: choice
						}, choice);
					})
				}),
				picked !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-cream-dim",
						children: drill.why
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							setPicked(null);
							setStep((value) => value + 1);
						},
						className: "press mt-3 min-h-11 rounded-full border border-gold px-4 text-sm text-gold",
						children: "Next hand"
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-5 text-sm text-cream-dim",
			children: [
				"A cleared station pays ",
				chips(100),
				" once. The games themselves keep their edge."
			]
		})
	] });
}
function CasinoApp() {
	const view = useCasino((s) => s.view);
	const boot = useCasino((s) => s.boot);
	const sound = useCasino((s) => s.sound);
	const agentStatus = useCasino((s) => s.agent?.status);
	const advanceAgent = useCasino((s) => s.advanceAgent);
	(0, import_react.useEffect)(() => {
		boot();
	}, [boot]);
	(0, import_react.useEffect)(() => {
		setLounge(sound);
	}, [sound]);
	(0, import_react.useEffect)(() => {
		if (agentStatus !== "live") return;
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const timer = window.setInterval(advanceAgent, reduce ? 70 : 520);
		return () => window.clearInterval(timer);
	}, [advanceAgent, agentStatus]);
	(0, import_react.useEffect)(() => {
		const onPointer = () => unlockAudio();
		window.addEventListener("pointerdown", onPointer);
		return () => window.removeEventListener("pointerdown", onPointer);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoomGL, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smoke, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pianist, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bartender, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rise",
			children: view === "blackjack" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Blackjack, {}) : view === "roulette" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roulette, {}) : view === "slots" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slots, {}) : view === "craps" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Craps, {}) : view === "baccarat" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Baccarat, {}) : view === "poker" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Poker, {}) : view === "keno" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Keno, {}) : view === "afterhours" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AfterHours, {}) : view === "sports" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sportsbook, {}) : view === "workshop" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workshop, {}) : view === "agents" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Agents, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Floor, {})
		}, view)
	] });
}
var SplitComponent = CasinoApp;
//#endregion
export { SplitComponent as component };
