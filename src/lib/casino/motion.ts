export function damp(current: number, target: number, lambda: number, dt: number) {
  const k = 1 - Math.exp(-lambda * Math.max(0, dt));
  return current + (target - current) * k;
}

export function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function osc(time: number, speed: number, phase = 0) {
  return Math.sin(time * speed + phase);
}
