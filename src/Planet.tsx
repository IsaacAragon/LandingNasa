import { useEffect, useRef } from "react";
import { CRATER_ANGLE, GALE, MOUNT_SHARP } from "./mars";
import { ROUTE_STOPS } from "./data";
import { scrollTop } from "./scroll";

/**
 * Marte procedural en WebGL2: relieve, cráteres, casquete polar, halo de polvo
 * y el cráter Gale con Mount Sharp, todo generado en el shader.
 *
 * Capa fija detrás del contenido. Su escena sale del scroll (parallax):
 *  1. Hero: el planeta gira a la derecha.
 *  2. Llegada a la zona: gira hasta dejar Gale de frente y se mueve a la izquierda.
 *  3. Zona fijada: zoom dentro del cráter → aparece el inicio → aparece el destino
 *     → la ruta óptima se dibuja y un rover la recorre.
 *  4. Salida: sube y se desvanece más lento que el contenido.
 */

const VERT = `#version 300 es
layout(location = 0) in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

/* Utilidades GLSL compartidas por las dos pasadas */
const COMMON = `#version 300 es
precision highp float;
uniform vec2 uCenter; uniform float uRadius;
uniform float uLon; uniform float uTilt;
uniform vec3 uGale; uniform float uC;
out vec4 o;
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, -s, 0, s, c); }
`;

/* PASADA 1 · TERRENO (cara): relieve procedural, Gale y Mount Sharp, iluminación.
   Se dibuja en una textura y solo se repite cuando la cámara se mueve. */
const TERRAIN_FRAG = COMMON + `
uniform vec3 uMount; uniform float uDetail;
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++){ s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s / 0.875; }
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

void main(){
  vec2 uv = (gl_FragCoord.xy - uCenter) / uRadius;
  float r = length(uv);
  vec3 L = normalize(vec3(-0.55, 0.35, 0.75));
  if (r > 1.0){
    float glow = exp(-(r - 1.0) * 9.0) * 0.55 * smoothstep(-0.6, 0.6, dot(normalize(vec3(uv, 0.0)), L) + 0.3);
    o = vec4(vec3(0.95, 0.45, 0.22) * glow, glow);
    return;
  }
  vec3 N = vec3(uv, sqrt(1.0 - r * r));
  vec3 P = rotY(uLon) * (rotX(uTilt) * N);

  // Relieve global
  float region = fbm(P * 1.6);
  float h = fbm(P * 4.0) * 0.6 + craters(P * 7.0) * 0.22 + craters(P * 17.0) * 0.1;
  // Detalle fino: solo cuando el cráter ocupa bastante pantalla
  float fine = 0.5;
  if (uDetail > 0.0) fine = mix(0.5, fbm3(P * 70.0) * 0.5 + craters(P * 48.0) * 0.12 + 0.25, uDetail);

  // Coordenadas locales de Gale: x = este, y = norte, en radios del cráter
  vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), uGale));
  vec3 north = cross(uGale, east);
  vec2 lp = vec2(dot(P - uGale, east), dot(P - uGale, north)) / uC;
  float cr = length(lp), md = 9.0, near = 0.0;
  if (dot(P, uGale) > 0.95 && cr < 1.7){
    near = smoothstep(1.7, 1.25, cr);
    cr += (noise(P * 220.0) - 0.5) * 0.06 * uDetail;
    float hc = mix(-0.45, 0.0, smoothstep(0.78, 1.0, cr)) + 0.38 * exp(-pow((cr - 1.0) / 0.08, 2.0)) + 0.1 * exp(-pow((cr - 1.18) / 0.18, 2.0));
    float wob = uDetail > 0.0 ? (fbm3(P * 140.0) - 0.5) * 0.22 * uDetail : 0.0;
    md = (length(lp - uMount.xy) + wob) / uMount.z;
    float mount = md < 1.0 ? pow(1.0 - md, 1.3) * 0.95 : 0.0;
    mount += md < 1.0 ? 0.014 * sin(md * 46.0 + noise(P * 260.0) * 6.0) * (1.0 - md) * uDetail : 0.0;
    hc += mount + (fine - 0.5) * 0.16;
    h = mix(h, h * 0.25 + hc, near);
  }

  vec3 dark = vec3(0.30, 0.13, 0.07), mid = vec3(0.70, 0.31, 0.15), dust = vec3(0.88, 0.58, 0.36);
  vec3 alb = mix(dark, mid, smoothstep(0.35, 0.6, region));
  alb = mix(alb, dust, smoothstep(0.55, 0.8, region + h * 0.25) * 0.7);
  alb *= 0.9 + fine * 0.2;
  float floorM = smoothstep(0.95, 0.8, cr) * near;
  alb = mix(alb, alb * 0.82, floorM);
  float dunes = exp(-pow((md - 1.06) / 0.07, 2.0)) * floorM;
  alb = mix(alb, vec3(0.16, 0.1, 0.08), dunes * 0.75);
  vec3 layers = mix(vec3(0.6, 0.28, 0.15), vec3(0.86, 0.66, 0.5), smoothstep(0.75, 0.2, md));
  alb = mix(alb, layers, (md < 1.0 ? 0.65 : 0.0) * near);
  float cap = smoothstep(0.86, 0.93, abs(P.y) + (noise(P * 9.0) - 0.5) * 0.06);
  alb = mix(alb, vec3(0.93, 0.89, 0.84), cap);

  float kG = min(uRadius, 900.0) * 0.012;
  float kC = uRadius * uC * 0.35;
  vec3 n = normalize(N + vec3(-dFdx(h), -dFdy(h), 0.0) * mix(kG, kC, near));
  float diff = max(dot(n, L), 0.0);
  float term = smoothstep(-0.15, 0.35, dot(N, L));
  vec3 col = alb * (0.05 + 1.15 * diff * term);
  col += vec3(0.9, 0.42, 0.2) * pow(1.0 - N.z, 3.0) * 0.55 * term;

  float edge = smoothstep(1.0, 1.0 - 1.5 / uRadius, r);
  o = vec4(col * edge, edge);
}`;

/* PASADA 2 · SUPERPOSICIÓN (barata, cada frame): copia la textura del terreno
   y dibuja encima la ruta, los puntos, el rover y el punto rojo de Gale. */
const OVERLAY_FRAG = COMMON + `
uniform sampler2D uTerrain; uniform vec2 uTexScale;
uniform float uTime; uniform vec2 uStops[6];
uniform float uA, uB, uRoute, uRover, uDot; uniform vec2 uRoverPos;
float segDist(vec2 p, vec2 a, vec2 b){
  vec2 ab = b - a; float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  return length(p - a - ab * t);
}
void main(){
  vec4 base = texture(uTerrain, gl_FragCoord.xy * uTexScale);
  vec2 uv = (gl_FragCoord.xy - uCenter) / uRadius;
  float r = length(uv);
  if (r > 1.0 || uA + uB + uRoute + uRover + uDot <= 0.0){ o = base; return; }
  vec3 N = vec3(uv, sqrt(1.0 - r * r));
  vec3 P = rotY(uLon) * (rotX(uTilt) * N);
  if (dot(P, uGale) < 0.9){ o = base; return; }       // lejos de Gale no hay nada que dibujar
  vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), uGale));
  vec3 north = cross(uGale, east);
  vec2 lp = vec2(dot(P - uGale, east), dot(P - uGale, north)) / uC;
  vec3 col = base.rgb / max(base.a, 1e-4);

  float px = 1.0 / (uRadius * uC);
  float pulse = 0.5 + 0.5 * sin(uTime * 2.6);
  float d = 1e3;
  for (int i = 0; i < 5; i++){
    float t = clamp(uRoute - float(i), 0.0, 1.0);
    if (t <= 0.0) break;
    d = min(d, segDist(lp, uStops[i], mix(uStops[i], uStops[i + 1], t)));
  }
  vec3 routeCol = vec3(1.0, 0.9, 0.78);
  col = mix(col, vec3(1.0, 0.55, 0.3), smoothstep(px * 7.0, 0.0, d) * 0.35);
  col = mix(col, routeCol, smoothstep(px * 2.2, px * 0.8, d));
  for (int i = 1; i < 5; i++){
    float on = step(float(i) - 0.02, uRoute);
    float dd = length(lp - uStops[i]);
    col = mix(col, routeCol, smoothstep(px * 4.0, px * 2.6, dd) * on);
    col = mix(col, vec3(0.1, 0.07, 0.06), smoothstep(px * 2.2, px * 1.2, dd) * on);
  }
  float dA = length(lp - uStops[0]), dB = length(lp - uStops[5]);
  float ringA = smoothstep(px * 1.6, 0.0, abs(dA - px * (10.0 + 6.0 * pulse))) * uA;
  float ringB = smoothstep(px * 1.6, 0.0, abs(dB - px * (12.0 + 7.0 * pulse))) * uB;
  col = mix(col, vec3(0.94, 0.97, 1.0), max(ringA, smoothstep(px * 6.0, px * 4.5, dA) * uA));
  col = mix(col, vec3(0.82, 0.33, 0.16), smoothstep(px * 7.0, px * 5.5, dB) * uB);
  col = mix(col, vec3(1.0, 0.8, 0.62), ringB);
  float rov = length(lp - uRoverPos);
  col = mix(col, vec3(1.0), smoothstep(px * 4.5, px * 3.0, rov) * uRover);
  col += vec3(1.0, 0.7, 0.45) * smoothstep(px * 14.0, 0.0, rov) * 0.35 * uRover;

  float ping = fract(uTime * 0.7);
  float blink = 0.6 + 0.4 * sin(uTime * 5.0);
  float redDot = smoothstep(px * 5.0, px * 3.2, length(lp)) * blink;
  float redRing = smoothstep(px * 1.6, 0.0, abs(length(lp) - px * (6.0 + 24.0 * ping))) * (1.0 - ping);
  col = mix(col, vec3(1.0, 0.22, 0.12), max(redDot, redRing * 0.85) * uDot);

  o = vec4(col * base.a, base.a);
}`;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const RAD = Math.PI / 180;
type V3 = [number, number, number];
const unit = (lat: number, lon: number): V3 =>
  [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];

/* Longitud acumulada de la ruta, para mover el rover a velocidad constante */
const STOPS = ROUTE_STOPS.map((s) => s.pos);
const SEG = STOPS.slice(1).map((p, i) => Math.hypot(p[0] - STOPS[i][0], p[1] - STOPS[i][1]));
const TOTAL = SEG.reduce((a, b) => a + b, 0);
const ROUTE_CENTER = [0, 1].map((k) => STOPS.reduce((acc, p) => acc + p[k], 0) / STOPS.length);
function along(t: number): [number, number] {
  let d = t * TOTAL;
  for (let i = 0; i < SEG.length; i++) {
    if (d <= SEG[i]) { const k = d / SEG[i]; return [lerp(STOPS[i][0], STOPS[i + 1][0], k), lerp(STOPS[i][1], STOPS[i + 1][1], k)]; }
    d -= SEG[i];
  }
  return STOPS[STOPS.length - 1];
}

interface Props {
  /** Se dibuja solo cuando es visible (la intro lo tapa al inicio) */
  active: boolean;
  /** Sección alta y fijada donde ocurre el zoom al cráter y la ruta */
  focusId: string;
  /** Sección donde el planeta termina de salir */
  exitId: string;
}

export default function Planet({ active, focusId, exitId }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const fallback = useRef<HTMLDivElement>(null);
  const labelA = useRef<HTMLDivElement>(null);
  const labelB = useRef<HTMLDivElement>(null);
  const labelM = useRef<HTMLDivElement>(null);
  const leader = useRef<SVGPathElement>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const gl = cv.getContext("webgl2", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) { cv.hidden = true; fallback.current!.hidden = false; return; }

    // Compilación en paralelo: el driver compila en su hilo y aquí no se consulta nada
    // (ni estado ni uniforms) hasta que avisa que terminó. Así la página no se congela al cargar.
    const pcs = gl.getExtension("KHR_parallel_shader_compile");
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      return s;
    };
    const vert = sh(gl.VERTEX_SHADER, VERT);
    const makeProgram = (frag: string) => {
      const pr = gl.createProgram()!, fs = sh(gl.FRAGMENT_SHADER, frag);
      gl.attachShader(pr, vert); gl.attachShader(pr, fs); gl.linkProgram(pr);
      return { pr, fs };
    };
    const T = makeProgram(TERRAIN_FRAG), O = makeProgram(OVERLAY_FRAG);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);

    const G = unit(GALE.lat, GALE.lon);
    const buildUniforms = () => {
      for (const x of [T, O]) {
        if (!gl.getProgramParameter(x.pr, gl.LINK_STATUS)) console.error(gl.getShaderInfoLog(x.fs) || gl.getProgramInfoLog(x.pr));
      }
      const lt = (n: string) => gl.getUniformLocation(T.pr, n), lo = (n: string) => gl.getUniformLocation(O.pr, n);
      for (const [pr, loc] of [[T.pr, lt], [O.pr, lo]] as const) {
        gl.useProgram(pr);
        gl.uniform3f(loc("uGale"), ...G);
        gl.uniform1f(loc("uC"), CRATER_ANGLE);
      }
      gl.useProgram(T.pr);
      gl.uniform3f(lt("uMount"), MOUNT_SHARP.x, MOUNT_SHARP.y, MOUNT_SHARP.r);
      gl.useProgram(O.pr);
      gl.uniform2fv(lo("uStops"), new Float32Array(STOPS.flat()));
      gl.uniform1i(lo("uTerrain"), 0);
      return {
        UT: { center: lt("uCenter"), radius: lt("uRadius"), lon: lt("uLon"), tilt: lt("uTilt"), detail: lt("uDetail") },
        UO: {
          center: lo("uCenter"), radius: lo("uRadius"), lon: lo("uLon"), tilt: lo("uTilt"), time: lo("uTime"),
          texScale: lo("uTexScale"), a: lo("uA"), b: lo("uB"), route: lo("uRoute"), rover: lo("uRover"),
          roverPos: lo("uRoverPos"), dot: lo("uDot"),
        },
      };
    };
    let uniforms: ReturnType<typeof buildUniforms> | null = null;
    const ready = () => {
      if (uniforms) return true;
      if (pcs && !(gl.getProgramParameter(T.pr, pcs.COMPLETION_STATUS_KHR) && gl.getProgramParameter(O.pr, pcs.COMPLETION_STATUS_KHR))) return false;
      uniforms = buildUniforms();
      return true;
    };

    // Textura donde se guarda el terreno ya calculado
    const tex = gl.createTexture()!;
    const fbo = gl.createFramebuffer()!;
    const allocTerrain = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cv.width, cv.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    // Base local de Gale (igual que en el shader) para proyectar las etiquetas
    const east: V3 = (() => { const e: V3 = [G[2], 0, -G[0]]; const l = Math.hypot(...e); return [e[0] / l, 0, e[2] / l]; })();
    const north: V3 = [G[1] * east[2] - G[2] * east[1], G[2] * east[0] - G[0] * east[2], G[0] * east[1] - G[1] * east[0]];
    const project = (lx: number, ly: number, lon: number, tilt: number, cx: number, cy: number, R: number) => {
      const p: V3 = [0, 1, 2].map((k) => G[k] + CRATER_ANGLE * (lx * east[k] + ly * north[k])) as V3;
      const l = Math.hypot(...p); p[0] /= l; p[1] /= l; p[2] /= l;
      const c = Math.cos(lon), s = Math.sin(lon);
      const q: V3 = [c * p[0] - s * p[2], p[1], s * p[0] + c * p[2]];          // rotY(lon)ᵀ
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const n: V3 = [q[0], ct * q[1] - st * q[2], st * q[1] + ct * q[2]];       // rotX(tilt)ᵀ
      return { x: cx + n[0] * R, y: cy - n[1] * R, visible: n[2] > 0.05 };
    };
    // Solo se escribe en el DOM si el valor cambió (menos invalidaciones de estilo por frame)
    const written = new Map<Element, string>();
    const place = (el: HTMLDivElement | null, pt: { x: number; y: number; visible: boolean }, alpha: number) => {
      if (!el) return;
      const on = pt.visible && alpha > 0.01;
      const key = on ? `${alpha.toFixed(2)}|${pt.x.toFixed(1)}|${pt.y.toFixed(1)}` : "off";
      if (written.get(el) === key) return;
      written.set(el, key);
      el.style.opacity = on ? alpha.toFixed(2) : "0";
      if (on) el.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0)`;
    };
    const setOpacity = (el: HTMLElement | SVGElement | null, v: string) => {
      if (!el || written.get(el) === v) return;
      written.set(el, v); el.style.opacity = v;
    };

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1, W = 0, H = 0;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.25);    // el shader es caro: 1.25 basta para un planeta suave
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      allocTerrain();
      terrainKey = "";                               // el terreno se recalcula con el nuevo tamaño
    };
    let terrainKey = "", terrainScale = 1, stillFrames = 0;
    resize();
    addEventListener("resize", resize);

    const ptr = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const move = (e: PointerEvent) => { ptr.x = e.clientX / W - 0.5; ptr.y = e.clientY / H - 0.5; };
    addEventListener("pointermove", move, { passive: true });

    const jl = GALE.lat * RAD, jo = GALE.lon * RAD;
    let raf = 0, last = performance.now(), phase = 0, roverT = 0, step = -1, idle = false, running = false;
    const anchorSel = '[data-anchor="gale"]';
    // Posiciones en el documento de la zona, la sección de salida y la tarjeta del hero.
    // Se miden una vez (y al cambiar el tamaño o el contenido); cada frame solo usa scrollY.
    const geo = { focus: null as HTMLElement | null, focusTop: 0, focusH: 1, exitTop: 1e9, card: null as HTMLElement | null, cardLeft: 0, cardBottom: 0, cardShown: false };
    const measure = () => {
      const y = scrollY;
      geo.focus = document.getElementById(focusId);
      const f = geo.focus?.getBoundingClientRect(), e = document.getElementById(exitId)?.getBoundingClientRect();
      if (f) { geo.focusTop = f.top + y; geo.focusH = f.height; }
      if (e) geo.exitTop = e.top + y;
      geo.card = document.querySelector<HTMLElement>(anchorSel);
      const r = geo.card?.getBoundingClientRect();
      const ty = geo.card ? parseFloat(geo.card.style.translate.split(" ")[1] || "0") || 0 : 0;
      geo.cardShown = !!r && r.width > 0;
      if (r) { geo.cardLeft = r.left; geo.cardBottom = r.bottom + y - ty; }
      wake();
    };
    const wake = () => { if (idle && running) { idle = false; last = performance.now(); raf = requestAnimationFrame(frame); } };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05); last = now;

      if (!ready()) return;                         // el shader aún compila: no se dibuja ni se bloquea
      const { UT, UO } = uniforms!;
      const y = scrollTop();                        // leída una vez por evento de scroll: no fuerza layout
      const focus = geo.focus, fTop = geo.focusTop - y, eTop = geo.exitTop - y;
      // a: llegada a la zona (gira hasta Gale). p: avance dentro de la zona fijada.
      const a = smooth(clamp01(1 - fTop / H));
      const p = clamp01(-fTop / Math.max(geo.focusH - H, 1));
      const b = smooth(clamp01(1 - (eTop - H * 0.2) / (H * 0.8)));

      // Fase visible en la tarjeta de pasos (0 zoom, 1 inicio, 2 destino, 3 ruta)
      const s = p < 0.3 ? 0 : p < 0.45 ? 1 : p < 0.58 ? 2 : 3;
      if (focus && s !== step) { step = s; focus.dataset.step = String(s); }

      if (b >= 1) {
        setOpacity(cv, "0");
        [labelA.current, labelB.current, labelM.current, leader.current].forEach((el) => setOpacity(el, "0"));
        written.delete(labelA.current!); written.delete(labelB.current!); written.delete(labelM.current!);
        cancelAnimationFrame(raf); idle = true;      // el planeta salió: sin trabajo hasta volver a hacer scroll
        return;
      }
      setOpacity(cv, (1 - b).toFixed(3));

      // En el hero gira despacio de un lado a otro sin perder de vista Gale; al llegar a la zona queda de frente
      if (!reduced) phase += dt * ((Math.PI * 2) / 48) * (1 - a);
      const lonRaw = jo + 0.8 * Math.sin(phase) * (1 - a);
      const lon = a < 1 ? Math.round(lonRaw / 0.0025) * 0.0025 : lonRaw;
      const tilt = lerp(0.12, jl, a);

      cur.x += (ptr.x - cur.x) * 0.05; cur.y += (ptr.y - cur.y) * 0.05;
      const narrow = W < 860;
      const r0 = narrow ? Math.min(W * 0.42, H * 0.26) : Math.min(W * 0.27, H * 0.42);
      const r1 = narrow ? Math.min(W * 0.62, H * 0.34) : Math.min(W * 0.34, H * 0.56);
      const craterPx = narrow ? Math.min(W * 0.75, H * 0.42) : Math.min(W * 0.42, H * 0.72);
      const r2 = craterPx / CRATER_ANGLE;                         // radio del planeta con el cráter a pantalla
      // Marte siempre a la derecha: el zoom al cráter ocurre ahí mismo
      const x0 = narrow ? W * 0.5 : W * 0.76, y0 = narrow ? H * 0.32 : H * 0.52;
      const x1 = narrow ? W * 0.5 : W * 0.7, y1 = narrow ? H * 0.3 : H * 0.5;
      const z = smooth(clamp01(p / 0.3));
      const radius = lerp(r0, r1, a) * Math.pow(r2 / r1, z);       // zoom logarítmico: se siente uniforme
      const par = 1 - z;                                           // sin paralaje de puntero de cerca: la cámara queda quieta
      // De cerca, la cámara se centra en la ruta (noroeste del cráter), no en el centro de Gale
      const focusX = narrow ? W * 0.5 : W * 0.7, focusY = narrow ? H * 0.26 : H * 0.5;
      const shiftX = (focusX - x1 + ROUTE_CENTER[0] * -craterPx) * z;
      const shiftY = (focusY - y1 + ROUTE_CENTER[1] * craterPx) * z;
      const cx = lerp(x0, x1, a) + shiftX + cur.x * -24 * par;
      const cy = lerp(y0, y1, a) + shiftY - b * H * 0.5 + cur.y * -18 * par;

      // Fases de la ruta
      const A = smooth(clamp01((p - 0.3) / 0.1));
      const B = smooth(clamp01((p - 0.45) / 0.1));
      const route = smooth(clamp01((p - 0.58) / 0.3)) * (STOPS.length - 1);
      const roverOn = smooth(clamp01((p - 0.86) / 0.08));
      if (roverOn > 0 && !reduced) roverT = (roverT + dt / 7) % 1;    // 7 s por vuelta
      const rp = roverOn > 0 ? along(reduced ? 1 : roverT) : STOPS[0];

      const R = Math.min(radius * 1.35, Math.hypot(W, H) * 2) * dpr;
      const detail = smooth(clamp01((radius * CRATER_ANGLE * dpr - 140) / 260));
      const dotOn = 1 - smooth(clamp01((p - 0.22) / 0.1));

      // PASADA 1: el terreno solo se recalcula si la cámara se movió (medio píxel o un ángulo mínimo).
      // Mientras se mueve y el planeta ocupa mucha pantalla se calcula a media resolución;
      // al quedarse quieto unos frames se repite a resolución completa.
      const key = [lon.toFixed(4), tilt.toFixed(4), (radius * dpr).toFixed(1), (cx * dpr * 2).toFixed(0), (cy * dpr * 2).toFixed(0), detail.toFixed(3)].join("|");
      const moved = key !== terrainKey;
      stillFrames = moved ? 0 : stillFrames + 1;
      const big = radius * dpr > Math.max(cv.width, cv.height) * 0.6;
      if (moved || (terrainScale < 1 && stillFrames > 4)) {
        terrainScale = moved && big ? 0.5 : 1;
        terrainKey = key;
        const k = terrainScale;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, Math.ceil(cv.width * k), Math.ceil(cv.height * k));
        gl.scissor(0, 0, cv.width, cv.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.scissor(Math.max(0, Math.floor((cx * dpr - R) * k)), Math.max(0, Math.floor(((H - cy) * dpr - R) * k)), Math.ceil(R * 2 * k), Math.ceil(R * 2 * k));
        gl.useProgram(T.pr);
        gl.uniform2f(UT.center, cx * dpr * k, (H - cy) * dpr * k);
        gl.uniform1f(UT.radius, radius * dpr * k);
        gl.uniform1f(UT.lon, lon);
        gl.uniform1f(UT.tilt, tilt);
        gl.uniform1f(UT.detail, detail);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      // PASADA 2: copia del terreno + ruta, puntos, rover y punto rojo (cada frame, barata)
      const bx = Math.max(0, Math.floor(cx * dpr - R)), by = Math.max(0, Math.floor((H - cy) * dpr - R));
      gl.viewport(0, 0, cv.width, cv.height);
      gl.scissor(0, 0, cv.width, cv.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.scissor(bx, by, Math.ceil(R * 2), Math.ceil(R * 2));
      gl.useProgram(O.pr);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform2f(UO.texScale, terrainScale / cv.width, terrainScale / cv.height);
      gl.uniform2f(UO.center, cx * dpr, (H - cy) * dpr);
      gl.uniform1f(UO.radius, radius * dpr);
      gl.uniform1f(UO.lon, lon);
      gl.uniform1f(UO.tilt, tilt);
      gl.uniform1f(UO.time, now / 1000);
      gl.uniform1f(UO.a, A);
      gl.uniform1f(UO.b, B);
      gl.uniform1f(UO.route, route);
      gl.uniform1f(UO.rover, roverOn);
      gl.uniform2f(UO.roverPos, rp[0], rp[1]);
      gl.uniform1f(UO.dot, dotOn);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Etiquetas HTML sobre los puntos
      const first = STOPS[0], lastStop = STOPS[STOPS.length - 1];
      place(labelA.current, project(first[0], first[1], lon, tilt, cx, cy, radius), A * (1 - b));
      place(labelB.current, project(lastStop[0], lastStop[1], lon, tilt, cx, cy, radius), B * (1 - b));
      place(labelM.current, project(MOUNT_SHARP.x, MOUNT_SHARP.y - 0.15, lon, tilt, cx, cy, radius), smooth(clamp01((p - 0.12) / 0.15)) * (1 - b));

      // Línea que une la tarjeta "Cráter Gale" del hero con el punto rojo
      const line = leader.current;
      if (line) {
        const card = geo.card;
        const show = (1 - smooth(clamp01(a * 2))) * dotOn;
        const g = project(0, 0, lon, tilt, cx, cy, radius);
        if (card && geo.cardShown && show > 0.01 && g.visible) {   // en móvil la tarjeta está oculta: sin línea
          const ty = parseFloat(card.style.translate.split(" ")[1] || "0") || 0;   // paralaje actual (estilo en línea, sin layout)
          const sx = geo.cardLeft + 34, sy = geo.cardBottom - y + ty;           // sale del icono, por debajo de la tarjeta
          setOpacity(line, show.toFixed(2));
          const d = `M${sx.toFixed(1)} ${sy.toFixed(1)} L${sx.toFixed(1)} ${(sy + 16).toFixed(1)} L${g.x.toFixed(1)} ${g.y.toFixed(1)}`;
          if (written.get(card) !== d) { written.set(card, d); line.setAttribute("d", d); }
        } else setOpacity(line, "0");
      }
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    addEventListener("scroll", wake, { passive: true });
    const startStop = () => {
      const want = cv.dataset.active === "true" && document.visibilityState === "visible";
      if (want && !running) { running = true; idle = false; last = performance.now(); raf = requestAnimationFrame(frame); }
      if (!want && running) { running = false; cancelAnimationFrame(raf); }
    };
    const obs = new MutationObserver(startStop);
    obs.observe(cv, { attributes: true, attributeFilter: ["data-active"] });
    document.addEventListener("visibilitychange", startStop);
    startStop();

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      ro.disconnect();
      removeEventListener("scroll", wake);
      document.removeEventListener("visibilitychange", startStop);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", move);
    };
  }, [focusId, exitId]);

  const first = ROUTE_STOPS[0], goal = ROUTE_STOPS[ROUTE_STOPS.length - 1];
  return (
    <div className="planet-layer" aria-hidden="true">
      <canvas ref={canvas} className="planet" data-active={active} />
      <div ref={fallback} className="planet-fallback" hidden />
      <div ref={labelA} className="pin pin-start"><small>Inicio</small><b>{first.name}</b></div>
      <div ref={labelB} className="pin pin-goal"><small>Destino</small><b>{goal.name}</b></div>
      <div ref={labelM} className="pin pin-plain"><b>Mount Sharp</b></div>
      <svg className="leader" width="100%" height="100%"><path ref={leader} /></svg>
    </div>
  );
}
