import { useCallback, useEffect, useRef, useState } from "react";
import Intro from "./Intro";
import Planet from "./Planet";
import { JEZERO } from "./mars";
import "./landing.css";
import "./intro.css";

/* ---------- Contenido (edita aquí) ---------- */
const PROJECT = "Aresmap";
const TEAM = "Equipo Aresmap";
const REPO_URL = "#";
const DEMO_URL = "#";

interface DataLayer { name: string; mission: string; instrument: string; use: string }
const LAYERS: DataLayer[] = [
  { name: "Relieve", mission: "Mars Global Surveyor", instrument: "MOLA", use: "Altimetría láser que se convierte en pendientes y cotas. Todo tramo demasiado inclinado sale de la ruta." },
  { name: "Superficie", mission: "Mars Reconnaissance Orbiter", instrument: "HiRISE", use: "Imágenes a unos 25 cm por píxel. Se ven rocas, dunas y grietas que un astronauta puede pisar." },
  { name: "Contexto", mission: "Mars Reconnaissance Orbiter", instrument: "CTX", use: "Cobertura a 6 m por píxel para unir el detalle de HiRISE con el mapa completo de la zona." },
  { name: "Térmica", mission: "Mars Odyssey", instrument: "THEMIS", use: "La inercia térmica distingue roca firme de arena suelta, y con eso, dónde se puede caminar." },
  { name: "Mineralogía", mission: "Mars Reconnaissance Orbiter", instrument: "CRISM", use: "Minerales hidratados y carbonatos: los puntos donde la ciencia nueva es más probable." },
  { name: "Clima", mission: "Curiosity", instrument: "REMS y RAD", use: "Temperatura, presión y radiación medidas en superficie para elegir la ventana de salida." },
];
const MISSIONS = new Set(LAYERS.map((l) => l.mission)).size;

/* Cráter que modelamos */
const CRATER_FACTS = [
  { value: "45 km", label: "de diámetro" },
  { value: "> 3.500 M", label: "de años: edad del antiguo lago" },
  { value: "18 feb 2021", label: "aterrizaje de Perseverance" },
  { value: `${JEZERO.lat}°N · ${JEZERO.lon}°E`, label: "borde occidental de Isidis Planitia" },
];

/* Expedición: de la órbita a la caminata */
const STEPS = [
  { t: "Planear", d: "Elegir destino en el delta y trazar rutas candidatas sobre el relieve." },
  { t: "Evaluar", d: "Cruzar pendiente, terreno, radiación y clima en cada tramo." },
  { t: "Salir", d: "Seguir la ruta con las condiciones actualizadas y una vía de retorno." },
  { t: "Descubrir", d: "Registrar hallazgos nuevos y devolverlos al mapa." },
];

// Ruta de ejemplo sobre el delta occidental (lon, lat)
const ROUTE: [number, number][] = [[77.42, 18.4], [77.46, 18.42], [77.5, 18.45], [77.53, 18.5]];
const MARS_RADIUS_KM = 3389.5;
const ROUTE_KM = ROUTE.slice(1).reduce((km, [lon, lat], i) => {
  const [lon0, lat0] = ROUTE[i];
  const r = Math.PI / 180;
  const h = Math.sin(((lat - lat0) * r) / 2) ** 2 + Math.cos(lat0 * r) * Math.cos(lat * r) * Math.sin(((lon - lon0) * r) / 2) ** 2;
  return km + 2 * MARS_RADIUS_KM * Math.asin(Math.sqrt(h));
}, 0);

/* ---------- Campo de estrellas (capa más lejana del parallax) ---------- */
function Starfield({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round((innerWidth * innerHeight) / 4500) }, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: Math.random() ** 3 * 1.6 + 0.2, p: Math.random() * 6.28, s: Math.random() * 0.8 + 0.2,
      }));
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const s of stars) {
        const a = still ? 0.6 : 0.3 + 0.6 * Math.abs(Math.sin(t / 1400 * s.s + s.p));
        ctx.fillStyle = `rgba(245,242,236,${a})`;
        const y = (((s.y - (scrollY * s.r) / 10) % innerHeight) + innerHeight) % innerHeight;
        ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.28); ctx.fill();
      }
      if (!still && active) raf = requestAnimationFrame(draw);
    };
    resize(); draw(0);
    addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [active]);
  return <canvas ref={ref} className="stars" aria-hidden="true" />;
}

/* ---------- Parallax por scroll ----------
   Cada elemento con data-speed se desplaza según su distancia al centro
   de la pantalla: positivo = más lento que el scroll, negativo = más rápido. */
function useScrollParallax(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-speed]"));
    const applied = new Map<HTMLElement, number>();
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = innerHeight / 2;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const offset = (r.top - (applied.get(el) ?? 0) + r.height / 2 - mid) * -Number(el.dataset.speed);
        applied.set(el, offset);
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      }
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", queue);
      removeEventListener("resize", queue);
      els.forEach((el) => (el.style.translate = ""));
    };
  }, [enabled]);
}

const REDUCED = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Página ---------- */
export default function MarswalkLanding() {
  const [active, setActive] = useState(0);
  const layer = LAYERS[active];
  const [intro, setIntro] = useState(!REDUCED);       // con movimiento reducido no hay intro
  const [revealed, setRevealed] = useState(REDUCED);
  const reveal = useCallback(() => setRevealed(true), []);
  const finish = useCallback(() => setIntro(false), []);
  useScrollParallax(revealed && !REDUCED);

  return (
    <>
      <Starfield active={revealed} />
      <Planet active={revealed} focusId="crater" exitId="expedicion" />
      <div className="grain" aria-hidden="true" />
      {intro && <Intro onReveal={reveal} onDone={finish} />}

      <div className="site" data-state={revealed ? "in" : "intro"} aria-hidden={!revealed || undefined}>
        <a className="skip" href="#crater">Saltar al contenido</a>

        <header className="nav-wrap">
          <div className="nav">
            <a href="#top" className="brand">{PROJECT}</a>
            <nav aria-label="Principal">
              <ul>
                <li><a href="#crater">El cráter</a></li>
                <li><a href="#expedicion">La expedición</a></li>
                <li><a href="#capas">Datos</a></li>
              </ul>
            </nav>
            <a className="btn btn-glass btn-sm" href={DEMO_URL}>Ver demo</a>
          </div>
        </header>

        <main id="top">
          {/* HERO: el planeta gira a la derecha (capa fija), el texto flota encima */}
          <section className="wrap hero">
            <div className="hero-copy" data-speed="0.14">
              <p className="kicker"><span className="dot" aria-hidden="true" />NASA Space Apps Challenge</p>
              <h1>{PROJECT}<span>El mapa para el primer paso en Marte.</span></h1>
              <p className="lead">
                Seis capas de datos de {MISSIONS} misiones de la NASA en una sola vista para planear y recorrer una caminata en el cráter Jezero.
              </p>
              <div className="actions">
                <a className="btn btn-primary" href="#crater">Explorar el cráter <span aria-hidden="true">→</span></a>
                <a className="btn btn-glass" href="#expedicion">La expedición</a>
              </div>
            </div>
            <div className="hero-hud" aria-hidden="true">
              <div className="hud-card" data-speed="-0.12">
                <span className="hud-icon">◎</span>
                <span><b>Cráter Jezero</b><small>{JEZERO.lat}°N · {JEZERO.lon}°E</small></span>
              </div>
              <div className="hud-card" data-speed="-0.22">
                <span className="hud-icon">≡</span>
                <span><b>{LAYERS.length} capas integradas</b><small>{MISSIONS} misiones de la NASA</small></span>
              </div>
            </div>
            <a className="scroll-cue" href="#crater" aria-label="Bajar al cráter"><span /></a>
          </section>

          {/* CRÁTER: el planeta se acerca y gira hasta dejar Jezero de frente */}
          <section id="crater" className="wrap crater">
            <div className="crater-copy">
              <p className="kicker"><span className="dot" aria-hidden="true" />El cráter que modelamos</p>
              <h2 data-speed="0.06">Jezero, <span>un lago seco con memoria.</span></h2>
              <p className="lead">
                Hace más de 3.500 millones de años Jezero fue un lago. Un río dejó un delta en su borde occidental:
                capas de sedimento donde la vida microbiana, si existió, pudo quedar registrada. Aresmap modela su relieve,
                sus pendientes y el terreno del delta para saber por dónde se puede caminar.
              </p>
              <dl className="facts">
                {CRATER_FACTS.map((f) => (
                  <div key={f.label} className="fact">
                    <dt>{f.value}</dt>
                    <dd>{f.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* EXPEDICIÓN */}
          <section id="expedicion" className="wrap expedition">
            <header className="section-head">
              <p className="kicker"><span className="dot" aria-hidden="true" />La expedición</p>
              <h2>De la órbita <span>a la caminata.</span></h2>
            </header>
            <div className="bento">
              <article className="card card-feature" data-speed="0.04">
                <p className="card-label">Ruta de ejemplo · delta occidental</p>
                <svg className="route" viewBox="0 0 320 160" aria-hidden="true">
                  <defs>
                    <linearGradient id="rt" x1="0" x2="1"><stop offset="0" stopColor="#f5f2ec" stopOpacity=".3" /><stop offset="1" stopColor="#f5f2ec" /></linearGradient>
                  </defs>
                  <path d="M20 130 C 80 120, 110 100, 150 92 S 240 60, 300 24" fill="none" stroke="url(#rt)" strokeWidth="2" strokeDasharray="4 6" />
                  {[[20, 130], [150, 92], [228, 64], [300, 24]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4.5" />)}
                </svg>
                <div className="stats">
                  <div><b>{ROUTE_KM.toFixed(1)} km</b><span>de recorrido</span></div>
                  <div><b>{ROUTE.length}</b><span>puntos de paso</span></div>
                  <div><b>{LAYERS.length}</b><span>capas por tramo</span></div>
                </div>
              </article>
              {STEPS.map((s, i) => (
                <article key={s.t} className="card step" data-speed={i % 2 ? "-0.05" : "0.03"}>
                  <span className="step-n">0{i + 1}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </article>
              ))}
            </div>
          </section>

          {/* CAPAS DE DATOS */}
          <section id="capas" className="wrap layers">
            <div>
              <header className="section-head">
                <p className="kicker"><span className="dot" aria-hidden="true" />Capas de datos</p>
                <h2>Cada misión responde <span>una pregunta distinta.</span></h2>
              </header>
              <div className="segmented" role="tablist" aria-label="Capas de datos">
                {LAYERS.map((l, i) => (
                  <button key={l.name} role="tab" aria-selected={i === active} onClick={() => setActive(i)}>
                    {l.name}
                  </button>
                ))}
              </div>
              <div className="card detail" role="tabpanel" aria-live="polite">
                <p className="card-label">{layer.mission} · {layer.instrument}</p>
                <p>{layer.use}</p>
              </div>
            </div>
            <div className="stack" aria-hidden="true" data-speed="-0.08">
              {LAYERS.map((l, i) => (
                <div key={l.name} className="plane" data-on={i === active} style={{ ["--i" as string]: i }}>
                  <span>{l.instrument}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="wrap close">
            <div className="card close-card">
              <h2 data-speed="0.05">Marte ya está mapeado. <span>Falta hacerlo caminable.</span></h2>
              <div className="actions">
                <a className="btn btn-primary" href={DEMO_URL}>Ver la solución <span aria-hidden="true">→</span></a>
                <a className="btn btn-glass" href={REPO_URL}>Código en GitHub</a>
              </div>
            </div>
          </section>
        </main>

        <footer className="wrap footer">
          <span>{PROJECT} · {TEAM} · NASA Space Apps Challenge</span>
          <span>Datos: NASA/JPL, USGS, NASA Trek · Planeta generado por procedimiento</span>
        </footer>
      </div>
    </>
  );
}
