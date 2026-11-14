import { useEffect, useRef } from "react";
import { CRATER_ANGLE, GALE, MOUNT_SHARP } from "./mars";
import { ROUTE_STOPS } from "./data";

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
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uCenter; uniform float uRadius;
uniform float uLon; uniform float uTilt; uniform float uTime;
uniform vec3 uGale; uniform float uC; uniform vec3 uMount;
uniform vec2 uStops[6];
uniform float uA, uB, uRoute, uRover; uniform vec2 uRoverPos;
uniform float uDetail, uDot;
out vec4 o;

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
float segDist(vec2 p, vec2 a, vec2 b){
  vec2 ab = b - a; float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  return length(p - a - ab * t);
}
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, -s, 0, s, c); }

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
  // Detalle fino: solo cuando el cráter ocupa bastante pantalla (sin dientes de sierra y menos trabajo de GPU)
  float fine = 0.5;
  if (uDetail > 0.0) fine = mix(0.5, fbm3(P * 70.0) * 0.5 + craters(P * 48.0) * 0.12 + 0.25, uDetail);

  // Coordenadas locales de Gale: x = este, y = norte, en radios del cráter
  vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), uGale));
  vec3 north = cross(uGale, east);
  vec2 lp = vec2(dot(P - uGale, east), dot(P - uGale, north)) / uC;
  float cr = length(lp), md = 9.0, near = 0.0;
  if (dot(P, uGale) > 0.95 && cr < 1.7){
    near = smoothstep(1.7, 1.25, cr);
    // Gale: piso, pared, borde y manto de eyecta (borde irregular solo de cerca)
    cr += (noise(P * 220.0) - 0.5) * 0.06 * uDetail;
    float hc = mix(-0.45, 0.0, smoothstep(0.78, 1.0, cr)) + 0.38 * exp(-pow((cr - 1.0) / 0.08, 2.0)) + 0.1 * exp(-pow((cr - 1.18) / 0.18, 2.0));
    // Mount Sharp: montículo central; borde y terrazas rotos por ruido para que no parezca una diana
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
  // Dentro de Gale: piso algo más oscuro, dunas oscuras al pie de la montaña,
  // capas de arcillas (rojizas) abajo y sulfatos (claros) arriba
  float floorM = smoothstep(0.95, 0.8, cr) * near;
  alb = mix(alb, alb * 0.82, floorM);
  float dunes = exp(-pow((md - 1.06) / 0.07, 2.0)) * floorM;
  alb = mix(alb, vec3(0.16, 0.1, 0.08), dunes * 0.75);
  vec3 layers = mix(vec3(0.6, 0.28, 0.15), vec3(0.86, 0.66, 0.5), smoothstep(0.75, 0.2, md));
  alb = mix(alb, layers, (md < 1.0 ? 0.65 : 0.0) * near);
  float cap = smoothstep(0.86, 0.93, abs(P.y) + (noise(P * 9.0) - 0.5) * 0.06);
  alb = mix(alb, vec3(0.93, 0.89, 0.84), cap);

  // Normal con relieve (derivadas en pantalla) e iluminación.
  // El relieve global se limita para que no se exagere al acercarse; el del cráter escala con su tamaño en pantalla.
  float kG = min(uRadius, 900.0) * 0.012;
  float kC = uRadius * uC * 0.35;
  vec3 n = normalize(N + vec3(-dFdx(h), -dFdy(h), 0.0) * mix(kG, kC, near));
  float diff = max(dot(n, L), 0.0);
  float term = smoothstep(-0.15, 0.35, dot(N, L));
  vec3 col = alb * (0.05 + 1.15 * diff * term);
  col += vec3(0.9, 0.42, 0.2) * pow(1.0 - N.z, 3.0) * 0.55 * term;

  // Ruta óptima, puntos de inicio/destino y rover (en coordenadas locales)
  float px = 1.0 / (uRadius * uC);                 // un píxel en radios del cráter
  float pulse = 0.5 + 0.5 * sin(uTime * 2.6);
  float d = 1e3;
  for (int i = 0; i < 5; i++){
    float t = clamp(uRoute - float(i), 0.0, 1.0);
    if (t <= 0.0) break;
    d = min(d, segDist(lp, uStops[i], mix(uStops[i], uStops[i + 1], t)));
  }
  float glowLine = smoothstep(px * 7.0, 0.0, d) * 0.35;
  float line = smoothstep(px * 2.2, px * 0.8, d);
  vec3 routeCol = vec3(1.0, 0.9, 0.78);
  col = mix(col, vec3(1.0, 0.55, 0.3), glowLine);
  col = mix(col, routeCol, line);
  for (int i = 1; i < 5; i++){
    float on = step(float(i) - 0.02, uRoute);
    float dd = length(lp - uStops[i]);
    col = mix(col, routeCol, smoothstep(px * 4.0, px * 2.6, dd) * on);
    col = mix(col, vec3(0.1, 0.07, 0.06), smoothstep(px * 2.2, px * 1.2, dd) * on);
  }
  float dA = length(lp - uStops[0]), dB = length(lp - uStops[5]);
  float ringA = smoothstep(px * 1.6, 0.0, abs(dA - px * (10.0 + 6.0 * pulse))) * uA;
  float ringB = smoothstep(px * 1.6, 0.0, abs(dB - px * (12.0 + 7.0 * pulse))) * uB;
  float dotA = smoothstep(px * 6.0, px * 4.5, dA) * uA;
  float dotB = smoothstep(px * 7.0, px * 5.5, dB) * uB;
  col = mix(col, vec3(0.94, 0.97, 1.0), max(ringA, dotA));
  col = mix(col, vec3(0.82, 0.33, 0.16), dotB);
  col = mix(col, vec3(1.0, 0.8, 0.62), ringB);
  float rov = length(lp - uRoverPos);
  col = mix(col, vec3(1.0), smoothstep(px * 4.5, px * 3.0, rov) * uRover);
  col += vec3(1.0, 0.7, 0.45) * smoothstep(px * 14.0, 0.0, rov) * 0.35 * uRover;

  // Punto rojo parpadeante: ubicación de Gale (con un pulso tipo radar)
  float ping = fract(uTime * 0.7);
  float blink = 0.6 + 0.4 * sin(uTime * 5.0);
  float redDot = smoothstep(px * 5.0, px * 3.2, length(lp)) * blink;
  float redRing = smoothstep(px * 1.6, 0.0, abs(length(lp) - px * (6.0 + 24.0 * ping))) * (1.0 - ping);
  col = mix(col, vec3(1.0, 0.22, 0.12), max(redDot, redRing * 0.85) * uDot);

  float edge = smoothstep(1.0, 1.0 - 1.5 / uRadius, r);
  o = vec4(col * edge, edge);
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
    const U = {
      center: u("uCenter"), radius: u("uRadius"), lon: u("uLon"), tilt: u("uTilt"), time: u("uTime"),
      a: u("uA"), b: u("uB"), route: u("uRoute"), rover: u("uRover"), roverPos: u("uRoverPos"),
      detail: u("uDetail"), dot: u("uDot"),
    };
    const G = unit(GALE.lat, GALE.lon);
    gl.uniform3f(u("uGale"), ...G);
    gl.uniform1f(u("uC"), CRATER_ANGLE);
    gl.uniform3f(u("uMount"), MOUNT_SHARP.x, MOUNT_SHARP.y, MOUNT_SHARP.r);
    gl.uniform2fv(u("uStops"), new Float32Array(STOPS.flat()));

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
    const place = (el: HTMLDivElement | null, pt: { x: number; y: number; visible: boolean }, alpha: number) => {
      if (!el) return;
      const on = pt.visible && alpha > 0.01;
      el.style.opacity = on ? String(alpha) : "0";
      if (on) el.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0)`;
    };

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1, W = 0, H = 0;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.25);    // el shader es caro: 1.25 basta para un planeta suave
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };
    resize();
    addEventListener("resize", resize);

    const ptr = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const move = (e: PointerEvent) => { ptr.x = e.clientX / W - 0.5; ptr.y = e.clientY / H - 0.5; };
    addEventListener("pointermove", move, { passive: true });

    const jl = GALE.lat * RAD, jo = GALE.lon * RAD;
    let raf = 0, last = performance.now(), phase = 0, roverT = 0, step = -1;
    const anchorSel = '[data-anchor="gale"]';
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05); last = now;

      const focus = document.getElementById(focusId), exit = document.getElementById(exitId);
      const fr = focus?.getBoundingClientRect(), er = exit?.getBoundingClientRect();
      // a: llegada a la zona (gira hasta Gale). p: avance dentro de la zona fijada.
      const a = fr ? smooth(clamp01(1 - fr.top / H)) : 0;
      const p = fr ? clamp01(-fr.top / Math.max(fr.height - H, 1)) : 0;
      const b = er ? smooth(clamp01(1 - (er.top - H * 0.2) / (H * 0.8))) : 0;

      // Fase visible en la tarjeta de pasos (0 zoom, 1 inicio, 2 destino, 3 ruta)
      const s = p < 0.3 ? 0 : p < 0.45 ? 1 : p < 0.58 ? 2 : 3;
      if (focus && s !== step) { step = s; focus.dataset.step = String(s); }

      if (b >= 1) {
        cv.style.opacity = "0";
        [labelA.current, labelB.current, labelM.current].forEach((el) => el && (el.style.opacity = "0"));
        if (leader.current) leader.current.style.opacity = "0";
        return;
      }
      cv.style.opacity = String(1 - b);

      // En el hero gira despacio de un lado a otro sin perder de vista Gale; al llegar a la zona queda de frente
      if (!reduced) phase += dt * ((Math.PI * 2) / 48) * (1 - a);
      const lon = jo + 0.8 * Math.sin(phase) * (1 - a);
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
      const par = 1 - z * 0.7;                                     // menos paralaje de puntero de cerca
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
      const bx = Math.max(0, Math.floor(cx * dpr - R)), by = Math.max(0, Math.floor((H - cy) * dpr - R));
      gl.viewport(0, 0, cv.width, cv.height);
      gl.scissor(0, 0, cv.width, cv.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.scissor(bx, by, Math.ceil(R * 2), Math.ceil(R * 2));
      gl.uniform2f(U.center, cx * dpr, (H - cy) * dpr);
      gl.uniform1f(U.radius, radius * dpr);
      gl.uniform1f(U.lon, lon);
      gl.uniform1f(U.tilt, tilt);
      gl.uniform1f(U.time, now / 1000);
      gl.uniform1f(U.a, A);
      gl.uniform1f(U.b, B);
      gl.uniform1f(U.route, route);
      gl.uniform1f(U.rover, roverOn);
      gl.uniform2f(U.roverPos, rp[0], rp[1]);
      gl.uniform1f(U.detail, smooth(clamp01((radius * CRATER_ANGLE * dpr - 140) / 260)));
      const dotOn = 1 - smooth(clamp01((p - 0.22) / 0.1));
      gl.uniform1f(U.dot, dotOn);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Etiquetas HTML sobre los puntos
      const first = STOPS[0], lastStop = STOPS[STOPS.length - 1];
      place(labelA.current, project(first[0], first[1], lon, tilt, cx, cy, radius), A * (1 - b));
      place(labelB.current, project(lastStop[0], lastStop[1], lon, tilt, cx, cy, radius), B * (1 - b));
      place(labelM.current, project(MOUNT_SHARP.x, MOUNT_SHARP.y - 0.15, lon, tilt, cx, cy, radius), smooth(clamp01((p - 0.12) / 0.15)) * (1 - b));

      // Línea que une la tarjeta "Cráter Gale" del hero con el punto rojo
      const line = leader.current;
      if (line) {
        const card = document.querySelector<HTMLElement>(anchorSel);
        const show = (1 - smooth(clamp01(a * 2))) * dotOn;
        const g = project(0, 0, lon, tilt, cx, cy, radius);
        if (card && show > 0.01 && g.visible) {
          const r = card.getBoundingClientRect();
          const sx = r.left + 34, sy = r.bottom;                      // sale del icono, por debajo de la tarjeta
          line.style.opacity = String(show);
          line.setAttribute("d", `M${sx.toFixed(1)} ${sy.toFixed(1)} L${sx.toFixed(1)} ${(sy + 16).toFixed(1)} L${g.x.toFixed(1)} ${g.y.toFixed(1)}`);
        } else line.style.opacity = "0";
      }
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
