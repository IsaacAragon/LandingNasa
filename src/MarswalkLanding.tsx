import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Intro from "./Intro";
import Planet from "./Planet";
import { scrollTop, viewportHeight } from "./scroll";
import { probeFrameRate, usePerf } from "./perf";
import Navbar from "./Navbar";
import GaleTopography from "./GaleTopography";
import GaleSurroundings from "./GaleSurroundings";
import AresProject from "./AresProject";
import { GALE, MOUNT_SHARP } from "./mars";
import {
  BOXWORK_TIMELINE, DOSE, ELEMENTS, EZ_VOTES, GALE_FACTS, GALE_TIMELINE, GALLERY, METHANE, MOUNT_SHARP_KM,
  RADIATION_BARS, REMS_FIELDS, ROUTE_STOPS, SOIL_WATER, STRATA, TRAVERSE,
} from "./data";
import { BarChart, ChartFrame, ElementsChart, Kpis, MethaneChart, RangeMeter, StrataChart, Timeline } from "./charts";
import { useBi, useLocale, useT, type Bi } from "./i18n";
import "./landing.css";
import "./intro.css";
import "./charts.css";

/* ---------- Contenido (edita aquí) ---------- */
const PROJECT = "Aresmap";
const TEAM: Bi = { en: "Team Salomonsters", es: "Equipo Salomonsters" };
const REPO_URL = "#";
const DEMO_URL = "#";

const fmtLat = (v: number) => `${Math.abs(v)}°${v < 0 ? "S" : "N"}`;
const NAV_LINKS: { id: string; label: Bi }[] = [
  { id: "zona", label: { en: "The zone", es: "La zona" } },
  { id: "gale", label: { en: "Gale", es: "Gale" } },
  { id: "topografia", label: { en: "Relief", es: "Relieve" } },
  { id: "alrededores", label: { en: "Surroundings", es: "Alrededores" } },
  { id: "proyecto", label: { en: "Project", es: "Proyecto" } },
  { id: "capas", label: { en: "Data", es: "Datos" } },
];
const GALE_COORDS = `${fmtLat(GALE.lat)} · ${GALE.lon}°E`;

/* Capas de datos: el texto es bilingüe y cada gráfico se arma en el idioma actual */
interface LayerDef { name: Bi; title: Bi; text: Bi; sources: string; chart: ReactNode }
function useLayers(): LayerDef[] {
  const t = useT();
  const locale = useLocale();
  const n = (v: number, d = 0) => v.toLocaleString(locale, { maximumFractionDigits: d });
  return [
    {
      name: { en: "Geology", es: "Geología" }, title: { en: "An ancient habitable lake", es: "Un lago antiguo habitable" },
      text: {
        en: "At Yellowknife Bay, Curiosity found rocks from a lake with neutral pH and little salt, able to support chemolithoautotrophic microbes. It lasted at least hundreds to tens of thousands of years; each lake in the delta and river system could fill the basins for up to ~10,000 years.",
        es: "En Yellowknife Bay, Curiosity encontró rocas de un lago con pH neutro y poca sal, capaz de sostener microbios quimiolitoautótrofos. Duró, como mínimo, de cientos a decenas de miles de años; cada lago del sistema de deltas y ríos pudo llenar las depresiones hasta ~10 000 años.",
      },
      sources: "F1, F2", chart: <ElementsChart items={ELEMENTS} />,
    },
    {
      name: { en: "Topography", es: "Topografía" }, title: { en: "Mount Sharp: climbing is traveling back in time", es: "Mount Sharp: subir es viajar en el tiempo" },
      text: {
        en: "Mount Sharp is about 5 km tall. Climbing it, Curiosity went from clay-rich layers to sulfate layers, a salty mineral that forms when water dries up: the climate was getting drier. The map’s base is the 1 m-per-pixel DEM.",
        es: "Mount Sharp mide ~5 km. Al subir, Curiosity pasó de capas ricas en arcillas a capas con sulfatos, un mineral salado que se forma cuando el agua se seca: el clima se volvía más seco. La base del mapa es el DEM de 1 m por píxel.",
      },
      sources: "F3, F4, F15", chart: <StrataChart strata={STRATA} km={MOUNT_SHARP_KM} />,
    },
    {
      name: { en: "Target", es: "Objetivo" }, title: { en: "Boxwork: the target set by the challenge", es: "Boxwork: el objetivo que pone el reto" },
      text: {
        en: "Low ridges that form when groundwater leaves minerals in the rock’s cracks and cements them. They cover kilometers of one Mount Sharp layer and have not been seen anywhere else on the mountain. The challenge brief uses them as an example of a scientific target.",
        es: "Crestas bajas que se forman cuando el agua subterránea deja minerales en las grietas de la roca y los cementa. Cubren kilómetros de una capa de Mount Sharp y no se han visto en ninguna otra parte de la montaña. El enunciado del reto los usa como ejemplo de objetivo científico.",
      },
      sources: "F4, F5, F6", chart: <Timeline items={BOXWORK_TIMELINE} />,
    },
    {
      name: { en: "Sampling", es: "Muestreo" }, title: { en: "Organics and methane", es: "Orgánicos y metano" },
      text: {
        en: "SAM detected organic matter preserved in ~3-billion-year-old mudstones. The background methane rises and falls with the seasons and has isolated spikes. Neither finding proves life: they are sampling points for the route.",
        es: "SAM detectó materia orgánica conservada en lodolitas de ~3000 millones de años. El metano de fondo sube y baja con las estaciones y tiene picos aislados. Ninguno de los dos hallazgos prueba vida: son puntos de muestreo para la ruta.",
      },
      sources: "F7, F8, F9", chart: <MethaneChart m={METHANE} />,
    },
    {
      name: { en: "Radiation", es: "Radiación" }, title: { en: "Safety first", es: "Seguridad primero" },
      text: {
        en: `RAD measured ${n(DOSE.surface, 2)} mSv/day at the surface from August 2012 to June 2013: ${n(DOSE.cruise / DOSE.surface, 1)} times less than during the trip. The dose drops when pressure rises, and next to ridges and buttes the terrain blocks up to 19%. Space-weather alerts come from DONKI.`,
        es: `RAD midió en la superficie ${n(DOSE.surface, 2)} mSv/día de agosto 2012 a junio 2013: ${n(DOSE.cruise / DOSE.surface, 1)} veces menos que durante el viaje. La dosis baja cuando sube la presión, y junto a lomas y buttes el relieve bloquea hasta un 19 %. Las alertas de clima espacial llegan de DONKI.`,
      },
      sources: "F10, F11, F23, F33, F34",
      chart: <BarChart rows={RADIATION_BARS} unit={t("mSv/día", "mSv/day")} caption={t("Dosis equivalente media (mSv/día)", "Mean equivalent dose (mSv/day)")} />,
    },
    {
      name: { en: "Climate", es: "Clima" }, title: { en: "14 years of data collected on the ground", es: "14 años de datos tomados en el terreno" },
      text: {
        en: "The public REMS JSON gives, per sol, air and ground temperature, pressure, opacity and UV index. It is a public-outreach file: the scientific data is in the PDS. The Curiosity position log adds elevation and tilt along the route.",
        es: "El JSON público de REMS da, por sol, temperatura del aire y del suelo, presión, opacidad e índice UV. Es un archivo de divulgación: los datos científicos están en el PDS. El registro de posiciones de Curiosity añade elevación e inclinación a lo largo de la ruta.",
      },
      sources: "F13, F14, F25",
      chart: (
        <>
          <Kpis items={[
            { value: String(TRAVERSE.years), label: t("años de datos", "years of data") },
            { value: n(TRAVERSE.points), label: t("posiciones registradas", "logged positions") },
            { value: n(TRAVERSE.sol), label: t("último sol del registro", "last sol in the log") },
            { value: `${n(TRAVERSE.km, 1)} km`, label: t("recorridos", "traveled") },
          ]} />
          <ul className="fields">{REMS_FIELDS.map(([k, v]) => <li key={k}><code>{k}</code><span>{t(v.es, v.en)}</span></li>)}</ul>
        </>
      ),
    },
    {
      name: { en: "Human terrain", es: "Terreno humano" }, title: { en: "Candidate for human exploration", es: "Candidato a exploración humana" },
      text: {
        en: "At the 2015 NASA workshop on landing sites and Exploration Zones, Gale had three proposals: #1020, #1022 and #1040. #1020 was the third most voted. #1022 points to water accessible in the soil. USGS publishes the 1 m DEM and a 25 cm orthophoto to plan slopes and the safe route.",
        es: "En el taller de NASA sobre sitios de aterrizaje y Zonas de Exploración (2015), Gale tuvo tres propuestas: #1020, #1022 y #1040. La #1020 fue la tercera más votada. La #1022 señala agua accesible en el suelo. USGS publica el DEM de 1 m y una ortofoto de 25 cm para trazar pendientes y la ruta segura.",
      },
      sources: "F15, F16, F17, F18, F19",
      chart: (
        <>
          <BarChart rows={EZ_VOTES} unit={t("votos", "votes")} digits={0} caption={t("Votos por Zona de Exploración, taller NASA 2015", "Votes per Exploration Zone, NASA workshop 2015")} />
          <RangeMeter min={SOIL_WATER.min} max={SOIL_WATER.max} scale={5} unit="%" label={t("Agua en el suelo", "Water in the soil")} />
        </>
      ),
    },
  ];
}

/* ---------- Campo de estrellas (capa más lejana del parallax) ---------- */
/* Tres capas de estrellas (lejos → cerca). Cada una se dibuja UNA vez en un canvas del doble
   de alto (el cielo repetido) y al hacer scroll solo se desplaza con transform: lo mueve la GPU
   sin redibujar. El parpadeo es una animación CSS de opacidad por capa. */
const STAR_LAYERS = [
  { speed: 0.03, density: 1 / 9000, rMin: 0.25, rMax: 0.7, alpha: 0.55 },
  { speed: 0.08, density: 1 / 16000, rMin: 0.5, rMax: 1.1, alpha: 0.75 },
  { speed: 0.15, density: 1 / 40000, rMin: 0.9, rMax: 1.8, alpha: 0.95 },
];
function Starfield({ active }: { active: boolean }) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let raf = 0, H = 0;
    const paint = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const W = innerWidth; H = innerHeight;
      STAR_LAYERS.forEach((L, i) => {
        const c = refs.current[i]; if (!c) return;
        c.width = Math.round(W * dpr); c.height = Math.round(H * 2 * dpr);
        const ctx = c.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = `rgba(245,242,236,${L.alpha})`;
        ctx.beginPath();
        const n = Math.round(W * H * L.density);
        for (let k = 0; k < n; k++) {
          const x = Math.random() * W, y = Math.random() * H;
          const r = L.rMin + Math.random() ** 2 * (L.rMax - L.rMin);
          for (const yy of [y, y + H]) { ctx.moveTo(x + r, yy); ctx.arc(x, yy, r, 0, 6.2832); }   // repetido para el bucle
        }
        ctx.fill();
      });
      move();
    };
    const move = () => {
      raf = 0;
      STAR_LAYERS.forEach((L, i) => {
        const c = refs.current[i];
        if (c) c.style.transform = `translate3d(0, ${(-((scrollTop() * L.speed) % H)).toFixed(1)}px, 0)`;
      });
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(move); };
    paint();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", paint);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", queue); removeEventListener("resize", paint); };
  }, []);
  return (
    <div className="stars" data-on={active} aria-hidden="true">
      {STAR_LAYERS.map((_, i) => <canvas key={i} ref={(el) => { refs.current[i] = el; }} />)}
    </div>
  );
}

/* ---------- Parallax por scroll ----------
   Cada elemento con data-speed se desplaza según su distancia al centro
   de la pantalla: positivo = más lento que el scroll, negativo = más rápido. */
function useScrollParallax(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-speed]"));
    const items = els.map((el) => ({ el, speed: Number(el.dataset.speed), clamp: Number(el.dataset.clamp) || 0, top: 0, h: 0, applied: 0 }));
    let raf = 0;
    // Mide una sola vez la posición de cada elemento en el documento (sin su desplazamiento actual)
    const measure = () => {
      for (const it of items) {
        const r = it.el.getBoundingClientRect();
        it.top = r.top + scrollY - it.applied; it.h = r.height;
      }
      update();
    };
    // En cada scroll solo se usa la posición ya leída: no hay lecturas de layout, solo escrituras
    const update = () => {
      raf = 0;
      const vh = viewportHeight(), mid = vh / 2, y = scrollTop();
      for (const it of items) {
        const top = it.top - y;
        if (top > vh * 1.5 || top + it.h < -vh * 0.5) continue;    // lejos de pantalla: no se toca
        let offset = (top + it.h / 2 - mid) * -it.speed;
        if (it.clamp) offset = Math.max(-it.h * it.clamp, Math.min(it.h * it.clamp, offset));
        if (Math.abs(it.applied - offset) < 0.1) continue;
        it.applied = offset;
        it.el.style.translate = `0 ${offset.toFixed(1)}px`;
      }
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    measure();
    const ro = new ResizeObserver(() => measure());             // imágenes que cargan, cambios de ancho
    ro.observe(document.body);
    addEventListener("scroll", queue, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener("scroll", queue);
      els.forEach((el) => (el.style.translate = ""));
    };
  }, [enabled]);
}

/* ---------- Revelado de tarjetas al entrar en pantalla ----------
   Un IntersectionObserver marca cada tarjeta una sola vez; después no cuesta nada durante el scroll.
   Las que ya están en pantalla al activarse no se ocultan. */
function useReveal(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".card, .fact, .section-head")).filter((el) => !el.closest(".hero, .zone"));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.dataset.reveal = "in";
        io.unobserve(el);
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    const vh = viewportHeight();
    for (const el of els) {
      if (el.getBoundingClientRect().top < vh) continue;
      el.dataset.reveal = "pending";
      io.observe(el);
    }
    return () => {
      io.disconnect();
      els.forEach((el) => delete el.dataset.reveal);
    };
  }, [enabled]);
}

/* ---------- Mapa esquemático de la ruta segura en Gale ----------
   Mismas posiciones que la ruta dibujada en el planeta (unidades del radio del cráter). */
const MAP = { x0: -0.75, y0: 0.95, k: 240 };
const toMap = ([x, y]: [number, number]) => [(x - MAP.x0) * MAP.k, (MAP.y0 - y) * MAP.k] as const;
function RouteMap() {
  const t = useT();
  const pts = ROUTE_STOPS.map((st) => toMap(st.pos));
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [cx, cy] = toMap([0, 0]);
  const [mx, my] = toMap([MOUNT_SHARP.x, MOUNT_SHARP.y]);
  return (
    <svg className="route-map" viewBox="0 0 312 276" role="img" aria-label={t("Esquema del noroeste de Gale con la ruta desde Bradbury Landing hasta los boxwork de Mount Sharp", "Northwest Gale schematic with the route from Bradbury Landing to the Mount Sharp boxwork")}>
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
  const t = useT();
  const bi = useBi();
  return (
    <figure className={`card shot shot-${variant}`}>
      <div className="shot-media">
        <img src={g.src} width={g.w} height={g.h} alt={`${bi(g.title)}. ${bi(g.text)}`} loading="lazy" decoding="async" data-speed="0.05" data-clamp="0.06" />
      </div>
      <figcaption>
        <span className="card-label">{bi(g.date)} · {g.id}</span>
        <b>{bi(g.title)}</b>
        <span>{bi(g.text)}</span>
        <small>{t("Imagen", "Image")}: {g.credit}</small>
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
  const t = useT();
  const bi = useBi();
  const locale = useLocale();
  const n = (v: number, d = 0) => v.toLocaleString(locale, { maximumFractionDigits: d });
  const LAYERS = useLayers();
  const [active, setActive] = useState(0);
  const layer = LAYERS[active];
  const reduced = useReducedMotion();
  const [introDone, setIntroDone] = useState(false);
  const [revealedByIntro, setRevealed] = useState(false);
  const intro = !reduced && !introDone;                 // con movimiento reducido no hay intro
  const revealed = reduced || revealedByIntro;
  const reveal = useCallback(() => setRevealed(true), []);
  const finish = useCallback(() => setIntroDone(true), []);
  const { lite } = usePerf();
  // Modo rendimiento: sin paralaje ni animaciones de entrada (son las que más trabajo piden al hacer scroll)
  useScrollParallax(revealed && !reduced && !lite);
  useReveal(revealed && !reduced && !lite);
  // Tras la intro se mide si el equipo sostiene la animación; si no, se activa el modo rendimiento
  useEffect(() => { if (revealed) probeFrameRate(); }, [revealed]);

  const zoneFacts = [
    { value: `~${MOUNT_SHARP_KM} km`, label: t("de capas en Mount Sharp que registran el clima", "of layers in Mount Sharp that record the climate") },
    { value: `${SOIL_WATER.min}–${SOIL_WATER.max} %`, label: t("de agua accesible en el suelo (#1022)", "of water accessible in the soil (#1022)") },
    { value: `${n(DOSE.surface, 2)} mSv/${t("día", "day")}`, label: t("de radiación medida en la superficie", "of radiation measured at the surface") },
    { value: t("3.ª zona", "3rd zone"), label: t("más votada para exploración humana (2015)", "most voted for human exploration (2015)") },
  ];
  const galeFacts = GALE_FACTS.map((f) => ({ value: bi(f.value), label: bi(f.label) }));
  const stops = ROUTE_STOPS.map((s) => ({ ...s, nameText: typeof s.name === "string" ? s.name : bi(s.name) }));
  const stepsText = [
    { t: t("Acercamiento", "Approach"), d: `${t("Gale y Mount Sharp", "Gale and Mount Sharp")}, ${GALE_COORDS}` },
    { t: t("Inicio", "Start"), d: `${stops[0].nameText}: ${bi(stops[0].what).toLowerCase()}` },
    { t: t("Destino", "Goal"), d: `${stops[stops.length - 1].nameText} ${t("en la ladera de Mount Sharp", "on the Mount Sharp slope")}` },
    { t: t("Ruta óptima", "Optimal route"), d: `${stops.length} ${t("paradas sobre terreno ya recorrido por Curiosity", "stops over terrain Curiosity has already crossed")}` },
  ];

  return (
    <>
      <Starfield active={revealed} />
      <Planet active={revealed} focusId="zona" exitId="gale" />
      <div className="grain" aria-hidden="true" />
      {intro && <Intro onReveal={reveal} onDone={finish} />}

      <div className="site" data-state={revealed ? "in" : "intro"}>
        <a className="skip" href="#zona">{t("Saltar al contenido", "Skip to content")}</a>

        <Navbar project={PROJECT} links={NAV_LINKS} ctaHref={DEMO_URL} />

        <main id="top">
          {/* HERO: el planeta gira a la derecha (capa fija), el texto flota encima */}
          <section className="wrap hero">
            <div className="hero-copy" data-speed="0.07">
              <p className="kicker"><span className="dot" aria-hidden="true" />NASA Space Apps Challenge</p>
              <h1>{PROJECT}<span>{t("El mapa para el primer paso en Marte.", "The map for the first step on Mars.")}</span></h1>
              <p className="lead">
                {t(
                  `${LAYERS.length} capas de datos de Curiosity, MRO y la NASA en una sola vista para llevar a los primeros astronautas del cráter Gale hasta los boxwork de Mount Sharp.`,
                  `${LAYERS.length} data layers from Curiosity, MRO and NASA in a single view to take the first astronauts from Gale crater to the boxwork on Mount Sharp.`,
                )}
              </p>
              <div className="actions">
                <a className="btn btn-primary" href="#zona">{t("Ver la zona", "See the zone")} <span aria-hidden="true">→</span></a>
                <a className="btn btn-glass" href="#expedicion">{t("La expedición", "The expedition")}</a>
              </div>
            </div>
            <div className="hero-hud" aria-hidden="true">
              <div className="hud-card" data-speed="-0.12" data-anchor="gale">
                <span className="hud-icon">◎</span>
                <span><b>{t("Cráter Gale", "Gale Crater")}</b><small>{GALE_COORDS}</small></span>
              </div>
              <div className="hud-card" data-speed="-0.22">
                <span className="hud-icon">≡</span>
                <span><b>{LAYERS.length} {t("capas integradas", "layers integrated")}</b><small>{n(TRAVERSE.km, 1)} km {t("de terreno probado", "of proven terrain")}</small></span>
              </div>
            </div>
            <a className="scroll-cue" href="#zona" aria-label={t("Bajar a la zona", "Go down to the zone")}><span /></a>
          </section>

          {/* ZONA (alta y fijada): zoom al cráter → inicio → destino → ruta óptima simulada */}
          <section id="zona" className="zone" data-step="0">
            <div className="wrap zone-pin">
              <div className="crater-copy">
                <p className="kicker"><span className="dot" aria-hidden="true" />{t("Zona habitable para astronautas", "Habitable zone for astronauts")}</p>
                <h2>Gale, <span>{t("un lago que se volvió montaña.", "a lake that became a mountain.")}</span></h2>
                <p className="lead">
                  {t(
                    `Un lago antiguo con agua de pH neutro, una montaña de ~${MOUNT_SHARP_KM} km de capas y el terreno de Marte mejor medido desde el suelo. Fue candidato de la NASA para la exploración humana y es nuestro destino.`,
                    `An ancient lake with neutral-pH water, a ~${MOUNT_SHARP_KM} km mountain of layers, and the best-measured ground on Mars. It was a NASA candidate for human exploration and it is our destination.`,
                  )}
                </p>
                <ol className="card zone-steps" aria-label={t("Simulación de la ruta", "Route simulation")}>
                  {stepsText.map((s, i) => (
                    <li key={i} data-i={i}><span className="step-n">0{i + 1}</span><span><b>{s.t}</b><small>{s.d}</small></span></li>
                  ))}
                </ol>
                <p className="planet-note">{t("Cráter exagerado ~4× y ruta esquemática para que se lean a esta escala.", "Crater exaggerated ~4× and route schematic so they read at this scale.")}</p>
              </div>
            </div>
          </section>

          {/* GALE EN DATOS: imágenes de la NASA intercaladas con cifras y fechas */}
          <section id="gale" className="wrap gale">
            <header className="section-head">
              <p className="kicker"><span className="dot" aria-hidden="true" />{t("Gale en datos", "Gale in data")}</p>
              <h2>{t("Un cráter ", "A crater ")}<span>{t("con historia.", "with history.")}</span></h2>
            </header>

            <div className="gale-bento">
              <Shot g={img("PIA16032")} variant="feature" />
              <div className="card zone-figures">
                <p className="card-label">{t("La zona en cifras", "The zone in numbers")}</p>
                <dl className="facts">
                  {zoneFacts.map((f) => <div key={f.label} className="fact"><dt>{f.value}</dt><dd>{f.label}</dd></div>)}
                </dl>
              </div>

              <Shot g={img("PIA26552")} variant="strip" />

              <Shot g={img("PIA16099")} variant="small" />
              <Shot g={img("PIA26632")} variant="small" />
              <Shot g={img("PIA26306")} variant="small" />

              <dl className="facts curious">
                {galeFacts.map((f) => <div key={f.label} className="fact"><dt>{f.value}</dt><dd>{f.label}</dd></div>)}
              </dl>

              <Shot g={img("PIA26560")} variant="half" />
              <Shot g={img("PIA26551")} variant="half" />
            </div>

            <div className="card gale-dates">
              <p className="card-label">{t("Gale en fechas", "Gale in dates")}</p>
              <ol className="htimeline" tabIndex={0} aria-label={t("Línea de tiempo de Gale", "Gale timeline")}>
                {GALE_TIMELINE.map((x) => <li key={x.date.en}><time>{bi(x.date)}</time><span>{bi(x.label)}</span></li>)}
              </ol>
            </div>
          </section>

          <GaleTopography />

          <GaleSurroundings />

          <AresProject />

          {/* EXPEDICIÓN: la ruta segura hasta los boxwork */}
          <section id="expedicion" className="wrap expedition">
            <header className="section-head">
              <p className="kicker"><span className="dot" aria-hidden="true" />{t("La expedición", "The expedition")}</p>
              <h2>{t("Del lago ", "From the lake ")}<span>{t("a los boxwork.", "to the boxwork.")}</span></h2>
            </header>
            <div className="bento">
              <article className="card card-feature" data-speed="0.04">
                <p className="card-label">{t("Ruta segura · esquema de Gale", "Safe route · Gale schematic")}</p>
                <RouteMap />
                <div className="stats">
                  <div><b>{n(TRAVERSE.km, 1)} km</b><span>{t("ya recorridos por Curiosity", "already traveled by Curiosity")}</span></div>
                  <div><b>{ROUTE_STOPS.length}</b><span>{t("paradas científicas", "science stops")}</span></div>
                  <div><b>~{MOUNT_SHARP_KM} km</b><span>{t("de montaña por delante", "of mountain ahead")}</span></div>
                </div>
              </article>
              <article className="card stops" data-speed="-0.04">
                <p className="card-label">{t("Paradas, de abajo hacia arriba", "Stops, from bottom to top")}</p>
                <ol>
                  {stops.map((s, i) => (
                    <li key={s.nameText} data-goal={i === stops.length - 1}>
                      <span className="step-n">0{i + 1}</span>
                      <span><b>{s.nameText}</b><small>{bi(s.what)}</small></span>
                      <em>{bi(s.layer)}</em>
                    </li>
                  ))}
                </ol>
              </article>
              <article className="card why" data-speed="0.03">
                <p className="card-label">{t("Por qué es la ruta óptima hoy", "Why this is the optimal route today")}</p>
                <p>
                  {t(
                    "Cada tramo ya lo recorrió un rover, así que el terreno es transitable sin suposiciones. El siguiente paso es optimizarla sobre el DEM de 1 m con dos costos: la pendiente y la radiación, buscando el resguardo de lomas y buttes, donde la dosis baja hasta un 19 %.",
                    "A rover has already driven every section, so the ground is passable without guesswork. The next step is to optimize it on the 1 m DEM with two costs: slope and radiation, seeking shelter behind ridges and buttes, where the dose drops up to 19%.",
                  )}
                </p>
              </article>
            </div>
          </section>

          {/* CAPAS DE DATOS: cada pestaña con su gráfico */}
          <section id="capas" className="wrap layers">
            <div>
              <header className="section-head">
                <p className="kicker"><span className="dot" aria-hidden="true" />{t("Capas de datos", "Data layers")}</p>
                <h2>{t("Cada capa responde ", "Each layer answers ")}<span>{t("una pregunta distinta.", "a different question.")}</span></h2>
              </header>
              <div className="segmented" role="tablist" aria-label={t("Capas de datos", "Data layers")}>
                {LAYERS.map((l, i) => (
                  <button key={l.name.en} id={`tab-${i}`} role="tab" aria-selected={i === active} aria-controls="layer-panel" onClick={() => setActive(i)}>
                    {bi(l.name)}
                  </button>
                ))}
              </div>
              <div className="layer-text">
                <h3>{bi(layer.title)}</h3>
                <p>{bi(layer.text)}</p>
              </div>
            </div>
            <div className="card layer-panel" id="layer-panel" role="tabpanel" aria-labelledby={`tab-${active}`} key={layer.name.en}>
              <ChartFrame title={bi(layer.title)} sources={layer.sources}>{layer.chart}</ChartFrame>
            </div>
          </section>

          <section className="wrap close">
            <div className="card close-card">
              <h2 data-speed="0.05">{t("Marte ya está mapeado. ", "Mars is already mapped. ")}<span>{t("Falta hacerlo caminable.", "Now it needs to be walkable.")}</span></h2>
              <div className="actions">
                <a className="btn btn-primary" href={DEMO_URL}>{t("Ver la solución", "See the solution")} <span aria-hidden="true">→</span></a>
                <a className="btn btn-glass" href={REPO_URL}>{t("Código en GitHub", "Code on GitHub")}</a>
              </div>
            </div>
          </section>
        </main>

        <footer className="wrap footer">
          <span>{PROJECT} · {bi(TEAM)} · NASA Space Apps Challenge</span>
          <span>{t("Datos: NASA/JPL-Caltech, MSL Curiosity (RAD, REMS, SAM), USGS, DONKI · Planeta generado por procedimiento", "Data: NASA/JPL-Caltech, MSL Curiosity (RAD, REMS, SAM), USGS, DONKI · Planet generated procedurally")}</span>
        </footer>
      </div>
    </>
  );
}
