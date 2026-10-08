let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let music: GainNode | null = null;
let blockBus: GainNode | null = null;
let streetSfx: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let loungeWanted = false;
let loungeRunning = false;
let loungeTimer = 0;
let nextNote = 0;
let beat = 0;
let loungeGen = 0;
let blockWanted = false;
let blockRunning = false;
let blockTimer = 0;
let blockNext = 0;
let blockBeat = 0;
let blockVariant = "default";

const QUARTER = 0.86;

const CHORDS = [
  { notes: [293.66, 349.23, 440, 523.25] },
  { notes: [349.23, 392, 493.88, 587.33] },
  { notes: [329.63, 392, 493.88, 523.25] },
  { notes: [349.23, 440, 523.25, 554.37] },
];

const WALK = [
  [73.42, 82.41, 87.31, 98],
  [98, 110, 116.54, 130.81],
  [65.41, 73.42, 82.41, 87.31],
  [110, 103.83, 98, 87.31],
];

const MELODY = [
  [523.25, 587.33, 659.25, 587.33],
  [493.88, 440, 392, 440],
  [523.25, 659.25, 783.99, 659.25],
  [554.37, 523.25, 493.88, 440],
];

const WHITES = [0, 2, 4, 5, 7, 9, 11];
const BLACKS = [1, 3, 6, 8, 10];

function ensure() {
  if (ctx) return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  ctx = new AudioCtx({ latencyHint: "interactive" });
  master = ctx.createGain();
  master.gain.value = 0.9;
  sfx = ctx.createGain();
  music = ctx.createGain();
  music.gain.value = 0.0001;
  sfx.connect(master);
  music.connect(master);
  blockBus = ctx.createGain();
  blockBus.gain.value = 0.0001;
  streetSfx = ctx.createGain();
  streetSfx.gain.value = 0.9;
  blockBus.connect(master);
  streetSfx.connect(master);
  master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  ensure();
  if (ctx?.state === "suspended") void ctx.resume();
  if (loungeWanted) startLounge();
  if (blockWanted) startBlock();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx?.state === "suspended") void ctx.resume();
  });
}

export function setLounge(on: boolean) {
  loungeWanted = on;
  if (on) {
    blockWanted = false;
    stopBlock();
  }
  if (!on) stopLounge();
  else if (ctx && ctx.state === "running") startLounge();
}

function startLounge() {
  if (!ctx || !music || loungeRunning) return;
  loungeRunning = true;
  nextNote = ctx.currentTime + 0.08;
  music.gain.cancelScheduledValues(ctx.currentTime);
  music.gain.setTargetAtTime(0.42, ctx.currentTime, 0.4);
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
    music.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
  }
}

function loungeTick() {
  if (!loungeRunning || !ctx || ctx.state !== "running") return;
  if (nextNote < ctx.currentTime) nextNote = ctx.currentTime + 0.05;
  while (nextNote < ctx.currentTime + 0.24) {
    scheduleLounge(nextNote);
    nextNote += QUARTER;
  }
}

function pitchKey(freq: number) {
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const pc = ((midi % 12) + 12) % 12;
  const white = WHITES.indexOf(pc);
  if (white >= 0) return white;
  const black = BLACKS.indexOf(pc);
  return 7 + (black < 0 ? 0 : black);
}

function showKeys(when: number, keys: number[]) {
  if (!ctx || typeof window === "undefined") return;
  const gen = loungeGen;
  const delay = Math.max(0, (when - ctx.currentTime) * 1000);
  window.setTimeout(() => {
    if (gen !== loungeGen) return;
    window.dispatchEvent(new CustomEvent("gilt-piano", { detail: { keys } }));
  }, delay);
}

function pianoNote(freq: number, when: number, peak: number) {
  toneAt(music, freq, when, 1.25, "sine", peak);
  toneAt(music, freq * 2, when, 0.72, "sine", peak * 0.22);
  toneAt(music, freq * 1.002, when, 1.05, "triangle", peak * 0.08);
}

function scheduleLounge(when: number) {
  const bar = Math.floor(beat / 4) % 4;
  const pulse = beat % 4;
  const walk = WALK[bar]?.[pulse] ?? 65.41;
  const chord = CHORDS[bar]?.notes ?? [];
  const lit = [pitchKey(walk)];
  toneAt(music, walk, when, 0.78, "sine", 0.05);
  if (pulse === 0 || pulse === 2) {
    for (const note of chord) {
      pianoNote(note, when, 0.022);
      lit.push(pitchKey(note));
    }
    noiseHat(when);
  } else {
    const melody = MELODY[bar]?.[pulse];
    if (melody) {
      pianoNote(melody, when, 0.018);
      lit.push(pitchKey(melody));
    }
    noiseHat(when + 0.08);
  }
  showKeys(when, lit);
  beat += 1;
}

function toneAt(
  bus: GainNode | null,
  freq: number,
  when: number,
  dur: number,
  type: OscillatorType,
  peak: number,
) {
  if (!ctx || !bus || peak <= 0) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), when + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(amp);
  amp.connect(bus);
  osc.start(when);
  osc.stop(when + dur + 0.03);
  osc.onended = () => {
    osc.disconnect();
    amp.disconnect();
  };
}

function slide(from: number, to: number, dur: number, peak: number) {
  if (!ctx || !sfx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 40), now + dur);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(peak, now + 0.03);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(amp);
  amp.connect(sfx);
  osc.start(now);
  osc.stop(now + dur + 0.03);
  osc.onended = () => {
    osc.disconnect();
    amp.disconnect();
  };
}

function noiseHit(when: number, dur: number, peak: number, freq: number, q: number) {
  if (!ctx || !sfx || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq, when);
  filter.Q.value = q;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(peak, when);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(sfx);
  src.start(when);
  src.stop(when + dur + 0.02);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    amp.disconnect();
  };
}

function noiseHat(when: number) {
  noiseHit(when, 0.04, 0.012, 6400, 0.7);
}

function sweep(from: number, to: number, dur: number, peak: number) {
  if (!ctx || !sfx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(to, now + dur);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(peak, now + 0.04);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(amp);
  amp.connect(sfx);
  osc.start(now);
  osc.stop(now + dur + 0.03);
  osc.onended = () => {
    osc.disconnect();
    amp.disconnect();
  };
}

export type Cue = "chip" | "card" | "spin" | "win" | "lose" | "dice";

export function playCue(cue: Cue, enabled: boolean) {
  if (!enabled) return;
  unlockAudio();
  if (!ctx || !sfx) return;
  const now = ctx.currentTime;
  const wobble = 0.94 + Math.random() * 0.12;
  if (cue === "chip") {
    noiseHit(now, 0.05, 0.07, 1680 * wobble, 3);
    toneAt(sfx, 740 * wobble, now, 0.08, "triangle", 0.045);
    toneAt(sfx, 1480 * wobble, now + 0.02, 0.06, "sine", 0.02);
  }
  if (cue === "card") {
    noiseHit(now, 0.045, 0.05, 980 * wobble, 1.4);
    toneAt(sfx, 190, now, 0.07, "sine", 0.03);
  }
  if (cue === "dice") {
    noiseHit(now, 0.07, 0.08, 420, 0.8);
    noiseHit(now, 0.04, 0.05, 1800 * wobble, 2);
    noiseHit(now + 0.09, 0.08, 0.07, 360, 0.7);
    noiseHit(now + 0.1, 0.04, 0.04, 1500, 2);
  }
  if (cue === "spin") {
    sweep(120, 540, 0.42, 0.02);
    for (let i = 0; i < 7; i++) toneAt(sfx, 880 + i * 30, now + i * 0.07, 0.04, "square", 0.012);
  }
  if (cue === "win") {
    toneAt(sfx, 196, now, 0.28, "sine", 0.04);
    toneAt(sfx, 523, now, 0.16, "triangle", 0.05);
    toneAt(sfx, 659, now + 0.11, 0.16, "triangle", 0.05);
    toneAt(sfx, 784, now + 0.22, 0.22, "triangle", 0.055);
    toneAt(sfx, 1046, now + 0.34, 0.28, "sine", 0.04);
    toneAt(sfx, 784, now + 0.46, 0.18, "triangle", 0.02);
  }
  if (cue === "lose") slide(220, 92, 0.32, 0.04);
}

const BLOCK_BASS = [110, 98, 87.31, 82.41];
const BLOCK_LEAD = [
  [220, 261.63, 246.94, 196],
  [174.61, 196, 220, 164.81],
  [246.94, 220, 196, 174.61],
  [196, 164.81, 146.83, 174.61],
];

export function setStreetMix(musicVol: number, sfxVol: number) {
  if (!blockBus || !streetSfx || !ctx) return;
  const m = Math.max(0, Math.min(1, musicVol));
  const s = Math.max(0, Math.min(1, sfxVol));
  blockBus.gain.setTargetAtTime(blockRunning ? 0.34 * m : 0.0001, ctx.currentTime, 0.08);
  streetSfx.gain.setTargetAtTime(0.9 * s, ctx.currentTime, 0.05);
}

export function setBlockVariant(name: string | null) {
  blockVariant = name && name.length > 0 ? name : "default";
}

export function setBlockMusic(on: boolean) {
  blockWanted = on;
  if (on) {
    loungeWanted = false;
    stopLounge();
    if (ctx && ctx.state === "running") startBlock();
  } else stopBlock();
}

function startBlock() {
  if (!ctx || !blockBus || blockRunning) return;
  blockRunning = true;
  blockNext = ctx.currentTime + 0.06;
  blockBus.gain.cancelScheduledValues(ctx.currentTime);
  blockBus.gain.setTargetAtTime(0.34, ctx.currentTime, 0.45);
  if (!blockTimer) blockTimer = window.setInterval(blockTick, 100);
}

function stopBlock() {
  blockRunning = false;
  if (blockTimer) {
    window.clearInterval(blockTimer);
    blockTimer = 0;
  }
  if (ctx && blockBus) {
    blockBus.gain.cancelScheduledValues(ctx.currentTime);
    blockBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
  }
}

function blockTick() {
  if (!blockRunning || !ctx || ctx.state !== "running" || !blockBus) return;
  if (blockNext < ctx.currentTime) blockNext = ctx.currentTime + 0.05;
  while (blockNext < ctx.currentTime + 0.28) {
    const mul =
      blockVariant === "static" ? 1.18 : blockVariant === "comet" ? 1.42 : blockVariant === "griddle" ? 0.82 : 1;
    const bar = Math.floor(blockBeat / 4) % 4;
    const step = blockBeat % 4;
    const when = blockNext;
    toneAt(blockBus, (BLOCK_BASS[bar] ?? 110) * (blockVariant === "griddle" ? 0.9 : 1), when, 0.42, "triangle", 0.05);
    const lead = BLOCK_LEAD[bar]?.[step];
    if (lead && step % 2 === 0) toneAt(blockBus, lead * mul, when, 0.28, "sine", 0.028);
    if (step === 0) toneAt(blockBus, (BLOCK_BASS[bar] ?? 110) * 2, when, 0.16, "triangle", 0.015);
    blockBeat += 1;
    blockNext += 0.48;
  }
}

export type StreetCue = "step" | "door" | "buy" | "talk" | "neon" | "good" | "nope";

export function playStreetCue(cue: StreetCue, enabled: boolean) {
  if (!enabled) return;
  unlockAudio();
  if (!ctx || !streetSfx) return;
  const now = ctx.currentTime;
  if (cue === "step") toneAt(streetSfx, 90, now, 0.04, "sine", 0.02);
  if (cue === "door") {
    toneAt(streetSfx, 523, now, 0.08, "triangle", 0.03);
    toneAt(streetSfx, 784, now + 0.06, 0.1, "sine", 0.02);
  }
  if (cue === "buy") {
    toneAt(streetSfx, 880, now, 0.07, "square", 0.02);
    toneAt(streetSfx, 1174, now + 0.07, 0.09, "square", 0.018);
    toneAt(streetSfx, 1760, now + 0.14, 0.08, "sine", 0.012);
  }
  if (cue === "talk") toneAt(streetSfx, 660, now, 0.07, "triangle", 0.03);
  if (cue === "neon") toneAt(streetSfx, 1400, now, 0.05, "square", 0.012);
  if (cue === "good") {
    toneAt(streetSfx, 523, now, 0.1, "triangle", 0.04);
    toneAt(streetSfx, 659, now + 0.08, 0.12, "triangle", 0.04);
    toneAt(streetSfx, 784, now + 0.16, 0.14, "sine", 0.035);
  }
  if (cue === "nope") slide(300, 140, 0.18, 0.03);
}

