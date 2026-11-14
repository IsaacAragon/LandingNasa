import { useEffect, useRef, useState } from "react";
import marsVideo from "./assets/MarsVIdeo.mp4";

/* Segundo del video en el que empieza el zoom al planeta */
const ZOOM_AT = 9;
/* Coreografía del zoom (ms desde que empieza) */
const ZOOM_MS = 2600;       // duración total del zoom
const REVEAL_AT = 1500;     // el sitio empieza a aparecer bajo el zoom
const FADE_AT = 1800;       // la capa del video empieza a desvanecerse (ver .intro[data-phase="out"])
const DONE_AT = 2800;       // la capa se retira del DOM

/* Escala del video: deriva lenta mientras se reproduce y zoom final */
const DRIFT_FROM = 1.04;
const DRIFT_TO = 1.12;
const ZOOM_TO = 6;

type Phase = "play" | "zoom" | "out";
interface Props { onReveal: () => void; onDone: () => void }

/* Curva suave en ambos extremos, sin tirones al empezar ni al terminar */
const smoother = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);
const clamp01 = (u: number) => Math.min(Math.max(u, 0), 1);

/**
 * Pantalla inicial: video a pantalla completa en capas con parallax.
 * En el segundo ZOOM_AT la cámara se hunde en el planeta y da paso al sitio.
 *
 * Todo el movimiento sale de un único bucle requestAnimationFrame que escribe
 * solo `transform` y `opacity` en capas compuestas por la GPU: la escala
 * del zoom continúa exactamente desde la de la deriva, sin saltos.
 */
export default function Intro({ onReveal, onDone }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const layers = useRef<HTMLDivElement[]>([]);
  const [phase, setPhase] = useState<Phase>("play");

  const zoomStart = useRef<number | null>(null);
  const skip = useRef(() => { if (zoomStart.current === null) zoomStart.current = -1; }).current;

  useEffect(() => {
    const v = video.current!;
    const reveal = { done: false }, fade = { done: false }, end = { done: false };
    let raf = 0;
    let from = DRIFT_FROM;                       // escala en el instante en que empieza el zoom
    // Parallax por puntero, suavizado (no se escribe estilo en cada pointermove)
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const move = (e: PointerEvent) => {
      target.x = (e.clientX / innerWidth) * 2 - 1;
      target.y = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener("pointermove", move, { passive: true });

    const frame = (now: number) => {
      const t = v.currentTime;
      if (zoomStart.current === null && t >= ZOOM_AT) zoomStart.current = -1;
      if (zoomStart.current === -1) {            // arranca el zoom en este frame
        zoomStart.current = now;
        from = DRIFT_FROM + (DRIFT_TO - DRIFT_FROM) * clamp01(t / ZOOM_AT);
        setPhase("zoom");
      }

      let scale: number, glowScale = 1, glowOpacity = 0.55, flashOpacity = 0;
      if (zoomStart.current === null) {
        const p = clamp01(t / ZOOM_AT);
        scale = DRIFT_FROM + (DRIFT_TO - DRIFT_FROM) * p;
        if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      } else {
        const ms = now - zoomStart.current;
        const k = smoother(clamp01(ms / ZOOM_MS));
        scale = from * Math.pow(ZOOM_TO / from, k);   // interpolación logarítmica: el zoom se siente uniforme
        glowScale = 1 + 1.6 * k;                       // el halo crece más despacio: otra profundidad
        glowOpacity = 0.55 + 0.45 * k;
        flashOpacity = smoother(clamp01((ms - 700) / 1300)) * 0.9;
        if (!reveal.done && ms >= REVEAL_AT) { reveal.done = true; onReveal(); }
        if (!fade.done && ms >= FADE_AT) { fade.done = true; setPhase("out"); }
        if (!end.done && ms >= DONE_AT) { end.done = true; onDone(); return; }
      }

      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      const [far, mid, near] = layers.current;
      far.style.transform = `translate3d(${cur.x * -10}px, ${cur.y * -8}px, 0)`;
      mid.style.transform = `translate3d(${cur.x * -26}px, ${cur.y * -18}px, 0) scale(${glowScale})`;
      near.style.transform = `translate3d(${cur.x * 14}px, ${cur.y * 10}px, 0)`;
      v.style.transform = `scale(${scale})`;
      mid.style.opacity = String(glowOpacity);
      flash.current!.style.opacity = String(flashOpacity);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    v.play().catch(skip);                     // si el navegador bloquea el autoplay, se entra directo
    v.addEventListener("ended", skip);
    v.addEventListener("error", skip);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", move);
      v.removeEventListener("ended", skip);
      v.removeEventListener("error", skip);
    };
  }, [skip, onReveal, onDone]);

  // Bloquea el scroll mientras dura la intro; Esc, Enter, espacio o la rueda la saltan
  useEffect(() => {
    const html = document.documentElement;
    html.style.overflow = "hidden";
    const skipKey = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip(); };
    const skipWheel = (e: WheelEvent) => { if (e.deltaY > 20) skip(); };
    addEventListener("keydown", skipKey);
    addEventListener("wheel", skipWheel, { passive: true });
    return () => {
      html.style.overflow = "";
      removeEventListener("keydown", skipKey);
      removeEventListener("wheel", skipWheel);
    };
  }, [skip]);

  const layer = (i: number) => (el: HTMLDivElement | null) => { if (el) layers.current[i] = el; };

  return (
    <div className="intro" data-phase={phase} aria-label="Introducción en video">
      <div ref={layer(0)} className="intro-layer">
        <video
          ref={video}
          className="intro-video"
          src={marsVideo}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      </div>
      <div ref={layer(1)} className="intro-layer intro-glow" aria-hidden="true" />
      <div className="intro-layer intro-vignette" aria-hidden="true" />
      <div ref={flash} className="intro-layer intro-flash" aria-hidden="true" />
      <div ref={layer(2)} className="intro-layer intro-ui">
        <span className="intro-coord" aria-hidden="true">Aproximación · 18.44°N 77.45°E</span>
        <button className="intro-skip" onClick={skip}>
          Entrar
          <span className="intro-bar" aria-hidden="true"><i ref={bar} /></span>
        </button>
      </div>
    </div>
  );
}
