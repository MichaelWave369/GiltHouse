import { useEffect, useRef } from "react";
import { REDS, WHEEL } from "@/lib/casino/roulette";

const VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uRot;
uniform float uBallAng;
uniform float uBallRad;
uniform sampler2D uPockets;
out vec4 frag;
const float PI = 3.141592653589793;
const float SLICE = 6.283185307179586 / 37.0;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) {
    frag = vec4(0.0);
    return;
  }
  float ang = atan(p.x, p.y);
  float local = mod(ang - uRot + PI * 4.0, PI * 2.0);
  int idx = clamp(int(floor(local / SLICE)), 0, 36);
  vec3 pocket = texelFetch(uPockets, ivec2(idx, 0), 0).rgb;
  vec2 n2 = r > 0.001 ? p / r : vec2(0.0, 1.0);
  float light = clamp(dot(n2, normalize(vec2(-0.35, 0.85))), 0.0, 1.0);
  vec3 col = pocket * (0.62 + 0.5 * light);
  float along = abs(fract(local / SLICE) - 0.5);
  float seam = smoothstep(0.455, 0.498, along);
  vec3 gold = vec3(0.831, 0.659, 0.325);
  float rim = smoothstep(0.885, 0.915, r) * (1.0 - smoothstep(0.975, 0.998, r));
  float inlay = smoothstep(0.40, 0.43, r) * (1.0 - smoothstep(0.455, 0.49, r));
  col = mix(col, gold * (0.65 + 0.55 * light), clamp(rim + inlay, 0.0, 1.0));
  col = mix(col, gold * 0.9, seam * step(0.49, r) * step(r, 0.90));
  if (r < 0.40) {
    vec3 hub = vec3(0.07, 0.05, 0.04);
    col = mix(hub, gold, smoothstep(0.33, 0.38, r));
  }
  float groove = smoothstep(0.70, 0.73, r) * (1.0 - smoothstep(0.78, 0.81, r));
  col *= 1.0 - groove * 0.18;
  vec2 ball = vec2(sin(uBallAng), cos(uBallAng)) * uBallRad;
  float bd = length(p - ball);
  if (bd < 0.058) {
    float z = sqrt(max(0.0, 1.0 - pow(bd / 0.058, 2.0)));
    vec3 bn = normalize(vec3((p - ball) / 0.058, z));
    float bl = clamp(dot(bn, normalize(vec3(-0.35, 0.55, 0.76))), 0.0, 1.0);
    vec3 ivory = vec3(0.953, 0.918, 0.847);
    col = ivory * (0.28 + bl);
    col += vec3(1.0) * pow(bl, 18.0) * 0.65;
  }
  col *= smoothstep(1.0, 0.94, r);
  frag = vec4(col, 1.0);
}
`;

const TAU = Math.PI * 2;
const SLICE = TAU / 37;

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

function drawNumbers(
  ctx: CanvasRenderingContext2D,
  width: number,
  rot: number,
) {
  ctx.clearRect(0, 0, width, width);
  const cx = width / 2;
  const radius = width * 0.34;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f3ead8";
  ctx.font = `600 ${Math.max(10, Math.round(width * 0.042))}px Fraunces, Palatino, serif`;
  for (let i = 0; i < WHEEL.length; i++) {
    const ang = rot + (i + 0.5) * SLICE;
    const x = cx + Math.sin(ang) * radius;
    const y = cx - Math.cos(ang) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillText(String(WHEEL[i]), 0, 0);
    ctx.restore();
  }
}

export function WheelGL({
  token,
  pocketIndex,
  onSettled,
}: {
  token: number;
  pocketIndex: number;
  onSettled: () => void;
}) {
  const glRef = useRef<HTMLCanvasElement>(null);
  const numRef = useRef<HTMLCanvasElement>(null);
  const settled = useRef(0);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    const canvas = glRef.current;
    const numbers = numRef.current;
    if (!canvas || !numbers) return;
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: false });
    const ctx = numbers.getContext("2d");
    if (!gl || !ctx) return;
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const pixels = new Uint8Array(37 * 4);
    WHEEL.forEach((n, i) => {
      const color = n === 0 ? [18, 66, 55] : REDS.has(n) ? [138, 42, 56] : [28, 21, 17];
      pixels[i * 4] = color[0] ?? 0;
      pixels[i * 4 + 1] = color[1] ?? 0;
      pixels[i * 4 + 2] = color[2] ?? 0;
      pixels[i * 4 + 3] = 255;
    });
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 37, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const uRot = gl.getUniformLocation(program, "uRot");
    const uBallAng = gl.getUniformLocation(program, "uBallAng");
    const uBallRad = gl.getUniformLocation(program, "uBallRad");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let dead = false;
    const paint = (rot: number, ballAng: number, ballRad: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
        numbers.width = size;
        numbers.height = size;
      }
      gl.viewport(0, 0, size, size);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(program, "uPockets"), 0);
      gl.uniform1f(uRot, rot);
      gl.uniform1f(uBallAng, ballAng);
      gl.uniform1f(uBallRad, ballRad);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      drawNumbers(ctx, size, rot);
    };

    const finalRot = -((pocketIndex + 0.5) * SLICE);
    if (token === 0 || settled.current === token) {
      paint(finalRot, 0, 0.7);
      return () => {
        dead = true;
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buffer);
        gl.deleteTexture(tex);
      };
    }

    const duration = reduce ? 0 : 4300;
    const started = performance.now();
    const from = finalRot - TAU * 6;
    const ballFrom = Math.random() * TAU;
    const loop = (now: number) => {
      if (dead) return;
      const t = duration === 0 ? 1 : Math.min(1, (now - started) / duration);
      const e = 1 - (1 - t) ** 3;
      const rot = from + (finalRot - from) * e;
      const ballAng = ballFrom + (TAU * 8 - ballFrom) * e;
      const ballRad = 0.86 + (0.7 - 0.86) * (t < 0.62 ? 0 : (t - 0.62) / 0.38);
      paint(rot, ballAng, ballRad);
      if (t < 1) frame = requestAnimationFrame(loop);
      else if (settled.current !== token) {
        settled.current = token;
        onSettledRef.current();
      }
    };
    frame = requestAnimationFrame(loop);
    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(tex);
    };
  }, [token, pocketIndex]);

  return (
    <div className="wheel-bezel relative mx-auto size-64 overflow-hidden rounded-full border-4 border-gold bg-ink sm:size-80">
      <canvas ref={glRef} className="absolute inset-0 h-full w-full" aria-hidden />
      <canvas ref={numRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2" aria-hidden>
        <div className="border-x-8 border-t-8 border-x-transparent border-t-gold" />
      </div>
    </div>
  );
}
