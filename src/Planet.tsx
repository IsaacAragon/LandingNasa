import { useEffect, useRef } from "react";
import { APPROACH_FROM, GALE } from "./mars";

/**
 * Marte procedural en WebGL2: relieve, cráteres, casquete polar y halo de polvo
 * generados en el shader. No depende de teselas externas.
 *
 * Capa fija detrás del contenido. Su posición, tamaño y orientación salen del
 * scroll (parallax): en el hero gira libremente; al llegar a la sección del
 * cráter se acerca, gira hasta dejar Gale de frente, traza la ruta de llegada y lo marca.
 */


const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uCenter; uniform float uRadius;
uniform float uLon; uniform float uTilt; uniform float uMark; uniform float uTime;
uniform vec3 uJez; uniform vec3 uFrom; uniform float uRoute;
out vec4 o;

float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
float craters(vec3 p){
  vec3 i = floor(p), f = fract(p); float h = 0.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++){
    vec3 g = vec3(x, y, z);
    if (hash(i + g + 3.1) < 0.55) continue;
    vec3 c = g + vec3(hash(i + g), hash(i + g + 19.1), hash(i + g + 47.3));
    float d = length(c - f) / (0.18 + 0.3 * hash(i + g + 7.7));
    h += d < 1.0 ? (d * d - 1.0) * 0.55 : 0.0;
    h += smoothstep(1.3, 1.0, d) * smoothstep(0.75, 1.0, d) * 0.3;
  }
  return h;
}
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, -s, 0, s, c); }

void main(){
  vec2 uv = (gl_FragCoord.xy - uCenter) / uRadius;
  float r = length(uv);
  vec3 L = normalize(vec3(-0.55, 0.35, 0.75));
  if (r > 1.0){
    // Halo de polvo fuera del disco
    float glow = exp(-(r - 1.0) * 9.0) * 0.55 * smoothstep(-0.6, 0.6, dot(normalize(vec3(uv, 0.0)), L) + 0.3);
    o = vec4(vec3(0.95, 0.45, 0.22) * glow, glow);
    return;
  }
  vec3 N = vec3(uv, sqrt(1.0 - r * r));
  vec3 P = rotY(uLon) * (rotX(uTilt) * N);

  // Relieve: grandes regiones, detalle y dos escalas de cráteres
  float region = fbm(P * 1.6);
  float h = fbm(P * 4.0) * 0.6 + craters(P * 7.0) * 0.22 + craters(P * 17.0) * 0.1;

  // Gale: depresión exagerada para que se lea a esta escala
  float dj = acos(clamp(dot(P, uJez), -1.0, 1.0));
  float jr = dj / 0.05;
  h += jr < 1.0 ? (jr * jr - 1.0) * 0.35 : smoothstep(1.35, 1.0, jr) * 0.2;

  vec3 dark = vec3(0.30, 0.13, 0.07), mid = vec3(0.70, 0.31, 0.15), dust = vec3(0.88, 0.58, 0.36);
  vec3 alb = mix(dark, mid, smoothstep(0.35, 0.6, region));
  alb = mix(alb, dust, smoothstep(0.55, 0.8, region + h * 0.25) * 0.7);
  float cap = smoothstep(0.86, 0.93, abs(P.y) + (noise(P * 9.0) - 0.5) * 0.06);
  alb = mix(alb, vec3(0.93, 0.89, 0.84), cap);

  // Normal con relieve (derivadas en pantalla) e iluminación
  vec3 n = normalize(N + vec3(-dFdx(h), -dFdy(h), 0.0) * uRadius * 0.012);
  float diff = max(dot(n, L), 0.0);
  float term = smoothstep(-0.15, 0.35, dot(N, L));
  vec3 col = alb * (0.05 + 1.15 * diff * term);
  col += vec3(0.9, 0.42, 0.2) * pow(1.0 - N.z, 3.0) * 0.55 * term;   // atmósfera en el borde

  // Marcador del cráter
  float pulse = 0.5 + 0.5 * sin(uTime * 2.4);
  float ring = smoothstep(0.012, 0.0, abs(dj - 0.075 - pulse * 0.02)) * (0.6 + 0.4 * pulse);
  float core = smoothstep(0.012, 0.0, abs(dj - 0.052));
  col = mix(col, vec3(0.93, 0.96, 1.0), (ring * 0.8 + core * 0.5) * uMark);

  // Ruta de llegada: arco de círculo máximo que se dibuja con el scroll hasta Gale
  vec3 an = normalize(cross(uFrom, uJez));
  float total = acos(clamp(dot(uFrom, uJez), -1.0, 1.0));
  float along = acos(clamp(dot(P, uFrom), -1.0, 1.0)) / total;
  float inSeg = step(0.0, dot(cross(uFrom, P), an)) * step(0.0, dot(cross(P, uJez), an));
  float w = 1.6 / uRadius;
  float dash = smoothstep(0.35, 0.45, fract(along * 16.0 - uTime * 0.5));
  float line = smoothstep(w * 1.6, w * 0.4, abs(dot(P, an))) * inSeg * step(along, uRoute) * dash;
  vec3 head = normalize(mix(uFrom, uJez, uRoute));
  float headDot = smoothstep(w * 4.0, w * 2.5, acos(clamp(dot(P, head), -1.0, 1.0))) * step(0.01, uRoute) * (1.0 - uMark);
  col = mix(col, vec3(1.0, 0.86, 0.7), max(line * 0.9, headDot) * term);

  float edge = smoothstep(1.0, 1.0 - 1.5 / uRadius, r);
  o = vec4(col * edge, edge);
}`;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const RAD = Math.PI / 180;

interface Props {
  /** Se dibuja solo cuando es visible (la intro lo tapa al inicio) */
  active: boolean;
  /** Sección cuyo centro es el "acercamiento" al cráter */
  focusId: string;
  /** Sección donde el planeta termina de salir */
  exitId: string;
}

export default function Planet({ active, focusId, exitId }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const fallback = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const gl = cv.getContext("webgl2", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) { cv.hidden = true; fallback.current!.hidden = false; return; }

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uCenter = u("uCenter"), uRadius = u("uRadius"), uLon = u("uLon"), uTilt = u("uTilt");
    const uMark = u("uMark"), uTime = u("uTime"), uJez = u("uJez"), uFrom = u("uFrom"), uRoute = u("uRoute");
    const unit = (lat: number, lon: number): [number, number, number] =>
      [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];
    const jl = GALE.lat * RAD, jo = GALE.lon * RAD;
    gl.uniform3f(uJez, ...unit(GALE.lat, GALE.lon));
    gl.uniform3f(uFrom, ...unit(APPROACH_FROM.lat, APPROACH_FROM.lon));

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1, W = 0, H = 0;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };
    resize();
    addEventListener("resize", resize);

    // Parallax por puntero, suavizado
    const ptr = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const move = (e: PointerEvent) => { ptr.x = e.clientX / W - 0.5; ptr.y = e.clientY / H - 0.5; };
    addEventListener("pointermove", move, { passive: true });

    let raf = 0, last = performance.now(), spin = 0.6, target: number | null = null;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05); last = now;

      // Progreso del scroll: a = hero → cráter, b = cráter → salida
      const focus = document.getElementById(focusId), exit = document.getElementById(exitId);
      const fr = focus?.getBoundingClientRect(), er = exit?.getBoundingClientRect();
      const a = fr ? smooth(clamp01(1 - (fr.top + fr.height / 2 - H / 2) / H)) : 0;
      const b = er ? smooth(clamp01(1 - (er.top - H * 0.15) / (H * 0.85))) : 0;
      if (b >= 1) { cv.style.opacity = "0"; return; }   // fuera de escena: no se dibuja
      cv.style.opacity = String(1 - b);

      if (!reduced) spin += dt * 0.12 * (1 - a);
      if (a > 0.001 && target === null) target = jo + Math.PI * 2 * Math.round((spin - jo) / (Math.PI * 2));
      if (a <= 0.001) target = null;
      const lon = target === null ? spin : lerp(spin, target, a);
      const tilt = lerp(0.18, jl, a);

      cur.x += (ptr.x - cur.x) * 0.05; cur.y += (ptr.y - cur.y) * 0.05;
      const narrow = W < 860;
      const r0 = narrow ? Math.min(W * 0.42, H * 0.26) : Math.min(W * 0.25, H * 0.38);
      const r1 = narrow ? Math.min(W * 0.62, H * 0.34) : Math.min(W * 0.36, H * 0.56);
      const x0 = narrow ? W * 0.5 : W * 0.71, y0 = narrow ? H * 0.32 : H * 0.52;
      const x1 = narrow ? W * 0.5 : W * 0.3, y1 = narrow ? H * 0.3 : H * 0.5;
      const radius = lerp(r0, r1, a);
      const cx = lerp(x0, x1, a) + cur.x * -24;
      const cy = lerp(y0, y1, a) - b * H * 0.5 + cur.y * -18;   // sale más lento que el contenido

      // Solo se procesa el recuadro del planeta y su halo
      const R = radius * 1.35 * dpr;
      const bx = Math.max(0, Math.floor(cx * dpr - R)), by = Math.max(0, Math.floor((H - cy) * dpr - R));
      gl.viewport(0, 0, cv.width, cv.height);
      gl.scissor(0, 0, cv.width, cv.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.scissor(bx, by, Math.ceil(R * 2), Math.ceil(R * 2));
      gl.uniform2f(uCenter, cx * dpr, (H - cy) * dpr);
      gl.uniform1f(uRadius, radius * dpr);
      gl.uniform1f(uLon, lon);
      gl.uniform1f(uTilt, tilt);
      gl.uniform1f(uRoute, smooth(clamp01((a - 0.3) / 0.55)));
      gl.uniform1f(uMark, smooth(clamp01((a - 0.8) / 0.2)));
      gl.uniform1f(uTime, now / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let running = false;
    const startStop = () => {
      const want = cv.dataset.active === "true" && document.visibilityState === "visible";
      if (want && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      if (!want && running) { running = false; cancelAnimationFrame(raf); }
    };
    const obs = new MutationObserver(startStop);
    obs.observe(cv, { attributes: true, attributeFilter: ["data-active"] });
    document.addEventListener("visibilitychange", startStop);
    startStop();

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      document.removeEventListener("visibilitychange", startStop);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", move);
    };
  }, [focusId, exitId]);

  return (
    <div className="planet-layer" aria-hidden="true">
      <canvas ref={canvas} className="planet" data-active={active} />
      <div ref={fallback} className="planet-fallback" hidden />
    </div>
  );
}
