import { useEffect, useRef } from "react";
import type { WireGame } from "@/lib/casino/sports";
import { signed } from "@/lib/casino/sports";

function paintCard(game: WireGame) {
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

export function WireBoard({ games }: { games: WireGame[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const featured = games.filter((game) => game.state !== "post").slice(0, 2);
  const sig = featured.map((game) => `${game.eventId}:${game.spreadHome}:${game.homeScore}:${game.awayScore}`).join("|");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || featured.length === 0) return;
    let dead = false;
    let raf = 0;
    const cleanups: Array<() => void> = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    void (async () => {
      const THREE = await import("three");
      if (dead || !canvasRef.current) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 20);
      camera.position.set(0, 0.2, 4.6);
      camera.lookAt(0, 0, 0);
      const group = new THREE.Group();
      scene.add(group);
      const width = 1.28;
      const gap = 1.48;
      featured.forEach((game, index) => {
        const texture = new THREE.CanvasTexture(paintCard(game));
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.72), material);
        const x = (index - (featured.length - 1) / 2) * gap;
        mesh.position.set(x, 0, -Math.abs(x) * 0.08);
        mesh.rotation.y = -x * 0.12;
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
      const draw = (now: number) => {
        const t = now / 1000;
        group.rotation.y = reduce ? 0 : Math.sin(t * 0.35) * 0.22;
        group.position.y = reduce ? 0 : Math.sin(t * 0.7) * 0.03;
        renderer.render(scene, camera);
      };
      if (reduce) draw(0);
      else {
        const loop = (now: number) => {
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
  return (
    <canvas
      ref={canvasRef}
      className="mb-4 h-52 w-full rounded-xl border border-line bg-ink/40"
      aria-hidden
    />
  );
}
