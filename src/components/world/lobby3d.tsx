import { useEffect, useRef, useState } from "react";
import {
  clampLobbyCamera,
  LOBBY_STATIONS,
  validLobbyStation,
} from "@/lib/world/lobby3d";
import { useWorld } from "@/lib/world/store";

type Motion = "forward" | "back" | "left" | "right" | "turnLeft" | "turnRight";

const CONTROLS: readonly { action: Motion; label: string }[] = [
  { action: "turnLeft", label: "Turn left" },
  { action: "forward", label: "Forward" },
  { action: "turnRight", label: "Turn right" },
  { action: "left", label: "Sidestep left" },
  { action: "back", label: "Back" },
  { action: "right", label: "Sidestep right" },
];

/**
 * Three.js is loaded ONLY after the player explicitly enters the 3D lobby.
 * This is a visual navigation room: all wagering/math/auth/quests remain in
 * the existing Gilt House application. No scene progress or balances are saved.
 */
export function GiltLobby3D() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pressed = useRef(new Set<Motion>());
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [note, setNote] = useState("");
  const reduced = useWorld((s) => s.world.prefs.reduced);
  const exit = () => useWorld.getState().closePanel();

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let resize: ResizeObserver | undefined;
    let renderer: import("three").WebGLRenderer | undefined;
    let stage: import("three").Scene | undefined;
    const textureBag: import("three").Texture[] = [];
    let yaw = 0;
    let cx = 0;
    let cz = 8;
    let pointerX: number | null = null;
    let lastFrame = 0;
    const input = pressed.current;
    const element = canvas.current;
    if (!element) return;

    function keydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const action: Motion | undefined = ({
        KeyW: "forward", ArrowUp: "forward",
        KeyS: "back", ArrowDown: "back",
        KeyA: "left", KeyD: "right",
        KeyQ: "turnLeft", ArrowLeft: "turnLeft",
        KeyE: "turnRight", ArrowRight: "turnRight",
      } as Record<string, Motion>)[event.code];
      if (!action) return;
      event.preventDefault();
      input.add(action);
    }
    function keyup(event: KeyboardEvent) {
      const action: Motion | undefined = ({
        KeyW: "forward", ArrowUp: "forward",
        KeyS: "back", ArrowDown: "back",
        KeyA: "left", KeyD: "right",
        KeyQ: "turnLeft", ArrowLeft: "turnLeft",
        KeyE: "turnRight", ArrowRight: "turnRight",
      } as Record<string, Motion>)[event.code];
      if (action) input.delete(action);
    }
    function release() { input.clear(); pointerX = null; }
    function pointerDown(event: PointerEvent) {
      pointerX = event.clientX;
      element?.setPointerCapture(event.pointerId);
    }
    function pointerMove(event: PointerEvent) {
      if (pointerX === null) return;
      yaw += (event.clientX - pointerX) * 0.004;
      pointerX = event.clientX;
    }
    function pointerUp() { pointerX = null; }
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", release);
    element.addEventListener("pointerdown", pointerDown);
    element.addEventListener("pointermove", pointerMove);
    element.addEventListener("pointerup", pointerUp);
    element.addEventListener("pointercancel", pointerUp);

    void (async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;

        renderer = new THREE.WebGLRenderer({ canvas: element, antialias: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0x09060a);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        const scene = new THREE.Scene();
        stage = scene;
        scene.background = new THREE.Color(0x09060a);
        scene.fog = new THREE.FogExp2(0x10080e, 0.026);
        const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 75);
        camera.position.set(cx, 1.75, cz);
        const ambient = new THREE.HemisphereLight(0xf5c990, 0x31141d, 1.55);
        scene.add(ambient);

        function box(x: number, y: number, z: number, w: number, h: number, d: number, color: number, metal = 0.15, rough = 0.55) {
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough }),
          );
          mesh.position.set(x, y, z);
          scene.add(mesh);
          return mesh;
        }
        function glow(x: number, y: number, z: number, color: number, intensity: number) {
          const light = new THREE.PointLight(color, intensity, 9, 2);
          light.position.set(x, y, z);
          scene.add(light);
        }
        function plaque(text: string, color: number, width = 3.2) {
          const art = document.createElement("canvas");
          art.width = 512;
          art.height = 128;
          const ctx = art.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#150d14";
            ctx.fillRect(0, 0, 512, 128);
            ctx.strokeStyle = "#c6a15f";
            ctx.lineWidth = 9;
            ctx.strokeRect(8, 8, 496, 112);
            ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
            ctx.font = "bold 42px Georgia,serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, 256, 65, 466);
          }
          const texture = new THREE.CanvasTexture(art);
          texture.colorSpace = THREE.SRGBColorSpace;
          textureBag.push(texture);
          const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(width, 0.75),
            new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
          );
          scene.add(plane);
          return plane;
        }

        // Geometry is original, procedural Art Deco: no borrowed game assets.
        box(0, -0.21, 0, 18, 0.4, 23, 0x23151a, 0.3, 0.42);
        box(0, 6.25, 0, 18, 0.3, 23, 0x321621);
        box(0, 3.0, -9.8, 18, 6.2, 0.4, 0x451723);
        box(-8.8, 3.0, 0, 0.4, 6.3, 23, 0x321725);
        box(8.8, 3.0, 0, 0.4, 6.3, 23, 0x321725);
        for (let ix = -8; ix <= 8; ix += 2) {
          for (let iz = -9; iz <= 10; iz += 2) {
            box(ix, 0.015, iz, 1.94, 0.035, 1.94,
              (Math.floor((ix + iz) / 2) % 2 === 0) ? 0x2a1520 : 0x120f1a, 0.26);
          }
        }
        for (const x of [-7.9, 7.9]) {
          for (const z of [-7, -2, 3, 8]) {
            box(x, 2.55, z, 0.58, 5.2, 0.62, 0x9d713e, 0.74, 0.28);
            box(x, 5.05, z, 0.92, 0.23, 1.02, 0xe6bc66, 0.75);
            box(x, 0.25, z, 0.86, 0.45, 0.98, 0x8e6937, 0.75);
            glow(x, 3.65, z, 0xf8bd73, 2.5);
          }
        }
        // Front-of-house carpet, gilded border, velvet VIP rails.
        box(0, 0.047, 1.4, 3.9, 0.03, 14, 0x7c173a, 0.1, 0.96);
        for (const x of [-2.02, 2.02]) box(x, 0.073, 1.4, 0.085, 0.034, 14, 0xe1b967, 0.82);
        for (const x of [-4.7, 4.7]) {
          for (const z of [0, 4, 7]) {
            box(x, 0.7, z, 0.085, 1.4, 0.085, 0xd6a455, 0.85);
          }
        }
        for (const x of [-4.0, 4.0]) {
          box(x, 5.72, 1, 0.15, 0.2, 8.0, 0xc38b4a, 0.7);
        }
        // Gold lamps evoke suspended Art Deco chandeliers.
        for (const z of [-4, 2, 7]) {
          box(0, 5.4, z, 0.13, 1.7, 0.13, 0xc5a263, 0.8);
          const gem = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.62, 1),
            new THREE.MeshStandardMaterial({ color: 0xffd5a0, emissive: 0xb56c32, emissiveIntensity: 0.3, metalness: 0.7, roughness: 0.16 }),
          );
          gem.position.set(0, 4.45, z);
          scene.add(gem);
          glow(0, 4.3, z, 0xffb46f, 10);
        }

        // All station destinations correspond to the existing Gilt House game.
        for (const station of LOBBY_STATIONS) {
          const x = station.x;
          const z = -8.9;
          box(x, 2.35, z, 3.0, 4.7, 0.14, 0xa17a48, 0.7);
          box(x, 2.1, z + 0.09, 2.63, 3.9, 0.16, 0x1a1225, 0.08, 0.6);
          box(x, 0.13, z + 0.5, 2.7, 0.25, 0.95, station.color, 0.52);
          box(x, 4.53, z + 0.14, 3.1, 0.14, 0.29, station.color, 0.7);
          const sign = plaque(station.name, station.color, 2.95);
          sign.position.set(x, 3.5, z + 0.24);
          glow(x, 3.8, z + 0.8, station.color, 2.5);
        }

        // Entrance wall title. Canvas text avoids new remote artwork requests.
        const title = plaque("GILT HOUSE", 0xe6c36a, 7);
        title.position.set(0, 5.55, -9.52);
        const clock = new THREE.Clock();

        const fit = () => {
          if (!renderer || disposed) return;
          const width = Math.max(1, element.clientWidth);
          const height = Math.max(1, element.clientHeight);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        resize = new ResizeObserver(fit);
        resize.observe(element);
        fit();

        function animate(timestamp: number) {
          if (disposed || !renderer) return;
          const dt = Math.min(0.04, lastFrame ? (timestamp - lastFrame) / 1000 : 0);
          lastFrame = timestamp;
          const turning = (input.has("turnRight") ? 1 : 0) - (input.has("turnLeft") ? 1 : 0);
          yaw = Math.max(-1.15, Math.min(1.15, yaw + turning * dt * 1.2));
          const forward = (input.has("forward") ? 1 : 0) - (input.has("back") ? 1 : 0);
          const sidestep = (input.has("right") ? 1 : 0) - (input.has("left") ? 1 : 0);
          if (dt > 0 && (forward || sidestep)) {
            const delta = clampLobbyCamera(
              cx + (Math.sin(yaw) * forward + Math.cos(yaw) * sidestep) * dt * 3.0,
              cz + (-Math.cos(yaw) * forward + Math.sin(yaw) * sidestep) * dt * 3.0,
            );
            cx = delta.x;
            cz = delta.z;
          }
          camera.position.set(cx, 1.75, cz);
          camera.lookAt(cx + Math.sin(yaw), 1.85, cz - Math.cos(yaw));
          // Reduced-motion freezes ambient animation, but manual navigation works.
          if (!reduced) {
            const t = clock.getElapsedTime();
            title.scale.setScalar(1 + Math.sin(t * 0.7) * 0.006);
          }
          renderer.render(scene, camera);
          raf = requestAnimationFrame(animate);
        }
        if (!disposed) {
          setStatus("ready");
          raf = requestAnimationFrame(animate);
        }
      } catch (err) {
        if (!disposed) {
          console.warn("Gilt House 3D lobby is unavailable:", err);
          setNote("3D graphics could not start on this device. The casino rooms below still work.");
          setStatus("fallback");
        }
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resize?.disconnect();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", release);
      element.removeEventListener("pointerdown", pointerDown);
      element.removeEventListener("pointermove", pointerMove);
      element.removeEventListener("pointerup", pointerUp);
      element.removeEventListener("pointercancel", pointerUp);
      input.clear();
      stage?.traverse((node) => {
        if (node instanceof Object && "isMesh" in node) {
          const mesh = node as import("three").Mesh;
          mesh.geometry.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of materials) material.dispose();
        }
      });
      for (const t of textureBag) t.dispose();
      renderer?.dispose();
    };
  }, [reduced]);

  function navigate(view: string) {
    if (!validLobbyStation(view)) return;
    // This is the existing UI flow, NOT a casino bet / chip update.
    useWorld.getState().enterCasino(view);
  }

  function startMotion(action: Motion) { pressed.current.add(action); }
  function stopMotion(action: Motion) { pressed.current.delete(action); }

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col bg-ink text-cream"
      role="dialog" aria-modal="true" aria-label="Gilt House 3D promenade">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gold/35 bg-ink px-3 py-2">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-gold">Gilt House · 3D promenade</p>
          <h2 className="font-display text-xl italic text-cream">The Grand Lobby</h2>
        </div>
        <button type="button" onClick={exit} className="press min-h-11 rounded-full border border-gold px-4 text-sm text-gold">
          Back to 16-bit lobby
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#100910]">
        <canvas ref={canvas} className="h-full w-full touch-none" aria-label="Interactive 3D Gilt House Art Deco casino lobby" />
        <div className="pointer-events-none absolute left-3 top-3 max-w-xs rounded-xl border border-gold/30 bg-ink/85 p-3 text-xs text-cream-dim">
          <p className="font-semibold text-gold">WASD to walk · Q/E or arrows to turn</p>
          <p className="mt-1">Drag across the room to look around. Choose a room below to enter.</p>
        </div>
        {status !== "ready" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/70 p-5 text-center text-sm text-cream"
            role="status">
            {status === "loading" ? "Opening the Gilt House promenade…" : note}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-gold/30 bg-ink px-3 pb-3 pt-2">
        <p className="mb-2 text-center text-[0.65rem] uppercase tracking-widest text-gold">Choose an existing Gilt House room</p>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-4">
          {LOBBY_STATIONS.map((station) => (
            <button type="button" key={station.id} onClick={() => navigate(station.view)}
              className="press min-h-14 rounded-xl border border-line bg-panel px-2 py-2 text-center text-xs text-cream hover:border-gold">
              <strong className="block text-gold">{station.name}</strong>
              <span className="block text-cream-dim">{station.subtitle}</span>
            </button>
          ))}
        </div>
        <div className="mx-auto mt-2 grid max-w-md grid-cols-3 gap-1 sm:hidden" aria-label="Touch movement controls">
          {CONTROLS.map((control) => (
            <button key={control.action} type="button" onPointerDown={() => startMotion(control.action)}
              onPointerUp={() => stopMotion(control.action)}
              onPointerLeave={() => stopMotion(control.action)}
              onPointerCancel={() => stopMotion(control.action)}
              className="press min-h-10 rounded-lg border border-line bg-ink-2 text-[0.7rem] text-cream">
              {control.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[0.65rem] text-cream-dim">
          Visual showcase only · Casino play chips are not cash · No saving or remote models in this room
        </p>
      </div>
    </div>
  );
}
