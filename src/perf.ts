import { useSyncExternalStore } from "react";
import type { Bi } from "./i18n";

/* ==========================================================================
   Modo rendimiento
   Se activa:
   1. Por hardware al cargar: poca RAM, pocos núcleos, GPU básica o por software, ahorro de datos.
   2. Por rendimiento real: tras la intro se miden ~2 s de frames; si no sostiene ~30 fps, se activa.
   3. A mano, con el botón de la barra superior (la elección se guarda y manda sobre lo automático).
   El modo efectivo se publica como <html data-perf="lite|full"> para el CSS y con usePerf() para React.
   ========================================================================== */

export type PerfMode = "auto" | "on" | "off";
export interface PerfState {
  mode: PerfMode;        // elección del usuario
  lite: boolean;         // modo efectivo
  auto: boolean;         // el modo automático detectó un equipo lento
  reasons: Bi[];         // por qué se activó automáticamente (bilingüe)
}

const MODE_KEY = "aresmap-perf";
const AUTO_KEY = "aresmap-perf-auto";
const SERVER: PerfState = { mode: "auto", lite: false, auto: false, reasons: [] };

let state: PerfState = SERVER;
const listeners = new Set<() => void>();

function commit(next: Omit<PerfState, "lite">) {
  const lite = next.mode === "on" || (next.mode === "auto" && next.auto);
  state = { ...next, lite };
  if (typeof document !== "undefined") document.documentElement.dataset.perf = lite ? "lite" : "full";
  listeners.forEach((fn) => fn());
}

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* modo privado */ } };

/* ---------- Detección por hardware ---------- */
function gpuName(): string | null {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return name;
  } catch {
    return null;
  }
}

/* GPU por software, Intel "HD Graphics" antiguas (no UHD/Iris), y GPU de móviles de gama baja */
const WEAK_GPU = /swiftshader|llvmpipe|softpipe|software|basic render|intel[^,]*\bhd graphics\b|intel[^,]*\bgma\b|mali-[2-4]\d\b|mali-t\d|mali-g[3-5]\d\b|adreno \(tm\) ([2-5]\d\d|6[01]\d)\b|powervr/i;

function detectHardware(): Bi[] {
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const reasons: Bi[] = [];
  const mem = n.deviceMemory ?? 0, cores = n.hardwareConcurrency ?? 0;
  if (mem && mem <= 2) reasons.push({ en: `${mem} GB RAM`, es: `${mem} GB de RAM` });
  else if (mem && mem <= 4 && cores && cores <= 4) reasons.push({ en: `${mem} GB RAM and ${cores} cores`, es: `${mem} GB de RAM y ${cores} núcleos` });
  else if (cores && cores <= 2) reasons.push({ en: `${cores} CPU cores`, es: `${cores} núcleos de CPU` });
  if (n.connection?.saveData) reasons.push({ en: "data saver on", es: "ahorro de datos activado" });
  const gpu = gpuName();
  const gpuShort = gpu ? gpu.replace(/^ANGLE \(|\)$/g, "").split(",").slice(0, 2).join(",").trim() : "";
  if (gpu === null) reasons.push({ en: "no WebGL", es: "sin WebGL" });
  else if (WEAK_GPU.test(gpu)) reasons.push({ en: `basic graphics (${gpuShort})`, es: `gráficos básicos (${gpuShort})` });
  return reasons;
}

/** Se llama una vez en el navegador, antes de hidratar. */
export function initPerf() {
  if (typeof window === "undefined") return;
  const saved = read(MODE_KEY);
  const mode: PerfMode = saved === "on" || saved === "off" ? saved : "auto";
  const reasons = detectHardware();
  const remembered = read(AUTO_KEY);               // fps medidos en una visita anterior
  if (remembered) reasons.push({ en: `${remembered} fps measured`, es: `${remembered} fps medidos` });
  commit({ mode, auto: reasons.length > 0, reasons });
}

/* ---------- Detección por rendimiento real ---------- */
let probing = false;
/** Mide ~2 s de frames con la página visible; si va lenta y el modo es automático, activa el modo rendimiento. */
export function probeFrameRate() {
  if (typeof window === "undefined" || probing || state.auto || state.mode !== "auto") return;
  probing = true;
  const times: number[] = [];
  let last = 0, start = 0;
  const step = (t: number) => {
    if (document.visibilityState !== "visible") { probing = false; return; }
    if (last) times.push(t - last);
    else start = t;
    last = t;
    if (t - start < 2200) { requestAnimationFrame(step); return; }
    const sorted = times.slice(5).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const slow = sorted.filter((x) => x > 34).length / Math.max(sorted.length, 1);
    if (median > 24 || slow > 0.3) {
      const fps = String(Math.round(1000 / median));
      const why = { en: `${fps} fps measured`, es: `${fps} fps medidos` };
      write(AUTO_KEY, fps);
      commit({ ...state, auto: true, reasons: [...state.reasons, why] });
    }
    probing = false;
  };
  setTimeout(() => requestAnimationFrame(step), 1000);   // se deja asentar la página tras la intro
}

/* ---------- API ---------- */
export function setPerfMode(mode: PerfMode) {
  write(MODE_KEY, mode);
  commit({ ...state, mode });
}
/** Lectura directa para bucles de animación (sin re-render). */
export const isLite = () => state.lite;
export const getPerf = () => state;
export function subscribePerf(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export function usePerf(): PerfState {
  return useSyncExternalStore(subscribePerf, () => state, () => SERVER);
}
