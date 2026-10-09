/**
 * R14: static, entirely local and collision-aware 3D casino wayfinding.
 * The 0.5m grid is a *visual guide*, never a movement command. No chips,
 * casino view transitions, network, GPS, localStorage or authority involved.
 */
import {
  clampFloor3DCamera, collidesFloor3DTable, FLOOR3D_STATIONS,
  type Floor3DPose, type FloorGame,
} from "./floor3d.ts";

export type FloorPoint = Readonly<{ x: number; z: number }>;
export type FloorRoute = Readonly<{
  game: FloorGame;
  points: readonly FloorPoint[];
  meters: number;
  destination: FloorPoint;
}>;

const STEP = 0.5;
const X_MIN = -8;
const Z_MIN = -11.5;
const COLS = 33; // -8 .. +8
const ROWS = 47; // -11.5 .. +11.5
const COUNT = COLS * ROWS;
const MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

function point(index: number): FloorPoint {
  return { x: X_MIN + index % COLS * STEP, z: Z_MIN + Math.floor(index / COLS) * STEP };
}
function free(p: FloorPoint): boolean {
  const bounded = clampFloor3DCamera(p.x, p.z);
  return bounded.x === p.x && bounded.z === p.z && !collidesFloor3DTable(p.x, p.z);
}
function segmentFree(a: FloorPoint, b: FloorPoint): boolean {
  const distance = Math.hypot(b.x - a.x, b.z - a.z);
  for (let i = 0, total = Math.ceil(distance / 0.06); i <= total; i++) {
    const t = total ? i / total : 0;
    if (!free({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })) return false;
  }
  return true;
}

export function floor3DTarget(game: string): FloorPoint | null {
  const table = FLOOR3D_STATIONS.find((s) => s.game === game);
  if (!table) return null;
  // Central-side approach spots stay outside R13 collision footprints and
  // inside the original F/Enter interaction radius.
  return { x: table.x < 0 ? -3 : 3, z: table.z };
}

/** Breadth-first grid route, never cuts corners or crosses a solid table. */
export function findFloor3DRoute(pose: Floor3DPose, game: string): FloorRoute | null {
  const goal = floor3DTarget(game);
  if (!goal || !Number.isFinite(pose.x) || !Number.isFinite(pose.z) ||
      !Number.isFinite(pose.yaw) || !free(pose) || !free(goal)) return null;

  const startIndex = (() => {
    let best = -1;
    let closest = Infinity;
    for (let n = 0; n < COUNT; n++) {
      const candidate = point(n);
      const dist = Math.hypot(candidate.x - pose.x, candidate.z - pose.z);
      if (dist < closest && dist < 1.1 && free(candidate) && segmentFree(pose, candidate)) {
        best = n;
        closest = dist;
      }
    }
    return best;
  })();
  if (startIndex < 0) return null;
  const goalCol = Math.round((goal.x - X_MIN) / STEP);
  const goalRow = Math.round((goal.z - Z_MIN) / STEP);
  const endIndex = goalRow * COLS + goalCol;

  const previous = new Int32Array(COUNT);
  previous.fill(-1);
  const queue = new Int32Array(COUNT);
  let head = 0;
  let tail = 1;
  queue[0] = startIndex;
  previous[startIndex] = startIndex;

  while (head < tail && previous[endIndex] === -1) {
    const now = queue[head++];
    const row = Math.floor(now / COLS);
    const col = now % COLS;
    for (const [dc, dr] of MOVES) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const next = nr * COLS + nc;
      if (previous[next] !== -1 || !free(point(next))) continue;
      previous[next] = now;
      queue[tail++] = next;
    }
  }
  if (previous[endIndex] === -1) return null;

  const cells: FloorPoint[] = [];
  for (let cursor = endIndex; cursor !== startIndex; cursor = previous[cursor]) cells.push(point(cursor));
  cells.push(point(startIndex));
  cells.reverse();

  // Shorten straight grid sections to turns while retaining collision safety.
  const simplified: FloorPoint[] = [{ x: pose.x, z: pose.z }];
  for (let i = 0; i < cells.length; i++) {
    const prior = simplified[simplified.length - 1];
    const candidate = cells[i];
    if (Math.hypot(candidate.x - prior.x, candidate.z - prior.z) < 0.001) continue;
    const next = cells[i + 1];
    const turn = !next || Math.sign(next.x - candidate.x) !== Math.sign(candidate.x - (cells[i - 1]?.x ?? candidate.x)) ||
      Math.sign(next.z - candidate.z) !== Math.sign(candidate.z - (cells[i - 1]?.z ?? candidate.z));
    if (turn || i === 0) simplified.push(candidate);
  }
  const end = simplified[simplified.length - 1];
  if (end.x !== goal.x || end.z !== goal.z) simplified.push(goal);
  const meters = simplified.slice(1).reduce((d, p, i) =>
    d + Math.hypot(p.x - simplified[i].x, p.z - simplified[i].z), 0);
  return { game: game as FloorGame, points: simplified, destination: goal, meters };
}

/** A clear, heading-relative instruction based on the first route segment. */
export function floor3DHeading(pose: Floor3DPose, route: FloorRoute | null): string {
  if (!route) return "Choose a table for walking directions.";
  const next = route.points.find((p) => Math.hypot(p.x - pose.x, p.z - pose.z) > 0.3);
  if (!next) return "You're at the table. Press F or use its game shortcut.";
  const delta = Math.atan2(next.x - pose.x, -(next.z - pose.z)) - pose.yaw;
  const angle = Math.atan2(Math.sin(delta), Math.cos(delta));
  if (Math.abs(angle) < 0.35) return "Continue ahead along the marked route.";
  if (Math.abs(angle) > 2.7) return "Turn around toward the marked route.";
  return angle < 0 ? "Turn left toward the marked route." : "Turn right toward the marked route.";
}
