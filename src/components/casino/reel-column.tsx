import { useEffect, useRef, useState, type ReactNode } from "react";

type Mode = "rest" | "spin" | "stop";

export function ReelColumn<T>({
  stopped,
  rolling,
  rows,
  next,
  render,
}: {
  stopped: T[];
  rolling: boolean;
  rows: number;
  next: () => T;
  render: (item: T, index: number) => ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const rollingRef = useRef(rolling);
  const stoppedRef = useRef(stopped);
  const nextRef = useRef(next);
  rollingRef.current = rolling;
  stoppedRef.current = stopped;
  nextRef.current = next;
  const [strip, setStrip] = useState<T[]>(() => [...stopped, stopped[0] ?? stopped[0]].filter(Boolean) as T[]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    let y = 0;
    let mode: Mode = "rest";
    let alive = true;
    const loop = () => {
      if (!alive) return;
      const node = track.current;
      const child = node?.firstElementChild as HTMLElement | undefined;
      const step = child ? child.offsetHeight + 8 : 72;
      if (mode === "rest" && rollingRef.current) mode = "spin";
      if (mode === "spin" && !rollingRef.current) {
        mode = "stop";
        const finalStrip = stoppedRef.current.slice(0, rows);
        setStrip((prev) => {
          const top = prev[0];
          return top === undefined ? finalStrip : [top, ...finalStrip];
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
        y += 420 / 60;
        if (y >= step) {
          y = 0;
          mode = "rest";
          const finalStrip = stoppedRef.current.slice(0, rows);
          const extra = finalStrip[0];
          setStrip(extra === undefined ? finalStrip : [...finalStrip, extra]);
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

  useEffect(() => {
    if (rolling) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) return;
    const extra = stopped[0];
    setStrip(extra === undefined ? stopped.slice(0, rows) : [...stopped.slice(0, rows), extra]);
  }, [rolling, rows, stopped]);

  return (
    <div className="relative">
      <div className="invisible grid gap-2" aria-hidden>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="aspect-square" />
        ))}
      </div>
      <div className="absolute inset-0 overflow-hidden">
        <div ref={track} className="grid gap-2">
          {strip.map((item, index) => (
            <div key={index}>{render(item, index)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
