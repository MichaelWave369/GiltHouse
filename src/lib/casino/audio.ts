let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let music: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let loungeWanted = false;
let loungeRunning = false;
let loungeTimer = 0;
let nextNote = 0;
let beat = 0;
let loungeGen = 0;

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
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx?.state === "suspended") void ctx.resume();
  });
}

export function setLounge(on: boolean) {
  loungeWanted = on;
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
