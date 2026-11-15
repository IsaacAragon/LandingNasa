import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Intro from "./Intro";
import Planet from "./Planet";
import Navbar from "./Navbar";
import GaleTopography from "./GaleTopography";
import { GALE, MOUNT_SHARP } from "./mars";
import {
  BOXWORK_TIMELINE, DOSE, ELEMENTS, EZ_VOTES, GALE_FACTS, GALE_TIMELINE, GALLERY, METHANE, MOUNT_SHARP_KM,
  RADIATION_BARS, REMS_FIELDS, ROUTE_STOPS, SOIL_WATER, STRATA, TRAVERSE,
} from "./data";
import { BarChart, ChartFrame, ElementsChart, Kpis, MethaneChart, RangeMeter, StrataChart, Timeline } from "./charts";
import "./landing.css";
import "./intro.css";
import "./charts.css";

/* ---------- Contenido (edita aquí) ---------- */
const PROJECT = "Aresmap";
const TEAM = "Equipo Aresmap";
const REPO_URL = "#";
const DEMO_URL = "#";

const fmtLat = (v: number) => `${Math.abs(v)}°${v < 0 ? "S" : "N"}`;
const NAV_LINKS = [
  { id: "zona", label: "La zona" },
  { id: "gale", label: "Gale" },
  { id: "topografia", label: "Topografía" },
  { id: "expedicion", label: "Expedición" },
  { id: "capas", label: "Datos" },
];
const GALE_COORDS = `${fmtLat(GALE.lat)} · ${GALE.lon}°E`;

/* Cráter Gale: la zona habitable */
const ZONE_FACTS = [
  { value: `~${MOUNT_SHARP_KM} km`, label: "de capas en Mount Sharp que registran el clima" },
  { value: `${SOIL_WATER.min}–${SOIL_WATER.max} %`, label: "de agua accesible en el suelo (#1022)" },
  { value: `${DOSE.surface.toLocaleString("es")} mSv/día`, label: "de radiación medida en la superficie" },
  { value: "3.ª zona", label: "más votada para exploración humana (2015)" },
];

/* Capas de datos: cada una con su texto, su gráfico y sus fuentes */
interface DataLayer { name: string; title: string; text: string; sources: string; chart: ReactNode }
const LAYERS: DataLayer[] = [
  {
    name: "Geología", title: "Un lago antiguo habitable",
    text: "En Yellowknife Bay, Curiosity encontró rocas de un lago con pH neutro y poca sal, capaz de sostener microbios quimiolitoautótrofos. Duró, como mínimo, de cientos a decenas de miles de años; cada lago del sistema de deltas y ríos pudo llenar las depresiones hasta ~10 000 años.",
    sources: "F1, F2",
    chart: <ElementsChart items={ELEMENTS} />,
  },
  {
    name: "Topografía", title: "Mount Sharp: subir es viajar en el tiempo",
    text: "Mount Sharp mide ~5 km. Al subir, Curiosity pasó de capas ricas en arcillas a capas con sulfatos, un mineral salado que se forma cuando el agua se seca: el clima se volvía más seco. La base del mapa es el DEM de 1 m por píxel.",
    sources: "F3, F4, F15",
    chart: <StrataChart strata={STRATA} km={MOUNT_SHARP_KM} />,
  },
  {
    name: "Objetivo", title: "Boxwork: el objetivo que pone el reto",
    text: "Crestas bajas que se forman cuando el agua subterránea deja minerales en las grietas de la roca y los cementa. Cubren kilómetros de una capa de Mount Sharp y no se han visto en ninguna otra parte de la montaña. El enunciado del reto los usa como ejemplo de objetivo científico.",
    sources: "F4, F5, F6",
    chart: <Timeline items={BOXWORK_TIMELINE} />,
  },
  {
    name: "Muestreo", title: "Orgánicos y metano",
    text: "SAM detectó materia orgánica conservada en lodolitas de ~3000 millones de años. El metano de fondo sube y baja con las estaciones y tiene picos aislados. Ninguno de los dos hallazgos prueba vida: son puntos de muestreo para la ruta.",
    sources: "F7, F8, F9",
    chart: <MethaneChart m={METHANE} />,
  },
  {
    name: "Radiación", title: "Seguridad primero",
    text: `RAD midió en la superficie ${DOSE.surface.toLocaleString("es")} mSv/día de agosto 2012 a junio 2013: ${(DOSE.cruise / DOSE.surface).toLocaleString("es", { maximumFractionDigits: 1 })} veces menos que durante el viaje. La dosis baja cuando sube la presión, y junto a lomas y buttes el relieve bloquea hasta un 19 %. Las alertas de clima espacial llegan de DONKI.`,
    sources: "F10, F11, F23, F33, F34",
    chart: <BarChart rows={RADIATION_BARS} unit="mSv/día" caption="Dosis equivalente media (mSv/día)" />,
  },
  {
    name: "Clima", title: "14 años de datos tomados en el terreno",
    text: "El JSON público de REMS da, por sol, temperatura del aire y del suelo, presión, opacidad e índice UV. Es un archivo de divulgación: los datos científicos están en el PDS. El registro de posiciones de Curiosity añade elevación e inclinación a lo largo de la ruta.",
    sources: "F13, F14, F25",
    chart: (
      <>
        <Kpis items={[
          { value: String(TRAVERSE.years), label: "años de datos" },
          { value: TRAVERSE.points.toLocaleString("es"), label: "posiciones registradas" },
          { value: TRAVERSE.sol.toLocaleString("es"), label: "último sol del registro" },
          { value: `${TRAVERSE.km.toLocaleString("es")} km`, label: "recorridos" },
        ]} />
        <ul className="fields">{REMS_FIELDS.map(([k, v]) => <li key={k}><code>{k}</code><span>{v}</span></li>)}</ul>
      </>
    ),
  },
  {
    name: "Terreno humano", title: "Candidato a exploración humana",
    text: "En el taller de NASA sobre sitios de aterrizaje y Zonas de Exploración (2015), Gale tuvo tres propuestas: #1020, #1022 y #1040. La #1020 fue la tercera más votada. La #1022 señala agua accesible en el suelo. USGS publica el DEM de 1 m y una ortofoto de 25 cm para trazar pendientes y la ruta segura.",
    sources: "F15, F16, F17, F18, F19",
    chart: (
      <>
        <BarChart rows={EZ_VOTES} unit="votos" digits={0} caption="Votos por Zona de Exploración, taller NASA 2015" />
        <RangeMeter min={SOIL_WATER.min} max={SOIL_WATER.max} scale={5} unit="%" label="Agua en el suelo" />
      </>
    ),
  },
];

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
    const speed = new Map(els.map((el) => [el, Number(el.dataset.speed)]));
    const update = () => {
      raf = 0;
      const mid = innerHeight / 2, vh = innerHeight;
      // Primero se leen todas las posiciones y después se escribe: sin recalcular el layout por elemento
      const next: [HTMLElement, number][] = [];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const prev = applied.get(el) ?? 0;
        const top = r.top - prev;
        if (top > vh * 1.5 || top + r.height < -vh * 0.5) continue;   // lejos de pantalla: no se toca
        let offset = (top + r.height / 2 - mid) * -speed.get(el)!;
        // data-clamp: tope relativo al alto (imágenes dentro de un marco con margen de escala)
        const k = Number(el.dataset.clamp);
        if (k) offset = Math.max(-r.height * k, Math.min(r.height * k, offset));
        next.push([el, offset]);
      }
      for (const [el, offset] of next) {
        if (Math.abs((applied.get(el) ?? 0) - offset) < 0.1) continue;
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

/* ---------- Mapa esquemático de la ruta segura en Gale ----------
   Mismas posiciones que la ruta dibujada en el planeta (unidades del radio del cráter). */
const MAP = { x0: -0.75, y0: 0.95, k: 240 };
const toMap = ([x, y]: [number, number]) => [(x - MAP.x0) * MAP.k, (MAP.y0 - y) * MAP.k] as const;
function RouteMap() {
  const pts = ROUTE_STOPS.map((st) => toMap(st.pos));
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [cx, cy] = toMap([0, 0]);
  const [mx, my] = toMap([MOUNT_SHARP.x, MOUNT_SHARP.y]);
  return (
    <svg className="route-map" viewBox="0 0 312 276" role="img" aria-label="Esquema del noroeste de Gale con la ruta desde Bradbury Landing hasta los boxwork de Mount Sharp">
      <circle cx={cx} cy={cy} r={MAP.k} className="rim" />
      {[1, 0.75, 0.5, 0.25].map((f, i) => (
        <circle key={f} cx={mx} cy={my} r={MOUNT_SHARP.r * MAP.k * f} className="contour" style={{ opacity: 0.25 + i * 0.15 }} />
      ))}
      <text x={mx + 24} y={268} className="map-label">Mount Sharp</text>
      <path d={d} className="route-line" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 6 : 4.5} className={i === pts.length - 1 ? "stop goal" : i === 0 ? "stop start" : "stop"} />
      ))}
      <text x={pts[0][0] - 8} y={pts[0][1] - 12} className="map-label" textAnchor="end">Bradbury</text>
      <text x={pts[pts.length - 1][0] + 12} y={pts[pts.length - 1][1] + 4} className="map-label strong">Boxwork</text>
    </svg>
  );
}

/* ---------- Imagen de la galería con paralaje interior ---------- */
type GalleryItem = (typeof GALLERY)[number];
const img = (id: string) => GALLERY.find((g) => g.id === id)!;
function Shot({ g, variant }: { g: GalleryItem; variant: "feature" | "strip" | "small" | "half" }) {
  return (
    <figure className={`card shot shot-${variant}`}>
      <div className="shot-media">
        <img src={g.src} width={g.w} height={g.h} alt={`${g.title}. ${g.text}`} loading="lazy" decoding="async" data-speed="0.05" data-clamp="0.06" />
      </div>
      <figcaption>
        <span className="card-label">{g.date} · {g.id}</span>
        <b>{g.title}</b>
        <span>{g.text}</span>
        <small>Imagen: {g.credit}</small>
      </figcaption>
    </figure>
  );
}

/* Preferencia de movimiento reducido. En el servidor (prerender) vale false y en el navegador
   se lee después de hidratar: así el HTML del servidor y el del cliente coinciden. */
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia(REDUCED_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/* ---------- Página ---------- */
export default function MarswalkLanding() {
  const [active, setActive] = useState(0);
  const layer = LAYERS[active];
  const reduced = useReducedMotion();
  const [introDone, setIntroDone] = useState(false);
  const [revealedByIntro, setRevealed] = useState(false);
  const intro = !reduced && !introDone;                 // con movimiento reducido no hay intro
  const revealed = reduced || revealedByIntro;
  const reveal = useCallback(() => setRevealed(true), []);
  const finish = useCallback(() => setIntroDone(true), []);
  useScrollParallax(revealed && !reduced);

  return (
    <>
      <Starfield active={revealed} />
      <Planet active={revealed} focusId="zona" exitId="gale" />
      <div className="grain" aria-hidden="true" />
      {intro && <Intro onReveal={reveal} onDone={finish} />}

      <div className="site" data-state={revealed ? "in" : "intro"}>
        <a className="skip" href="#zona">Saltar al contenido</a>

        <Navbar project={PROJECT} links={NAV_LINKS} ctaHref={DEMO_URL} />

        <main id="top">
          {/* HERO: el planeta gira a la derecha (capa fija), el texto flota encima */}
          <section className="wrap hero">
            <div className="hero-copy" data-speed="0.07">
              <p className="kicker"><span className="dot" aria-hidden="true" />NASA Space Apps Challenge</p>
              <h1>{PROJECT}<span>El mapa para el primer paso en Marte.</span></h1>
              <p className="lead">
                {LAYERS.length} capas de datos de Curiosity, MRO y la NASA en una sola vista para llevar a los primeros astronautas
                del cráter Gale hasta los boxwork de Mount Sharp.
              </p>
              <div className="actions">
                <a className="btn btn-primary" href="#zona">Ver la zona <span aria-hidden="true">→</span></a>
                <a className="btn btn-glass" href="#expedicion">La expedición</a>
              </div>
            </div>
            <div className="hero-hud" aria-hidden="true">
              <div className="hud-card" data-speed="-0.12" data-anchor="gale">
                <span className="hud-icon">◎</span>
                <span><b>Cráter Gale</b><small>{GALE_COORDS}</small></span>
              </div>
              <div className="hud-card" data-speed="-0.22">
                <span className="hud-icon">≡</span>
                <span><b>{LAYERS.length} capas integradas</b><small>{TRAVERSE.km.toLocaleString("es")} km de terreno probado</small></span>
              </div>
            </div>
            <a className="scroll-cue" href="#zona" aria-label="Bajar a la zona"><span /></a>
          </section>

          {/* ZONA (alta y fijada): zoom al cráter → inicio → destino → ruta óptima simulada */}
          <section id="zona" className="zone" data-step="0">
            <div className="wrap zone-pin">
              <div className="crater-copy">
                <p className="kicker"><span className="dot" aria-hidden="true" />Zona habitable para astronautas</p>
                <h2>Gale, <span>un lago que se volvió montaña.</span></h2>
                <p className="lead">
                  Un lago antiguo con agua de pH neutro, una montaña de ~{MOUNT_SHARP_KM} km de capas y el terreno de Marte mejor
                  medido desde el suelo. Fue candidato de la NASA para la exploración humana y es nuestro destino.
                </p>
                <ol className="card zone-steps" aria-label="Simulación de la ruta">
                  <li data-i="0"><span className="step-n">01</span><span><b>Acercamiento</b><small>Gale y Mount Sharp, {GALE_COORDS}</small></span></li>
                  <li data-i="1"><span className="step-n">02</span><span><b>Inicio</b><small>{ROUTE_STOPS[0].name}: {ROUTE_STOPS[0].what.toLowerCase()}</small></span></li>
                  <li data-i="2"><span className="step-n">03</span><span><b>Destino</b><small>{ROUTE_STOPS[ROUTE_STOPS.length - 1].name} en la ladera de Mount Sharp</small></span></li>
                  <li data-i="3"><span className="step-n">04</span><span><b>Ruta óptima</b><small>{ROUTE_STOPS.length} paradas sobre terreno ya recorrido por Curiosity</small></span></li>
                </ol>
                <p className="planet-note">Cráter exagerado ~4× y ruta esquemática para que se lean a esta escala.</p>
              </div>
            </div>
          </section>

          {/* GALE EN DATOS: imágenes de la NASA intercaladas con cifras y fechas */}
          <section id="gale" className="wrap gale">
            <header className="section-head">
              <p className="kicker"><span className="dot" aria-hidden="true" />Gale en datos</p>
              <h2>Un cráter <span>con historia.</span></h2>
            </header>

            <div className="gale-bento">
              <Shot g={img("PIA16032")} variant="feature" />
              <div className="card zone-figures">
                <p className="card-label">La zona en cifras</p>
                <dl className="facts">
                  {ZONE_FACTS.map((f) => <div key={f.label} className="fact"><dt>{f.value}</dt><dd>{f.label}</dd></div>)}
                </dl>
              </div>

              <Shot g={img("PIA26552")} variant="strip" />

              <Shot g={img("PIA16099")} variant="small" />
              <Shot g={img("PIA26632")} variant="small" />
              <Shot g={img("PIA26306")} variant="small" />

              <dl className="facts curious">
                {GALE_FACTS.map((f) => <div key={f.label} className="fact"><dt>{f.value}</dt><dd>{f.label}</dd></div>)}
              </dl>

              <Shot g={img("PIA26560")} variant="half" />
              <Shot g={img("PIA26551")} variant="half" />
            </div>

            <div className="card gale-dates">
              <p className="card-label">Gale en fechas</p>
              <ol className="htimeline" tabIndex={0} aria-label="Línea de tiempo de Gale">
                {GALE_TIMELINE.map((t) => <li key={t.date}><time>{t.date}</time><span>{t.label}</span></li>)}
              </ol>
            </div>
          </section>

          <GaleTopography />

          {/* EXPEDICIÓN: la ruta segura hasta los boxwork */}
          <section id="expedicion" className="wrap expedition">
            <header className="section-head">
              <p className="kicker"><span className="dot" aria-hidden="true" />La expedición</p>
              <h2>Del lago <span>a los boxwork.</span></h2>
            </header>
            <div className="bento">
              <article className="card card-feature" data-speed="0.04">
                <p className="card-label">Ruta segura · esquema de Gale</p>
                <RouteMap />
                <div className="stats">
                  <div><b>{TRAVERSE.km.toLocaleString("es")} km</b><span>ya recorridos por Curiosity</span></div>
                  <div><b>{ROUTE_STOPS.length}</b><span>paradas científicas</span></div>
                  <div><b>~{MOUNT_SHARP_KM} km</b><span>de montaña por delante</span></div>
                </div>
              </article>
              <article className="card stops" data-speed="-0.04">
                <p className="card-label">Paradas, de abajo hacia arriba</p>
                <ol>
                  {ROUTE_STOPS.map((s, i) => (
                    <li key={s.name} data-goal={i === ROUTE_STOPS.length - 1}>
                      <span className="step-n">0{i + 1}</span>
                      <span><b>{s.name}</b><small>{s.what}</small></span>
                      <em>{s.layer}</em>
                    </li>
                  ))}
                </ol>
              </article>
              <article className="card why" data-speed="0.03">
                <p className="card-label">Por qué es la ruta óptima hoy</p>
                <p>
                  Cada tramo ya lo recorrió un rover, así que el terreno es transitable sin suposiciones. El siguiente paso es
                  optimizarla sobre el DEM de 1 m con dos costos: la pendiente y la radiación, buscando el resguardo de lomas
                  y buttes, donde la dosis baja hasta un 19 %.
                </p>
              </article>
            </div>
          </section>

          {/* CAPAS DE DATOS: cada pestaña con su gráfico */}
          <section id="capas" className="wrap layers">
            <div>
              <header className="section-head">
                <p className="kicker"><span className="dot" aria-hidden="true" />Capas de datos</p>
                <h2>Cada capa responde <span>una pregunta distinta.</span></h2>
              </header>
              <div className="segmented" role="tablist" aria-label="Capas de datos">
                {LAYERS.map((l, i) => (
                  <button key={l.name} id={`tab-${i}`} role="tab" aria-selected={i === active} aria-controls="layer-panel" onClick={() => setActive(i)}>
                    {l.name}
                  </button>
                ))}
              </div>
              <div className="layer-text">
                <h3>{layer.title}</h3>
                <p>{layer.text}</p>
              </div>
            </div>
            <div className="card layer-panel" id="layer-panel" role="tabpanel" aria-labelledby={`tab-${active}`} key={layer.name}>
              <ChartFrame title={layer.title} sources={layer.sources}>{layer.chart}</ChartFrame>
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
          <span>Datos: NASA/JPL-Caltech, MSL Curiosity (RAD, REMS, SAM), USGS, DONKI · Planeta generado por procedimiento</span>
        </footer>
      </div>
    </>
  );
}
