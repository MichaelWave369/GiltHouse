import { useEffect, useRef, useState } from "react";

const WHITES = [0, 1, 2, 3, 4, 5, 6];
const BLACKS = [
  { key: 7, left: "10%" },
  { key: 8, left: "24%" },
  { key: 9, left: "52%" },
  { key: 10, left: "66%" },
  { key: 11, left: "80%" },
];

export function Pianist({ place = "side" }: { place?: "side" | "bar" }) {
  const [lit, setLit] = useState<number[]>([]);
  const timer = useRef(0);

  useEffect(() => {
    const onPlay = (event: Event) => {
      const keys = (event as CustomEvent<{ keys: number[] }>).detail?.keys ?? [];
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
  const focus = whites.length ? whites.reduce((sum, key) => sum + key, 0) / whites.length : 3;
  const hand = `${8 + focus * 11}%`;

  return (
    <div
      className={
        place === "side"
          ? "pointer-events-none fixed top-24 left-3 z-20 hidden w-52 min-[1180px]:block"
          : "pointer-events-none relative z-20 mb-4 w-full min-[1180px]:hidden"
      }
      aria-hidden
    >
      <div className="piano-rail flex items-end gap-2 rounded-2xl border border-line bg-ink-2/95 px-2.5 pt-2 pb-2.5">
        <svg viewBox="0 0 72 96" className="pianist-sway h-20 w-14 shrink-0">
          <rect x="12" y="80" width="40" height="5" rx="1.5" fill="var(--color-oxblood)" />
          <path d="M20 84v8M44 82v10" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" />
          <path d="M22 48c-1 12 0 26 4 34h24c3-10 1-24-2-34-6 5-16 6-26 0z" fill="var(--color-ink)" />
          <path d="M34 50l5 18h-10z" fill="var(--color-cream)" />
          <path d="M31 52h8" stroke="var(--color-gold)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M28 52l-4 2M42 52l4 2" stroke="var(--color-gold)" strokeWidth="1.4" strokeLinecap="round" />
          <g className="pianist-arm">
            <path
              d="M40 54c12 2 22 10 28 20"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <circle cx="68" cy="74" r="3" fill="var(--color-cream)" />
          </g>
          <circle cx="36" cy="32" r="12" fill="var(--color-cream-dim)" />
          <path d="M24 34c1-16 24-16 24 2-2-10-22-12-24-2z" fill="var(--color-ink)" />
        </svg>
        <div className="min-w-0 flex-1 pb-0.5">
          <p className="mb-1 text-xs tracking-widest text-cream-dim uppercase">House piano</p>
          <div className="relative h-12 rounded-md bg-ink px-1 pt-1.5 pb-1.5">
            <div className="pianist-hands absolute top-0 z-10 flex gap-2" style={{ left: hand }}>
              <span className="size-2.5 rounded-full bg-cream" />
              <span className="size-2.5 rounded-full bg-cream-dim" />
            </div>
            <div className="flex h-full gap-px">
              {WHITES.map((key) => (
                <span
                  key={key}
                  className={`h-full flex-1 rounded-sm transition-colors duration-300 ease-out ${
                    lit.includes(key) ? "bg-gold" : "bg-cream"
                  }`}
                />
              ))}
            </div>
            {BLACKS.map((key) => (
              <span
                key={key.key}
                className={`absolute top-1.5 h-6 w-2.5 -translate-x-1/2 rounded-sm transition-colors duration-300 ease-out ${
                  lit.includes(key.key) ? "bg-gold" : "bg-ink"
                }`}
                style={{ left: key.left }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
