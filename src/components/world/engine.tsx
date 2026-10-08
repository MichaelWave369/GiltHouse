import { useEffect, useRef } from "react";
import { playStreetCue, setBlockMusic, setBlockVariant, setLounge, setStreetMix, unlockAudio } from "@/lib/casino/audio";
import { renderFrame, VIEW_H, VIEW_W } from "@/lib/world/draw";
import { useWorld } from "@/lib/world/store";
import { WorldOverlay } from "@/components/world/overlay";

type Probe = {
  getX: () => number;
  getFacing: () => number;
  setKeys: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: Probe;
  }
}

export function NeonStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef(new Set<string>());
  const boot = useWorld((s) => s.boot);
  const world = useWorld((s) => s.world);
  const prefs = world.prefs;
  const jukebox = world.jukebox;

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    setLounge(false);
    const musicOn = !prefs.mute && prefs.music > 0.01;
    setBlockMusic(musicOn);
    setStreetMix(prefs.mute ? 0 : prefs.music, prefs.mute ? 0 : prefs.sfx);
    setBlockVariant(jukebox);
    return () => setBlockMusic(false);
  }, [prefs.mute, prefs.music, prefs.sfx, jukebox]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      unlockAudio();
      if (event.repeat) return;
      keys.current.add(event.code);
      if (event.code === "Escape") {
        const state = useWorld.getState();
        if (state.arcade) state.closeArcade();
        else if (state.talk) state.closeTalk();
        else if (state.panel === "create") return;
        else if (state.panel === "intro") state.dismissIntro();
        else if (state.panel !== "none") state.closePanel();
        else state.openPanel("pause");
      }
      if (event.code === "KeyE" || event.code === "Enter") {
        const state = useWorld.getState();
        if (!state.talk && !state.arcade) state.interact();
      }
      if (event.code === "KeyW" || event.code === "ArrowUp") {
        const state = useWorld.getState();
        if (!state.talk && !state.arcade && state.panel === "none") state.interact();
      }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    const onHide = () => {
      if (document.visibilityState === "hidden") useWorld.getState().save();
    };
    document.addEventListener("visibilitychange", onHide);
    window.__controlsTest = {
      getX: () => useWorld.getState().world.x,
      getFacing: () => useWorld.getState().world.facing,
      setKeys: (codes) => {
        keys.current = new Set(codes);
      },
    };
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", onHide);
      delete window.__controlsTest;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const buffer = document.createElement("canvas");
    buffer.width = VIEW_W;
    buffer.height = VIEW_H;
    const bctx = buffer.getContext("2d");
    if (!canvas || !bctx) return;
    let frame = 0;
    let last = performance.now();
    let walkPhase = 0;
    let stepClock = 0;
    let encounterClock = 0;
    let saveClock = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const state = useWorld.getState();
      const panelBlocks = state.panel !== "none" && state.panel !== "intro";
      const locked = panelBlocks || Boolean(state.talk) || Boolean(state.arcade);
      const left = keys.current.has("KeyA") || keys.current.has("ArrowLeft");
      const right = keys.current.has("KeyD") || keys.current.has("ArrowRight");
      let dir: -1 | 0 | 1 = 0;
      if (!locked) {
        if (left && !right) dir = -1;
        else if (right && !left) dir = 1;
      }
      if (dir !== 0) state.move(dir, dt);
      const walking = dir !== 0;
      state.step(dt, walking);
      if (walking) {
        walkPhase += dt * 8;
        stepClock += dt;
        encounterClock += dt;
        if (stepClock > 0.38) {
          stepClock = 0;
          const prefsNow = useWorld.getState().world.prefs;
          playStreetCue("step", !prefsNow.mute && prefsNow.sfx > 0);
        }
        if (encounterClock > 7) {
          encounterClock = 0;
          useWorld.getState().tryEncounter();
        }
      } else {
        encounterClock = Math.max(0, encounterClock - dt);
      }
      saveClock += dt;
      if (saveClock > 8) {
        saveClock = 0;
        useWorld.getState().save();
      }
      const latest = useWorld.getState().world;
      const reduced =
        latest.prefs.reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      renderFrame(bctx, latest, { time: now / 1000, walking, walkPhase, reduced });
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        const bw = Math.max(1, Math.floor(cssW * dpr));
        const bh = Math.max(1, Math.floor(cssH * dpr));
        if (canvas.width !== bw || canvas.height !== bh) {
          canvas.width = bw;
          canvas.height = bh;
        }
        const scale = Math.max(1, Math.floor(Math.min(bw / VIEW_W, bh / VIEW_H)));
        const dw = VIEW_W * scale;
        const dh = VIEW_H * scale;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#100c0a";
        ctx.fillRect(0, 0, bw, bh);
        ctx.drawImage(buffer, Math.floor((bw - dw) / 2), Math.floor((bh - dh) / 2), dw, dh);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  function hold(code: string, on: boolean) {
    unlockAudio();
    if (on) keys.current.add(code);
    else keys.current.delete(code);
  }

  return (
    <div className="world-root flex flex-col">
      <div className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} className="pixel-screen h-full w-full touch-none" aria-label="The Neon Block" />
        <WorldOverlay />
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-line bg-ink px-3 py-3 md:hidden">
        <button
          type="button"
          className="press h-14 rounded-2xl border border-line bg-ink-2 text-sm font-medium text-cream"
          onPointerDown={() => hold("KeyA", true)}
          onPointerUp={() => hold("KeyA", false)}
          onPointerLeave={() => hold("KeyA", false)}
        >
          Left
        </button>
        <button
          type="button"
          className="press h-14 rounded-2xl bg-gold text-sm font-medium text-ink"
          onClick={() => {
            unlockAudio();
            useWorld.getState().interact();
          }}
        >
          Act
        </button>
        <button
          type="button"
          className="press h-14 rounded-2xl border border-line bg-ink-2 text-sm font-medium text-cream"
          onPointerDown={() => hold("KeyD", true)}
          onPointerUp={() => hold("KeyD", false)}
          onPointerLeave={() => hold("KeyD", false)}
        >
          Right
        </button>
      </div>
    </div>
  );
}
