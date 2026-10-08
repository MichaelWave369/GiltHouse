import { useEffect, useRef } from "react";
import { osc } from "@/lib/casino/motion";

export function Bartender({ place = "side" }: { place?: "side" | "bar" }) {
  const body = useRef<SVGGElement>(null);
  const arm = useRef<SVGGElement>(null);
  const shaker = useRef<SVGGElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    let alive = true;
    const started = performance.now();
    const loop = (now: number) => {
      if (!alive) return;
      const time = (now - started) / 1000;
      const sway = osc(time, 1.15) * 1.6;
      const wipe = osc(time, 1.85, 0.4) * 16;
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

  return (
    <div
      className={
        place === "side"
          ? "pointer-events-none fixed top-24 right-3 z-20 hidden w-52 min-[1180px]:block"
          : "pointer-events-none relative z-20 mb-4 w-full min-[1180px]:hidden"
      }
      aria-hidden
    >
      <div className="piano-rail rounded-2xl border border-line bg-ink-2/95 px-3 pt-2 pb-2">
        <p className="text-xs tracking-widest text-cream-dim uppercase">The bar</p>
        <svg viewBox="0 0 160 108" className="mt-1 h-24 w-full">
          <rect x="8" y="78" width="144" height="18" rx="3" fill="var(--color-oxblood)" />
          <rect x="8" y="78" width="144" height="5" fill="var(--color-gold)" opacity="0.85" />
          <g ref={shaker}>
            <rect x="104" y="28" width="14" height="36" rx="3" fill="var(--color-cream)" />
            <rect x="106" y="22" width="10" height="8" rx="2" fill="var(--color-gold)" />
          </g>
          <rect x="124" y="40" width="8" height="32" rx="2" fill="var(--color-felt)" />
          <rect x="136" y="48" width="8" height="24" rx="2" fill="var(--color-gold)" />
          <g ref={body}>
            <path d="M28 80c2-22 8-34 18-34s16 12 18 34" fill="var(--color-ink)" />
            <path d="M42 52l6 16h-12z" fill="var(--color-cream)" />
            <path d="M40 54h10" stroke="var(--color-gold)" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="46" cy="34" r="12" fill="var(--color-cream-dim)" />
            <path d="M34 34c1-14 24-14 24 1-2-8-22-10-24-1z" fill="var(--color-ink)" />
            <g ref={arm}>
              <path
                d="M58 62c16 2 28-6 40-16"
                fill="none"
                stroke="var(--color-cream-dim)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="98" cy="46" r="3.2" fill="var(--color-cream)" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
