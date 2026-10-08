import { useEffect, useRef } from "react";
import { osc } from "@/lib/casino/motion";

type Puff = { x: number; y: number; r: number; speed: number; seed: number; alpha: number };

function makePuffs(): Puff[] {
  return Array.from({ length: 28 }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    r: 28 + Math.random() * 70,
    speed: 0.012 + Math.random() * 0.02,
    seed: index * 1.7,
    alpha: 0.035 + Math.random() * 0.06,
  }));
}

export function Smoke() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("2d");
    if (!gl) return;
    const puffs = makePuffs();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let alive = true;
    const paint = (time: number) => {
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
          puff.y -= puff.speed * 0.016;
          if (puff.y < -0.12) puff.y = 1.08;
        }
        const drift = osc(time, 0.35 + puff.seed * 0.01, puff.seed) * 36;
        const x = puff.x * width + drift;
        const y = puff.y * height;
        const fade = gl.createRadialGradient(x, y, 0, x, y, puff.r);
        fade.addColorStop(0, `rgba(247, 237, 214, ${puff.alpha})`);
        fade.addColorStop(0.45, `rgba(230, 195, 106, ${puff.alpha * 0.45})`);
        fade.addColorStop(1, "rgba(247, 237, 214, 0)");
        gl.fillStyle = fade;
        gl.beginPath();
        gl.arc(x, y, puff.r, 0, Math.PI * 2);
        gl.fill();
      }
    };
    const loop = (now: number) => {
      if (!alive) return;
      paint(now / 1000);
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[1] h-full w-full" aria-hidden />;
}
