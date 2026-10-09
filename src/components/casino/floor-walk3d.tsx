import { useEffect, useRef, useState } from "react";
import {
  canOpenFloor3DTable,
  clampFloor3DCamera,
  FLOOR3D_SPAWN,
  FLOOR3D_STATIONS,
  nearestFloor3DTable,
  validFloor3DGame,
  type FloorGame,
} from "@/lib/casino/floor3d";

type Motion = "forward" | "back" | "left" | "right" | "turnLeft" | "turnRight";
const DIRECTION_BUTTONS: readonly { id: Motion; name: string }[] = [
  { id: "turnLeft", name: "Turn left" }, { id: "forward", name: "Forward" },
  { id: "turnRight", name: "Turn right" }, { id: "left", name: "Sidestep left" },
  { id: "back", name: "Back" }, { id: "right", name: "Sidestep right" },
];

/**
 * Opt-in visual floor, no game logic. R11 loads Three only after opening
 * the showroom. Every actual game remains the original Gilt House React game.
 */
export function FloorWalk3D({
  onClose,
  onChoose,
}: {
  onClose: () => void;
  onChoose: (game: FloorGame) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const held = useRef(new Set<Motion>());
  const [phase, setPhase] = useState<"loading" | "ready" | "fallback">("loading");
  const [nearGame, setNearGame] = useState<FloorGame | null>(null);
  const [notice, setNotice] = useState("");
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => { roomRef.current?.focus(); }, []);

  useEffect(() => {
    const liveCanvas = canvasRef.current;
    if (!liveCanvas) return;
    const element: HTMLCanvasElement = liveCanvas;

    let disposed = false;
    let raf = 0;
    let observer: ResizeObserver | undefined;
    let scene: { traverse: (visit: (object: unknown) => void) => void } | undefined;
    let renderer: {
      setSize: (width: number, height: number, updateStyle: boolean) => void;
      render: (scene: unknown, camera: unknown) => void;
      dispose: () => void;
    } | undefined;
    const textures: Array<{ dispose: () => void }> = [];
    const input = held.current;
    let x: number = FLOOR3D_SPAWN.x;
    let z: number = FLOOR3D_SPAWN.z;
    let yaw = 0;
    let oldFrame = 0;
    let currentGame: FloorGame | null = null;
    let start: { x: number; y: number } | null = null;
    let pointerX: number | null = null;
    let dragged = false;
    let tapTable: ((clientX: number, clientY: number) => void) | undefined;

    const keyMap: Record<string, Motion> = {
      KeyW: "forward", ArrowUp: "forward",
      KeyS: "back", ArrowDown: "back",
      KeyA: "left", KeyD: "right",
      KeyQ: "turnLeft", ArrowLeft: "turnLeft",
      KeyE: "turnRight", ArrowRight: "turnRight",
    };
    function down(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, [contenteditable='true']")) return;
      if (event.code === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.code === "KeyF" || event.code === "Enter") {
        const table = nearestFloor3DTable(x, z);
        if (table && canOpenFloor3DTable(table.game, x, z)) {
          event.preventDefault();
          onChoose(table.game);
        }
        return;
      }
      const motion = keyMap[event.code];
      if (!motion) return;
      event.preventDefault();
      input.add(motion);
    }
    function up(event: KeyboardEvent) {
      const motion = keyMap[event.code];
      if (motion) input.delete(motion);
    }
    function release() {
      input.clear();
      start = null;
      pointerX = null;
      dragged = false;
    }
    function pointerDown(event: PointerEvent) {
      start = { x: event.clientX, y: event.clientY };
      pointerX = event.clientX;
      dragged = false;
      try { element?.setPointerCapture(event.pointerId); } catch { /* browser may refuse */ }
    }
    function pointerMove(event: PointerEvent) {
      if (pointerX === null) return;
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) dragged = true;
      yaw = Math.max(-1.4, Math.min(1.4, yaw + (event.clientX - pointerX) * 0.004));
      pointerX = event.clientX;
    }
    function pointerUp(event: PointerEvent) {
      const tap = start && !dragged && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8;
      start = null;
      pointerX = null;
      dragged = false;
      if (tap) tapTable?.(event.clientX, event.clientY);
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    element.addEventListener("pointerdown", pointerDown);
    element.addEventListener("pointermove", pointerMove);
    element.addEventListener("pointerup", pointerUp);
    element.addEventListener("pointercancel", release);

    void (async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;
        const gl = new THREE.WebGLRenderer({ canvas: element, antialias: true, powerPreference: "low-power" });
        renderer = gl;
        gl.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
        gl.setClearColor(0x0b0910);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.18;

        const world = new THREE.Scene();
        scene = world;
        world.background = new THREE.Color(0x100910);
        world.fog = new THREE.FogExp2(0x120b14, 0.023);
        world.add(new THREE.HemisphereLight(0xfbd4ab, 0x312033, 1.6));
        const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 70);

        function cuboid(px: number, py: number, pz: number, w: number, h: number, d: number, color: number, metal = 0.15) {
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: 0.47 }),
          );
          mesh.position.set(px, py, pz);
          world.add(mesh);
          return mesh;
        }
        function cylinder(px: number, py: number, pz: number, r: number, h: number, color: number) {
          const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(r, r, h, 24),
            new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.32 }),
          );
          mesh.position.set(px, py, pz);
          world.add(mesh);
          return mesh;
        }
        function light(px: number, py: number, pz: number, color: number, intensity: number) {
          const lamp = new THREE.PointLight(color, intensity, 7, 2);
          lamp.position.set(px, py, pz);
          world.add(lamp);
        }
        function sign(text: string, color: number, width: number) {
          const art = document.createElement("canvas");
          art.width = 512;
          art.height = 128;
          const ctx = art.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#150e17";
            ctx.fillRect(0, 0, 512, 128);
            ctx.lineWidth = 7;
            ctx.strokeStyle = "#b08b52";
            ctx.strokeRect(8, 8, 496, 112);
            ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
            ctx.font = "bold 38px Georgia, serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, 256, 66, 455);
          }
          const texture = new THREE.CanvasTexture(art);
          texture.colorSpace = THREE.SRGBColorSpace;
          textures.push(texture);
          const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(width, 0.72),
            new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
          );
          world.add(mesh);
          return mesh;
        }

        // Original casino hall: eight game stations, central carpet, brass rails,
        // ceiling lights, columns, and decorative game-table apparatus.
        cuboid(0, -0.2, 0, 19, 0.4, 28, 0x20131d, 0.31);
        cuboid(0, 5.9, 0, 19, 0.3, 28, 0x2e1725);
        cuboid(-9.3, 2.9, 0, 0.36, 5.8, 28, 0x3f1a2c);
        cuboid(9.3, 2.9, 0, 0.36, 5.8, 28, 0x3f1a2c);
        cuboid(0, 2.9, -13.7, 19, 5.8, 0.35, 0x371721);
        cuboid(0, 2.9, 13.7, 19, 5.8, 0.35, 0x371721);
        cuboid(0, 0.045, 0, 3.2, 0.025, 24, 0x671c38);
        for (const side of [-1, 1]) {
          cuboid(side * 1.66, 0.075, 0, 0.075, 0.05, 24, 0xd3af64, 0.82);
          for (const zpos of [-11, -6, -1, 4, 9]) {
            cuboid(side * 8.5, 2.65, zpos, 0.62, 5.3, 0.64, 0x976e41, 0.72);
            cuboid(side * 8.5, 5.2, zpos, 0.9, 0.23, 0.9, 0xe2bc69, 0.78);
            light(side * 7.6, 3.8, zpos, 0xffa65f, 2.6);
          }
        }
        for (const zpos of [-9, -2, 5, 11]) {
          cylinder(0, 5.2, zpos, 0.13, 1.1, 0xc6a160);
          const lamp = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.48, 1),
            new THREE.MeshStandardMaterial({ color: 0xffd0a0, emissive: 0xc27843, emissiveIntensity: 0.36 }),
          );
          lamp.position.set(0, 4.65, zpos);
          world.add(lamp);
          light(0, 4.45, zpos, 0xffbd80, 8);
        }

        // Raycast *only* the physical table surfaces, no invisible hitboxes
        // that cover other parts of the world. Proximity remains mandatory.
        const targets: Array<ReturnType<typeof cuboid>> = [];
        for (const station of FLOOR3D_STATIONS) {
          const sx = station.x;
          const sz = station.z;
          cuboid(sx, 0.27, sz, 3, 0.55, 2.15, 0x60353c, 0.4);
          const felt = cuboid(sx, 0.61, sz, 2.8, 0.12, 1.95,
            station.shape === "reels" ? 0x3d234c : 0x145045, 0.12);
          felt.userData.game = station.game;
          targets.push(felt);
          const name = sign(station.name, station.color, 2.95);
          name.position.set(sx, 2.62, sz - 0.9);
          light(sx, 2.9, sz - 0.25, station.color, 3.2);
          for (const side of [-1, 1]) {
            cuboid(sx + side * 1.39, 0.85, sz, 0.12, 0.28, 2.15, 0xd1a55c, 0.7);
          }
          if (station.shape === "wheel") {
            cylinder(sx, 0.82, sz, 0.77, 0.28, 0xa77f44);
            cylinder(sx, 1.0, sz, 0.43, 0.11, 0x211725);
          } else if (station.shape === "reels") {
            for (const side of [-1, 0, 1]) {
              const reel = cuboid(sx + side * 0.7, 1.02, sz, 0.55, 0.64, 0.38, 0xe6c6a0, 0.2);
              reel.userData.game = station.game;
              targets.push(reel);
            }
          } else if (station.shape === "cards") {
            for (let i = 0; i < 3; i++) {
              cuboid(sx - 0.65 + i * 0.65, 0.74, sz, 0.48, 0.04, 0.7, 0xf1e4c2);
            }
          } else if (station.shape === "rail") {
            cuboid(sx, 0.87, sz, 2.4, 0.38, 0.09, 0xd3a65b, 0.6);
          } else {
            cylinder(sx, 0.9, sz, 0.45, 0.36, 0xd0c5a9);
          }
        }
        const marquee = sign("THE GAMING FLOOR", 0xe9c267, 6.5);
        marquee.position.set(0, 4.8, -13.46);
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        function size() {
          if (!renderer || disposed) return;
          const width = Math.max(1, element.clientWidth);
          const height = Math.max(1, element.clientHeight);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
        observer = new ResizeObserver(size);
        observer.observe(element);
        size();

        tapTable = (clientX, clientY) => {
          const bounds = element.getBoundingClientRect();
          if (!bounds.width || !bounds.height) return;
          pointer.set(2 * (clientX - bounds.left) / bounds.width - 1,
            1 - 2 * (clientY - bounds.top) / bounds.height);
          raycaster.setFromCamera(pointer, camera);
          const candidate = raycaster.intersectObjects(targets, false)[0];
          const game: unknown = candidate?.object.userData.game;
          if (typeof game !== "string" || !validFloor3DGame(game)) return;
          if (!canOpenFloor3DTable(game, x, z)) {
            setNotice("Walk closer to that table, then tap or press F.");
            return;
          }
          onChoose(game);
        };

        function animate(stamp: number) {
          if (disposed || !renderer) return;
          const dt = Math.min(0.04, oldFrame ? (stamp - oldFrame) / 1000 : 0);
          oldFrame = stamp;
          const turning = Number(input.has("turnRight")) - Number(input.has("turnLeft"));
          yaw = Math.max(-1.4, Math.min(1.4, yaw + turning * dt * 1.3));
          const forward = Number(input.has("forward")) - Number(input.has("back"));
          const strafe = Number(input.has("right")) - Number(input.has("left"));
          if (forward || strafe) {
            const projected = clampFloor3DCamera(
              x + (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * dt * 3.3,
              z + (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) * dt * 3.3,
            );
            x = projected.x;
            z = projected.z;
          }
          camera.position.set(x, 1.65, z);
          camera.lookAt(x + Math.sin(yaw), 1.75, z - Math.cos(yaw));
          const target = nearestFloor3DTable(x, z)?.game ?? null;
          if (target !== currentGame) {
            currentGame = target;
            setNearGame(target);
            setNotice("");
          }
          if (!reduced) marquee.scale.setScalar(1 + Math.sin(stamp * 0.0005) * 0.003);
          renderer.render(world, camera);
          raf = requestAnimationFrame(animate);
        }
        if (!disposed) {
          setPhase("ready");
          raf = requestAnimationFrame(animate);
        }
      } catch (e) {
        if (!disposed) {
          console.warn("Gilt House 3D gaming floor unavailable", e);
          setPhase("fallback");
        }
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
      element.removeEventListener("pointerdown", pointerDown);
      element.removeEventListener("pointermove", pointerMove);
      element.removeEventListener("pointerup", pointerUp);
      element.removeEventListener("pointercancel", release);
      input.clear();
      scene?.traverse((node: unknown) => {
        if (typeof node !== "object" || node === null || !("isMesh" in node)) return;
        const mesh = node as unknown as {
          geometry: { dispose: () => void };
          material: { dispose: () => void } | Array<{ dispose: () => void }>;
        };
        mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) material.dispose();
      });
      for (const texture of textures) texture.dispose();
      renderer?.dispose();
    };
  }, [onChoose, onClose, reduced]);

  const near = FLOOR3D_STATIONS.find((s) => s.game === nearGame);
  return (
    <div ref={roomRef} tabIndex={-1} role="dialog" aria-modal="true"
      aria-label="Gilt House 3D gaming floor"
      className="fixed inset-0 z-50 flex flex-col bg-ink text-cream">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gold/30 px-4 py-2">
        <div>
          <p className="text-[0.65rem] uppercase tracking-widest text-gold">Gilt House · Optional 3D</p>
          <h2 className="font-display text-xl italic">The Gaming Floor</h2>
        </div>
        <button type="button" onClick={onClose}
          className="press min-h-11 rounded-full border border-gold px-4 text-sm text-gold">
          Back to casino directory
        </button>
      </header>
      <div className="relative min-h-0 flex-1 bg-[#120b14]">
        <canvas ref={canvasRef} className="h-full w-full touch-none"
          aria-label="Walkable Three.js Gilt House gaming floor with eight decorative casino tables" />
        <p className="pointer-events-none absolute left-3 top-3 max-w-xs rounded-lg border border-gold/30 bg-ink/90 p-3 text-xs text-cream">
          <strong className="text-gold">WASD walk · Q/E turn · F enter nearby table</strong>
          <span className="mt-1 block text-cream-dim">Drag to look around. Tap tables when close, or use the directory below.</span>
        </p>
        {phase === "ready" && near ? (
          <button type="button" onClick={() => onChoose(near.game)}
            className="press absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-gold bg-ink/95 px-4 py-3 text-sm font-semibold text-gold">
            F · Enter {near.name}
          </button>
        ) : null}
        {notice && phase === "ready" ? <p role="status" className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 rounded-lg bg-ink/90 px-3 py-2 text-xs text-gold">{notice}</p> : null}
        {phase !== "ready" ? (
          <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/70 p-6 text-center text-sm text-cream">
            {phase === "loading" ? "Preparing the Gilt House gaming floor…" : "3D graphics aren't supported here. The full casino directory below still works."}
          </div>
        ) : null}
      </div>
      <section aria-label="Casino games" className="shrink-0 border-t border-line bg-ink px-3 py-2">
        <div className="mx-auto grid max-w-5xl grid-cols-4 gap-1 sm:grid-cols-8">
          {FLOOR3D_STATIONS.map((station) => (
            <button type="button" key={station.id} onClick={() => onChoose(station.game)}
              className="press min-h-11 rounded-lg border border-line bg-panel p-1 text-center text-[0.65rem] font-semibold text-gold hover:border-gold">
              {station.name}
            </button>
          ))}
        </div>
        <div className="mx-auto mt-2 grid max-w-sm grid-cols-3 gap-1 sm:hidden" aria-label="Touch movement controls">
          {DIRECTION_BUTTONS.map((control) => (
            <button type="button" key={control.id}
              onPointerDown={() => held.current.add(control.id)}
              onPointerUp={() => held.current.delete(control.id)}
              onPointerCancel={() => held.current.delete(control.id)}
              onPointerLeave={() => held.current.delete(control.id)}
              className="press min-h-10 rounded-lg border border-line bg-ink-2 text-[0.65rem]">
              {control.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[0.65rem] text-cream-dim">
          Visual-only 3D navigation · Existing browser-local play chips · No cash, no cash-out, no new wagers
        </p>
      </section>
    </div>
  );
}
