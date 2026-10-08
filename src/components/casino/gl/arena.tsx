import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import type { AgentMatch } from "@/lib/casino/agents";
import { stagePose } from "@/lib/casino/agents";

export type ArenaHandle = {
  enterVR: () => Promise<"ok" | "none">;
};

const GOLD = 0xe6c36a;
const OX = 0x8c2436;
const CREAM = 0xf7edd6;
const INK = 0x1c1511;

export function Arena({ match, api }: { match: AgentMatch; api: Ref<ArenaHandle | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pose = useRef(stagePose(match));
  pose.current = stagePose(match);
  const rendererRef = useRef<{
    xr: { enabled: boolean; isPresenting: boolean; setSession: (session: XRSession) => Promise<void> };
    setAnimationLoop: (loop: (() => void) | null) => void;
  } | null>(null);

  useImperativeHandle(api, () => ({
    enterVR: () => {
      const renderer = rendererRef.current;
      const xr = typeof navigator !== "undefined" ? navigator.xr : undefined;
      if (!renderer || !xr) return Promise.resolve("none");
      renderer.xr.enabled = true;
      return xr
        .requestSession("immersive-vr")
        .then((session) => renderer.xr.setSession(session).then(() => "ok" as const))
        .catch(() => "none" as const);
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    const look = { yaw: 0.55, pitch: 0.48, drag: false, x: 0, y: 0 };
    const clean: Array<() => void> = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onDown = (event: PointerEvent) => {
      look.drag = true;
      look.x = event.clientX;
      look.y = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!look.drag) return;
      look.yaw += (event.clientX - look.x) * 0.008;
      look.pitch = Math.max(0.18, Math.min(1.05, look.pitch + (event.clientY - look.y) * 0.005));
      look.x = event.clientX;
      look.y = event.clientY;
    };
    const onUp = () => {
      look.drag = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    void (async () => {
      const THREE = await import("three");
      if (dead || !canvasRef.current) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x100c0a, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.xr.enabled = true;
      rendererRef.current = renderer;
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x100c0a, 14, 32);
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 50);
      scene.add(new THREE.HemisphereLight(0xf7edd6, 0x1a120e, 0.7));
      const sun = new THREE.DirectionalLight(0xfff1d0, 1.15);
      sun.position.set(6, 10, 4);
      scene.add(sun);

      const geos: { dispose: () => void }[] = [];
      const mats: { dispose: () => void }[] = [];
      const add = (geo: { dispose: () => void }, mat: { dispose: () => void }) => {
        geos.push(geo);
        return new THREE.Mesh(geo as never, mat as never);
      };
      const keep = <T extends { dispose: () => void }>(mat: T) => {
        mats.push(mat);
        return mat;
      };

      const sport = match.sport;
      const chalk = keep(new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.55 }));
      const felt = keep(
        new THREE.MeshStandardMaterial({
          color: sport === "baseball" ? 0x1a4a32 : 0x124237,
          roughness: 0.92,
        }),
      );
      const feltDark = keep(new THREE.MeshStandardMaterial({ color: 0x0c332c, roughness: 0.95 }));
      const inkMat = keep(new THREE.MeshStandardMaterial({ color: INK, roughness: 0.8 }));
      const standMat = keep(new THREE.MeshStandardMaterial({ color: 0x241814, roughness: 0.9 }));
      const lampMat = keep(
        new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xe6c36a, emissiveIntensity: 0.8 }),
      );
      const poleMat = keep(new THREE.MeshStandardMaterial({ color: 0x3a2a22, metalness: 0.35, roughness: 0.45 }));
      const netMat = keep(
        new THREE.MeshStandardMaterial({
          color: CREAM,
          transparent: true,
          opacity: 0.16,
          roughness: 1,
          side: THREE.DoubleSide,
        }),
      );

      const groundW = sport === "baseball" ? 14 : 8.4;
      const groundD = sport === "soccer" ? 13.2 : sport === "football" ? 13.4 : 14;
      const ground = add(new THREE.PlaneGeometry(groundW, groundD), felt);
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      if (sport === "soccer") {
        for (let i = 0; i < 8; i += 1) {
          if (i % 2 === 0) continue;
          const stripe = add(new THREE.PlaneGeometry(7.2, 1.35), feltDark);
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(0, 0.01, -5.2 + i * 1.5);
          scene.add(stripe);
        }
      }

      const mark = (w: number, d: number, x: number, z: number) => {
        const mesh = add(new THREE.BoxGeometry(w, 0.025, d), chalk);
        mesh.position.set(x, 0.03, z);
        scene.add(mesh);
      };

      if (sport === "soccer") {
        mark(0.07, 11.4, 0, 0);
        mark(7.2, 0.07, 0, 0);
        mark(7.2, 0.07, 0, 5.6);
        mark(7.2, 0.07, 0, -5.6);
        mark(0.07, 11.4, -3.6, 0);
        mark(0.07, 11.4, 3.6, 0);
        mark(3.2, 0.06, 0, 4.15);
        mark(3.2, 0.06, 0, -4.15);
        mark(0.06, 2.9, -1.6, 4.15);
        mark(0.06, 2.9, 1.6, 4.15);
        mark(0.06, 2.9, -1.6, -4.15);
        mark(0.06, 2.9, 1.6, -4.15);
        const ring = add(new THREE.RingGeometry(1.15, 1.24, 40), chalk);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.03;
        scene.add(ring);
        const goal = (z: number) => {
          const post = (x: number) => {
            const mesh = add(new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8), chalk);
            mesh.position.set(x, 0.58, z);
            scene.add(mesh);
          };
          post(-1.25);
          post(1.25);
          const bar = add(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), chalk);
          bar.rotation.z = Math.PI / 2;
          bar.position.set(0, 1.15, z);
          scene.add(bar);
          const net = add(new THREE.PlaneGeometry(2.5, 1.15), netMat);
          net.position.set(0, 0.58, z + Math.sign(z) * 0.35);
          scene.add(net);
        };
        goal(5.6);
        goal(-5.6);
      } else if (sport === "football") {
        const zoneMat = keep(new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.8 }));
        const zoneAway = keep(new THREE.MeshStandardMaterial({ color: OX, roughness: 0.8 }));
        const zone = (z: number, mat: InstanceType<typeof THREE.Material>) => {
          const mesh = add(new THREE.BoxGeometry(6.6, 0.03, 1.15), mat);
          mesh.position.set(0, 0.02, z);
          scene.add(mesh);
        };
        zone(5.9, zoneMat);
        zone(-5.9, zoneAway);
        for (let i = -5; i <= 5; i += 1) mark(6.4, 0.045, 0, i * 1.02);
        mark(0.06, 11.2, -3.3, 0);
        mark(0.06, 11.2, 3.3, 0);
        const uprights = (z: number) => {
          const stem = add(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), chalk);
          stem.position.set(0, 0.75, z);
          scene.add(stem);
          const bar = add(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), chalk);
          bar.rotation.z = Math.PI / 2;
          bar.position.set(0, 1.5, z);
          scene.add(bar);
          for (const x of [-1.1, 1.1]) {
            const post = add(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), chalk);
            post.position.set(x, 2.3, z);
            scene.add(post);
          }
        };
        uprights(6.45);
        uprights(-6.45);
      } else {
        mark(0.07, 5.2, 0, 1.7);
        mark(5.2, 0.07, 0, 1.7);
        const dirt = add(new THREE.CircleGeometry(1.7, 28), keep(new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 1 })));
        dirt.rotation.x = -Math.PI / 2;
        dirt.position.set(0, 0.015, 2.2);
        scene.add(dirt);
        const mound = add(new THREE.CylinderGeometry(0.38, 0.48, 0.08, 16), keep(new THREE.MeshStandardMaterial({ color: 0x8a6244, roughness: 1 })));
        mound.position.set(0, 0.04, 2.25);
        scene.add(mound);
        for (const [x, z] of [[2.2, 2.15], [0, -0.05], [-2.2, 2.15], [0.15, 4.25]] as const) {
          const base = add(new THREE.BoxGeometry(0.28, 0.04, 0.28), chalk);
          base.position.set(x, 0.04, z);
          scene.add(base);
        }
        const wallMat = keep(new THREE.MeshStandardMaterial({ color: 0x1a3f34, roughness: 0.85 }));
        for (let i = -4; i <= 4; i += 1) {
          const wall = add(new THREE.BoxGeometry(1.35, 0.85, 0.22), wallMat);
          wall.position.set(i * 1.2, 0.42, -5.1);
          scene.add(wall);
        }
      }

      const radius = sport === "baseball" ? 8.6 : 8.1;
      for (let i = 0; i < 16; i += 1) {
        const angle = (i / 16) * Math.PI * 2;
        const box = add(new THREE.BoxGeometry(1.8, 0.55 + (i % 3) * 0.28, 0.9), standMat);
        box.position.set(Math.sin(angle) * radius, 0.35 + (i % 3) * 0.12, Math.cos(angle) * radius * (sport === "soccer" ? 1.15 : 1));
        box.lookAt(0, 0.4, 0);
        scene.add(box);
      }

      for (const [x, z] of [
        [-5.4, -6.4],
        [5.4, -6.4],
        [-5.4, 6.6],
        [5.4, 6.6],
      ] as const) {
        const pole = add(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), poleMat);
        pole.position.set(x, 2.2, z);
        scene.add(pole);
        const lamp = add(new THREE.BoxGeometry(0.85, 0.16, 0.36), lampMat);
        lamp.position.set(x * 0.92, 4.35, z * 0.94);
        scene.add(lamp);
        const light = new THREE.PointLight(0xfff1d0, 4.5, 20, 2);
        light.position.set(x * 0.88, 4.2, z * 0.9);
        scene.add(light);
      }

      const homeMat = keep(new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.4, metalness: 0.18 }));
      const awayMat = keep(new THREE.MeshStandardMaterial({ color: OX, roughness: 0.4, metalness: 0.12 }));
      const torsoGeo = new THREE.CapsuleGeometry(0.13, 0.28, 4, 8);
      const headGeo = new THREE.SphereGeometry(0.11, 12, 10);
      geos.push(torsoGeo, headGeo);
      const figure = (mat: InstanceType<typeof THREE.Material>) => {
        const group = new THREE.Group();
        const torso = new THREE.Mesh(torsoGeo, mat);
        torso.position.y = 0.42;
        const head = new THREE.Mesh(headGeo, mat);
        head.position.y = 0.74;
        group.add(torso, head);
        scene.add(group);
        return group;
      };
      const homeGroups = Array.from({ length: 11 }, () => figure(homeMat));
      const awayGroups = Array.from({ length: 11 }, () => figure(awayMat));

      const ball = add(
        new THREE.SphereGeometry(0.16, 18, 14),
        keep(new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.32 })),
      );
      scene.add(ball);
      const rail = add(new THREE.BoxGeometry(sport === "baseball" ? 12.6 : 8.8, 0.22, 0.16), inkMat);
      rail.position.set(0, 0.12, sport === "soccer" ? 6.7 : 6.2);
      scene.add(rail);

      const fit = () => {
        const w = canvas.clientWidth || 640;
        const h = canvas.clientHeight || 320;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      fit();
      const onResize = () => fit();
      window.addEventListener("resize", onResize);
      const loop = () => {
        if (dead) return;
        const frame = pose.current;
        const t = performance.now() * 0.001;
        ball.position.set(frame.ball[0], frame.ball[1] + (reduce ? 0 : Math.sin(t * 2) * 0.02), frame.ball[2]);
        const place = (spots: Array<[number, number, number]>, groups: InstanceType<typeof THREE.Group>[]) => {
          spots.forEach((spot, index) => {
            const group = groups[index];
            if (!group) return;
            const on = spot[1] > -1;
            group.visible = on;
            if (!on) return;
            const bob = reduce ? 0 : Math.sin(t * 3 + index * 0.7) * 0.02;
            group.position.set(spot[0], bob, spot[2]);
            const dx = ball.position.x - spot[0];
            const dz = ball.position.z - spot[2];
            if (dx * dx + dz * dz > 0.05) group.rotation.y = Math.atan2(dx, dz);
          });
        };
        place(frame.home, homeGroups);
        place(frame.away, awayGroups);
        if (!renderer.xr.isPresenting) {
          const dist = sport === "baseball" ? 11.2 : 10.4;
          camera.position.set(
            Math.sin(look.yaw) * dist * Math.cos(look.pitch * 0.85),
            2.1 + Math.sin(look.pitch) * dist * 0.42,
            Math.cos(look.yaw) * dist * Math.cos(look.pitch * 0.85),
          );
          camera.lookAt(0, 0.3, 0);
        }
        renderer.render(scene, camera);
      };
      renderer.setAnimationLoop(loop);
      clean.push(() => {
        window.removeEventListener("resize", onResize);
        renderer.setAnimationLoop(null);
        renderer.dispose();
        for (const geo of geos) geo.dispose();
        for (const mat of mats) mat.dispose();
        rendererRef.current = null;
      });
    })();

    return () => {
      dead = true;
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      for (const fn of clean) fn();
    };
  }, [match.sport]);

  return (
    <canvas
      ref={canvasRef}
      className="h-72 w-full touch-none rounded-xl border border-line bg-ink sm:h-96"
      aria-label="Agent field. Drag to look around."
    />
  );
}
