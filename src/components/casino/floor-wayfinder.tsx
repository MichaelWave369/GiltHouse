import { useMemo, useState } from "react";
import {
  FLOOR3D_STATIONS, FLOOR3D_TABLE_CLEARANCE_X, FLOOR3D_TABLE_CLEARANCE_Z,
  type Floor3DPose, type FloorGame,
} from "@/lib/casino/floor3d";
import { findFloor3DRoute, floor3DHeading } from "@/lib/casino/floor3d-nav";

const px = (x: number) => 130 + x * 14;
const py = (z: number) => 185 + z * 14;

/**
 * R14 accessible, optional plan view of the REAL 3D showroom geometry.
 * Target buttons only highlight a route; they never move or enter the game.
 */
export function Floor3DWayfinder({
  pose, game, onSelect, onClose,
}: {
  pose: Floor3DPose;
  game: FloorGame | null;
  onSelect: (game: FloorGame) => void;
  onClose: () => void;
}) {
  const [details, setDetails] = useState(false);
  const route = useMemo(
    () => game ? findFloor3DRoute(pose, game) : null,
    [pose.x, pose.z, pose.yaw, game],
  );
  const destination = FLOOR3D_STATIONS.find((s) => s.game === game);
  const path = route?.points.map((p) => `${px(p.x).toFixed(1)},${py(p.z).toFixed(1)}`).join(" ") ?? "";

  return (
    <aside aria-label="3D casino floor map" className="pointer-events-auto absolute left-3 top-16 z-30 flex max-h-[calc(100%-5rem)] w-[min(22rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-xl border border-gold/70 bg-ink/95 text-cream shadow-xl">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gold/30 px-3 py-2">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.15em] text-gold">The Gaming Floor</p>
          <h3 className="font-display text-lg italic">Floor map & wayfinder</h3>
        </div>
        <button type="button" onClick={onClose} className="press min-h-11 rounded-full border border-line px-3 text-xs text-gold">
          Close map
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto px-3 pb-3 pt-2">
        <p className="mb-2 text-xs leading-relaxed text-cream-dim">
          Choose a table below. Gold shows the clear walking route; blue shows your position and heading.
        </p>
        <svg viewBox="0 0 260 370" role="img" aria-label="Top-down 3D casino layout. Eight solid tables are arranged in pairs on either side of the central aisle. Blue marker is your current position; gold is the selected route."
          className="mx-auto block h-auto w-full max-w-[240px] rounded-lg border border-line bg-[#140c16]">
          <rect x="8" y="9" width="244" height="346" rx="7" fill="#24151e" stroke="#977348" strokeWidth="2"/>
          <rect x={px(-1.6)} y="16" width="44.8" height="331" fill="#68253f" opacity="0.75"/>
          <path d="M130 16 V345" stroke="#e7bf67" strokeDasharray="3 6" strokeWidth="1" opacity="0.55"/>
          {FLOOR3D_STATIONS.map((s) => (
            <g key={s.id}>
              <rect x={px(s.x - FLOOR3D_TABLE_CLEARANCE_X)} y={py(s.z - FLOOR3D_TABLE_CLEARANCE_Z)}
                width={FLOOR3D_TABLE_CLEARANCE_X * 28} height={FLOOR3D_TABLE_CLEARANCE_Z * 28}
                fill={s.game === game ? "#b08b4b" : "#235247"} stroke={s.game === game ? "#ffe6a4" : "#79a797"}
                strokeWidth={s.game === game ? 2.3 : 1} rx="3" />
              <text x={px(s.x)} y={py(s.z) + 2} fontSize="8" fontWeight="bold"
                textAnchor="middle" fill="#fff7df">
                {s.name}
              </text>
            </g>
          ))}
          {route && (
            <polyline points={path} fill="none" stroke="#ffd274" strokeWidth="3"
              strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 4" />
          )}
          <g transform={`translate(${px(pose.x)} ${py(pose.z)}) rotate(${pose.yaw * 180 / Math.PI})`}>
            <path d="M0 -12 L7 8 L0 4 L-7 8 Z" fill="#8de6ff" stroke="#0e3547" strokeWidth="2" />
          </g>
          <text x="130" y="365" textAnchor="middle" fontSize="10" fill="#ebce96">ENTRANCE / SOUTH</text>
          <text x="130" y="14" textAnchor="middle" fontSize="8" fill="#ebce96">NORTH</text>
        </svg>

        <div className="mt-2 rounded-lg border border-line bg-ink-2 p-2" aria-live="polite">
          <p className="text-sm font-semibold text-gold">{destination?.name ?? "No table selected"}</p>
          <p className="text-xs text-cream-dim">{destination?.hint ?? "Pick a destination to highlight a safe route."}</p>
          {game ? (
            <p className="mt-1 text-xs text-cream">
              {route ? `${route.meters.toFixed(1)} m along the marked walking path. ${floor3DHeading(pose, route)}`
                : "A walking route couldn't be found. Use the room shortcuts below."}
            </p>
          ) : null}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1" role="group" aria-label="Choose map destination">
          {FLOOR3D_STATIONS.map((s) => (
            <button type="button" key={s.id} onClick={() => onSelect(s.game)}
              aria-pressed={s.game === game}
              className={`press min-h-10 rounded-lg border px-2 py-1 text-left text-xs ${s.game === game ? "border-gold bg-gold/20 text-gold" : "border-line bg-panel text-cream"}`}>
              {s.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setDetails((v) => !v)}
          aria-expanded={details} className="mt-2 min-h-9 text-xs text-gold underline underline-offset-2">
          {details ? "Hide guidance details" : "How to use this map"}
        </button>
        {details ? (
          <p className="text-xs leading-relaxed text-cream-dim">
            Routes go around solid tables but are approximate, using a half-meter floor grid. Follow the gold line by walking and turning manually. Selecting a map destination does not teleport you, launch a game, alter chips, or save anything. Press F beside a table to enter, or use the existing shortcuts.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
