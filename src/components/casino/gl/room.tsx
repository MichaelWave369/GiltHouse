import { useEffect, useRef } from "react";

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
out vec4 frag;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= uRes.x / max(uRes.y, 1.0);

  vec3 ink = vec3(0.043, 0.031, 0.027);
  vec3 velvet = vec3(0.45, 0.09, 0.15);
  vec3 gold = vec3(0.90, 0.76, 0.42);
  vec3 felt = vec3(0.06, 0.22, 0.18);
  vec3 wood = vec3(0.28, 0.14, 0.07);
  vec3 col = ink;

  float pool = exp(-dot(p * vec2(0.48, 0.72), p * vec2(0.48, 0.72)));
  col = mix(col, felt * 0.85 + ink, pool * 0.5);

  float fold = 0.55 + 0.45 * sin(p.y * 22.0 + sin(p.y * 3.0));
  float sheen = pow(fold, 2.4);
  vec3 curtain = mix(velvet * 0.42, velvet, 0.4 + sheen * 0.6);
  curtain += gold * sheen * 0.12;
  float curtainL = smoothstep(-0.22, -0.62, p.x);
  float curtainR = smoothstep(0.22, 0.62, p.x);
  col = mix(col, curtain, clamp(curtainL + curtainR, 0.0, 1.0));

  float ropeL = smoothstep(0.018, 0.0, abs(p.x + 0.48));
  float ropeR = smoothstep(0.018, 0.0, abs(p.x - 0.48));
  float ropeH = smoothstep(-0.95, -0.2, p.y) * smoothstep(0.98, 0.7, p.y);
  col = mix(col, gold, (ropeL + ropeR) * ropeH);

  float floorMask = smoothstep(0.08, -0.35, p.y);
  float plank = step(0.5, fract(p.x * 7.0 + step(0.5, fract(p.y * 5.0)) * 0.5));
  float grain = hash(floor(vec2(p.x * 40.0, p.y * 24.0)));
  vec3 boards = mix(wood * 0.72, wood, plank);
  boards += gold * grain * 0.04;
  col = mix(col, boards, floorMask);

  float chain = smoothstep(0.012, 0.0, abs(p.x)) * smoothstep(0.62, 0.98, p.y);
  col = mix(col, gold * 0.7, chain);

  vec2 hub = p - vec2(0.0, 0.72);
  col += gold * exp(-dot(hub, hub) * 6.5) * (0.45 + 0.08 * sin(uTime * 2.1));

  col += gold * exp(-dot(p - vec2(-0.22, 0.58), p - vec2(-0.22, 0.58)) * 70.0);
  col += gold * exp(-dot(p - vec2(0.22, 0.58), p - vec2(0.22, 0.58)) * 70.0);
  col += gold * exp(-dot(p - vec2(-0.11, 0.52), p - vec2(-0.11, 0.52)) * 90.0) * 0.8;
  col += gold * exp(-dot(p - vec2(0.11, 0.52), p - vec2(0.11, 0.52)) * 90.0) * 0.8;
  col += vec3(1.0, 0.95, 0.8) * exp(-dot(p - vec2(0.0, 0.66), p - vec2(0.0, 0.66)) * 140.0);

  float marquee = smoothstep(0.012, 0.0, abs(p.y - 0.9)) * smoothstep(0.85, 0.25, abs(p.x));
  float flicker = 0.82 + 0.18 * sin(uTime * 7.5) * sin(uTime * 2.2);
  col += gold * marquee * flicker;

  vec2 smokeP = p * vec2(1.15, 0.85);
  smokeP.y -= uTime * 0.03;
  float smoke = sin(smokeP.x * 2.2 + sin(smokeP.y * 1.6 + uTime * 0.18));
  smoke += sin(smokeP.x * 3.8 - smokeP.y * 1.9 + uTime * 0.12);
  smoke = smoke * 0.25 + 0.5;
  float haze = smoothstep(-0.35, 0.9, p.y) * smoke;
  col = mix(col, gold * 0.28 + ink, haze * 0.16);
  vec2 pianoLamp = p - vec2(-0.95, -0.78);
  col += gold * exp(-dot(pianoLamp, pianoLamp) * 1.8) * 0.42;

  vec2 drift = vec2(uTime * 0.02, uTime * 0.03);
  float dust = smoothstep(0.992, 1.0, hash(floor(gl_FragCoord.xy * 0.04 + drift)));
  dust += smoothstep(0.996, 1.0, hash(floor(gl_FragCoord.xy * 0.07 - drift.yx)));
  col += gold * dust * 0.65;

  float vig = smoothstep(1.45, 0.35, length(p * vec2(0.78, 1.0)));
  col *= mix(0.55, 1.0, vig);
  frag = vec4(col, 1.0);
}
`;

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

export function RoomGL() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let running = true;
    const started = performance.now();

    const draw = (now: number) => {
      if (!running) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 0 : (now - started) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce && document.visibilityState === "visible") frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    const onVis = () => {
      if (document.visibilityState === "visible" && !reduce) frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVis);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 h-full w-full" aria-hidden />;
}
