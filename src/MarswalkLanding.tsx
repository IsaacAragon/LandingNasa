import { useEffect, useRef, useState } from "react";
import {
  Viewer, Globe, Ellipsoid, Cartesian3, Color, ImageryLayer,
  UrlTemplateImageryProvider, GeographicTilingScheme, Math as CMath,
} from "cesium";
import "./landing.css";

/* ---------- Contenido (edita aquí) ---------- */
const PROJECT = "Marswalk Atlas";
const TEAM = "Tu equipo";
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

const STEPS = [
  { t: "Planear", d: "Elegir destino y trazar rutas candidatas sobre el relieve." },
  { t: "Evaluar", d: "Cruzar pendiente, terreno, radiación y clima en cada tramo." },
  { t: "Salir", d: "Seguir la ruta con las condiciones actualizadas y una vía de retorno." },
  { t: "Descubrir", d: "Registrar hallazgos nuevos y devolverlos al mapa." },
];

// Jezero: sitio de referencia para la demostración
const JEZERO = { lon: 77.45, lat: 18.44 };
const ROUTE = [77.42, 18.4, 77.46, 18.42, 77.5, 18.45, 77.53, 18.5];

/* ---------- Campo de estrellas ---------- */
function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let stars: { x: number; y: number; r: number; p: number; s: number; warm: boolean }[] = [];
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round((innerWidth * innerHeight) / 4500) }, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: Math.random() ** 3 * 1.6 + 0.2, p: Math.random() * 6.28,
        s: Math.random() * 0.8 + 0.2, warm: Math.random() > 0.8,
      }));
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const s of stars) {
        const a = still ? 0.7 : 0.35 + 0.65 * Math.abs(Math.sin(t / 1400 * s.s + s.p));
        ctx.fillStyle = s.warm ? `rgba(234,184,135,${a})` : `rgba(236,229,216,${a})`;
        ctx.beginPath(); ctx.arc(s.x, s.y - (scrollY * s.r) / 12 % innerHeight, s.r, 0, 6.28); ctx.fill();
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    resize(); draw(0);
    addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="stars" aria-hidden="true" />;
}

/* ---------- Globo de Marte (CesiumJS) ---------- */
function MarsGlobe() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewer = new Viewer(host.current!, {
      globe: new Globe(Ellipsoid.MARS),          // elipsoide marciano
      baseLayer: false,                          // sin Cesium ion
      baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false,
      navigationHelpButton: false, animation: false, timeline: false, fullscreenButton: false,
      infoBox: false, selectionIndicator: false,
      skyBox: false, skyAtmosphere: false as unknown as undefined,
      contextOptions: { webgl: { alpha: true } },
    });
    const { scene } = viewer;
    scene.backgroundColor = Color.TRANSPARENT;   // deja ver las estrellas
    scene.globe.baseColor = Color.fromCssColorString("#8c3a1e");
    scene.globe.showGroundAtmosphere = false;
    scene.screenSpaceCameraController.enableZoom = false;

    // Mosaico global Viking MDIM 2.1 (NASA Trek). Verifica la URL vigente en trek.nasa.gov.
    const provider = new UrlTemplateImageryProvider({
      url: "https://trek.nasa.gov/tiles/Mars/EQ/Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
      tilingScheme: new GeographicTilingScheme({ ellipsoid: Ellipsoid.MARS }),
      ellipsoid: Ellipsoid.MARS,
      maximumLevel: 7,
      credit: "NASA/JPL/USGS Viking MDIM 2.1",
    });
    scene.imageryLayers.add(new ImageryLayer(provider));

    // Ruta de ejemplo en Jezero
    viewer.entities.add({
      polyline: { positions: Cartesian3.fromDegreesArray(ROUTE, Ellipsoid.MARS), width: 3, material: Color.fromCssColorString("#9ad9e8"), clampToGround: false },
    });
    viewer.entities.add({
      position: Cartesian3.fromDegrees(JEZERO.lon, JEZERO.lat, 0, Ellipsoid.MARS),
      point: { pixelSize: 9, color: Color.fromCssColorString("#d2542a"), outlineColor: Color.WHITE, outlineWidth: 1 },
    });

    viewer.camera.setView({ destination: Cartesian3.fromDegrees(JEZERO.lon - 40, 10, 14_000_000, Ellipsoid.MARS) });
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spin = () => { if (!still) viewer.camera.rotate(Cartesian3.UNIT_Z, -0.0008); };
    scene.postRender.addEventListener(spin);

    return () => { scene.postRender.removeEventListener(spin); viewer.destroy(); };
  }, []);
  return <div ref={host} className="globe" role="img" aria-label="Globo interactivo de Marte con una ruta de ejemplo en el cráter Jezero" />;
}

/* ---------- Página ---------- */
export default function MarswalkLanding() {
  const [active, setActive] = useState(0);
  const layer = LAYERS[active];

  return (
    <>
      <Starfield />
      <header className="wrap nav">
        <a href="#top" className="brand">{PROJECT}</a>
        <nav aria-label="Principal">
          <ul>
            <li><a href="#reto">El reto</a></li>
            <li><a href="#capas">Capas de datos</a></li>
            <li><a href="#ruta">La misión</a></li>
          </ul>
        </nav>
      </header>

      <main id="top">
        <div className="wrap hero">
          <div>
            <h1>El mapa <span>para el primer paso en Marte.</span></h1>
            <p className="lead">Seis misiones de la NASA, una sola vista para planear y recorrer un Marswalk.</p>
            <div className="actions">
              <a className="cta" href={DEMO_URL}>Explorar la solución →</a>
              <a className="ghost" href="#reto">Conocer el reto</a>
            </div>
          </div>
          <div className="globe-frame">
            <MarsGlobe />
            <div className="readout" aria-hidden="true">
              Sitio de referencia <b>Jezero</b><br />
              {JEZERO.lat}°N · {JEZERO.lon}°E<br />
              Capas integradas <b>{LAYERS.length}</b>
            </div>
          </div>
        </div>

        <section id="reto" className="wrap challenge">
          <div><p className="tag">NASA Space Apps Challenge</p></div>
          <div>
            <blockquote>
              Los primeros astronautas en Marte necesitarán <em>el mejor mapa posible</em>: rutas, destinos y condiciones actuales en un solo lugar.
            </blockquote>
            <p className="src">Reto: una vista en capas, integrada, de un lugar o ruta en la superficie marciana con datos de varias misiones.</p>
          </div>
        </section>

        <section id="capas" className="wrap layers">
          <div>
            <h2>Cada misión responde una pregunta distinta.</h2>
            <ul role="tablist" aria-label="Capas de datos">
              {LAYERS.map((l, i) => (
                <li key={l.name} role="presentation">
                  <button role="tab" aria-selected={i === active} onClick={() => setActive(i)} onMouseEnter={() => setActive(i)}>
                    <span>{l.name}</span><span>{l.instrument}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="detail" role="tabpanel" aria-live="polite">
              <span className="src">{layer.mission}</span>
              <p>{layer.use}</p>
            </div>
          </div>
          <div className="stack" aria-hidden="true">
            {LAYERS.map((l, i) => (
              <div key={l.name} className="plane" data-on={i === active} style={{ ["--i" as string]: i }}>
                <span>{l.instrument}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="ruta" className="wrap flow">
          <p className="tag">De la órbita a la caminata</p>
          <h2 style={{ marginTop: "1rem", maxWidth: "20ch" }}>Una ruta, cuatro decisiones.</h2>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.t}><span className="n">{i + 1}</span><h3>{s.t}</h3><p>{s.d}</p></li>
            ))}
          </ol>
        </section>

        <section className="wrap close">
          <h2>Marte ya está mapeado. Falta hacerlo caminable.</h2>
          <a className="cta" href={DEMO_URL}>Ver la solución →</a>
          <a className="ghost" href={REPO_URL}>Código en GitHub</a>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <span>{TEAM} · NASA Space Apps Challenge</span>
          <span>Datos: NASA/JPL, USGS, NASA Trek</span>
        </div>
      </footer>
    </>
  );
}
