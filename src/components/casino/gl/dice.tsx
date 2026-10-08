import { useEffect, useRef } from "react";
import { axisQ, ID_Q, lookAt, modelMatrix, mul4, perspective, qmul, qnorm, slerp, type Q } from "@/lib/casino/gl-math";

const VERT = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUv;
layout(location = 3) in float aVal;
uniform mat4 uMvp;
uniform mat4 uModel;
out vec3 vN;
out vec2 vUv;
out float vVal;
void main() {
  vN = mat3(uModel) * aNrm;
  vUv = aUv;
  vVal = aVal;
  gl_Position = uMvp * vec4(aPos, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;
in vec3 vN;
in vec2 vUv;
in float vVal;
out vec4 frag;

float pip(vec2 uv, vec2 c) {
  return 1.0 - smoothstep(0.055, 0.078, distance(uv, c));
}

void main() {
  vec2 uv = vUv;
  int v = int(vVal + 0.5);
  float spots = 0.0;
  if (v == 1 || v == 3 || v == 5) spots = max(spots, pip(uv, vec2(0.5)));
  if (v == 2 || v == 3) {
    spots = max(spots, max(pip(uv, vec2(0.28, 0.72)), pip(uv, vec2(0.72, 0.28))));
  }
  if (v == 4 || v == 5) {
    spots = max(spots, pip(uv, vec2(0.28, 0.28)));
    spots = max(spots, pip(uv, vec2(0.72, 0.28)));
    spots = max(spots, pip(uv, vec2(0.28, 0.72)));
    spots = max(spots, pip(uv, vec2(0.72, 0.72)));
  }
  if (v == 6) {
    spots = max(spots, pip(uv, vec2(0.28, 0.26)));
    spots = max(spots, pip(uv, vec2(0.28, 0.5)));
    spots = max(spots, pip(uv, vec2(0.28, 0.74)));
    spots = max(spots, pip(uv, vec2(0.72, 0.26)));
    spots = max(spots, pip(uv, vec2(0.72, 0.5)));
    spots = max(spots, pip(uv, vec2(0.72, 0.74)));
  }
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  vec3 cream = vec3(0.953, 0.918, 0.847);
  vec3 ink = vec3(0.09, 0.06, 0.05);
  vec3 col = mix(cream, ink, clamp(spots, 0.0, 1.0));
  col *= smoothstep(0.0, 0.08, edge);
  vec3 n = normalize(vN);
  float lambert = clamp(dot(n, normalize(vec3(0.35, 0.85, 0.4))), 0.0, 1.0);
  float fill = clamp(dot(n, normalize(vec3(-0.5, 0.1, -0.3))), 0.0, 1.0);
  col *= 0.38 + lambert * 0.72 + fill * 0.12;
  float spec = pow(clamp(dot(n, normalize(vec3(0.2, 0.6, 0.75))), 0.0, 1.0), 28.0);
  col += vec3(1.0, 0.94, 0.82) * spec * 0.28;
  frag = vec4(col, 1.0);
}
`;

function cubeGeometry(): Float32Array {
  const faces: { n: number[]; u: number[]; v: number[]; value: number }[] = [
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], value: 1 },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], value: 6 },
    { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], value: 3 },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], value: 4 },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], value: 2 },
    { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], value: 5 },
  ];
  const data: number[] = [];
  const push = (pos: number[], n: number[], uv: number[], value: number) => {
    data.push(pos[0] ?? 0, pos[1] ?? 0, pos[2] ?? 0, n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, uv[0] ?? 0, uv[1] ?? 0, value);
  };
  for (const face of faces) {
    const c = face.n.map((n) => n * 0.5);
    const corner = (su: number, sv: number) => [
      (c[0] ?? 0) + (face.u[0] ?? 0) * 0.5 * su + (face.v[0] ?? 0) * 0.5 * sv,
      (c[1] ?? 0) + (face.u[1] ?? 0) * 0.5 * su + (face.v[1] ?? 0) * 0.5 * sv,
      (c[2] ?? 0) + (face.u[2] ?? 0) * 0.5 * su + (face.v[2] ?? 0) * 0.5 * sv,
    ];
    const quad = [
      { p: corner(-1, -1), uv: [0, 0] },
      { p: corner(1, -1), uv: [1, 0] },
      { p: corner(1, 1), uv: [1, 1] },
      { p: corner(-1, 1), uv: [0, 1] },
    ];
    for (const i of [0, 1, 2, 0, 2, 3]) {
      const vert = quad[i];
      if (vert) push(vert.p, face.n, vert.uv, face.value);
    }
  }
  return new Float32Array(data);
}

const FACE_UP: Record<number, Q> = {
  1: ID_Q,
  6: axisQ(1, 0, 0, Math.PI),
  2: axisQ(1, 0, 0, -Math.PI / 2),
  5: axisQ(1, 0, 0, Math.PI / 2),
  3: axisQ(0, 0, 1, -Math.PI / 2),
  4: axisQ(0, 0, 1, Math.PI / 2),
};

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function DiceGL({
  token,
  left,
  right,
  onSettled,
}: {
  token: number;
  left: number;
  right: number;
  onSettled: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(0);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) {
      if (token > 0 && done.current !== token) {
        done.current = token;
        onSettledRef.current();
      }
      return;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeGeometry(), gl.STATIC_DRAW);
    const uMvp = gl.getUniformLocation(program, "uMvp");
    const uModel = gl.getUniformLocation(program, "uModel");
    const stride = 9 * 4;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const values = [left, right];
    const targets = values.map((value) => FACE_UP[value] ?? ID_Q);
    const axes: [number, number, number][] = [
      [0.35, 1, 0.2],
      [-0.25, 0.9, 0.45],
    ];
    const yaw = [axisQ(0, 1, 0, Math.random() * Math.PI), axisQ(0, 1, 0, Math.random() * Math.PI)];
    let frame = 0;
    let dead = false;
    const started = performance.now();
    const duration = token === 0 || reduce ? 0 : 1500;

    const draw = (now: number) => {
      if (dead) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const proj = perspective(0.62, w / Math.max(1, h), 0.1, 30);
      const view = lookAt([0, 2.35, 3.7], [0, 0.25, 0], [0, 1, 0]);
      const vp = mul4(proj, view);
      const t = duration === 0 ? 1 : Math.min(1, (now - started) / duration);
      const tumble = t < 0.68 ? t / 0.68 : 1;
      const settle = t < 0.68 ? 0 : (t - 0.68) / 0.32;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 24);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 32);
      values.forEach((_, i) => {
        const axis = axes[i] ?? [0, 1, 0];
        const spin = qmul(axisQ(axis[0], axis[1], axis[2], tumble * 14), yaw[i] ?? ID_Q);
        const upright = qnorm(qmul(yaw[i] ?? ID_Q, targets[i] ?? ID_Q));
        const pose = settle === 0 ? spin : slerp(qnorm(spin), upright, settle * settle);
        const shown = t >= 1 ? upright : pose;
        const x = i === 0 ? -1.15 : 1.15;
        const hop = Math.sin(tumble * Math.PI) * 0.45 * (1 - settle);
        const model = modelMatrix(shown, x, 0.25 + hop, 0, 1.15);
        gl.uniformMatrix4fv(uModel, false, model);
        gl.uniformMatrix4fv(uMvp, false, mul4(vp, model));
        gl.drawArrays(gl.TRIANGLES, 0, 36);
      });
      if (t < 1) frame = requestAnimationFrame(draw);
      else if (token > 0 && done.current !== token) {
        done.current = token;
        onSettledRef.current();
      }
    };
    frame = requestAnimationFrame(draw);
    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [token, left, right]);

  return <canvas ref={ref} className="h-64 w-full sm:h-72" aria-hidden />;
}
