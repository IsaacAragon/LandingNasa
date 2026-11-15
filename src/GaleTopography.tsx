import mapSrc from "./assets/topo/gale-topo-map.webp";
import profileAA from "./assets/topo/gale-profile-aa.webp";
import profileRover from "./assets/topo/gale-profile-rover.webp";
import profileEva from "./assets/topo/gale-profile-eva.webp";
import "./topography.css";

/* ==========================================================================
   Plano topográfico de Gale (captura del PDF "Gale_topografia-Layout1",
   Autodesk Civil 3D). Las líneas se pasaron a platino sobre transparente
   para el fondo oscuro; el contenido es el del plano original.
   ========================================================================== */

/* Posición de Bradbury Landing dentro del recorte del mapa (0–1 desde la esquina superior izquierda) */
const BRADBURY = { x: 0.364, y: 0.26 };

const PROFILES = [
  {
    id: "aa", src: profileAA, w: 1396, h: 555,
    title: "Perfil A–A′ · Aeolis Mons",
    meta: ["NO a SE", "DTM 200 m", "Exageración vertical 10×"],
    alt: "Perfil de elevación A–A′ de noroeste a sureste a través de Gale: el piso baja a unos −4.500 m y Aeolis Mons sube cerca de +800 m, en 175 km.",
  },
  {
    id: "rover", src: profileRover, w: 1396, h: 240,
    title: "Perfil rover · R0–R1",
    meta: ["935,7 m", "Geolocalización MSL", "Máx. 6,2° en 10 m"],
    alt: "Perfil de la ruta del rover R0–R1: 935,7 m con un descenso suave de unos −4.502 m a −4.521 m y pendiente máxima de 6,2° en 10 m.",
  },
  {
    id: "eva", src: profileEva, w: 1396, h: 201,
    title: "Perfil EVA · E0–E1",
    meta: ["317 m ida", "634 m ida y vuelta", "Máx. 4,3° en 10 m"],
    alt: "Perfil de la caminata EVA E0–E1: 317 m de ida, desniveles de unos 4 m y pendiente máxima de 4,3° en 10 m.",
  },
];

const NOTES = [
  "EVA preliminar: verificar firmeza, rocas, escalones y capacidad de retorno en superficie.",
  "XYZ en metros, X este / Y norte. Origen: Bradbury Landing, 137,441633° E, −4,589467°.",
  "Equidistante local sobre esfera marciana de 3.396.190 m; paralelo de escala −4,589467°.",
  "Z respecto al areoide marciano. Perfiles desplazados al este para su lectura.",
  "Fuentes: USGS HRSC/MOLA v2, ESA Mars Express HRSC, NASA/JPL MSL, HiRISE/UArizona.",
];

export default function GaleTopography() {
  return (
    <section id="topografia" className="wrap topo">
      <header className="section-head">
        <p className="kicker"><span className="dot" aria-hidden="true" />Plano topográfico</p>
        <h2>Gale, <span>curva por curva.</span></h2>
        <p className="lead">
          Curvas regionales cada 250 m sobre el modelo HRSC/MOLA v2 de USGS (200 m), con tres perfiles: el cruce completo del
          cráter, la ruta del rover y la primera caminata.
        </p>
      </header>

      <div className="topo-grid">
        <figure className="card topo-map">
          <figcaption className="topo-title">
            <b>Cráter Gale / Marte</b>
            <span>Curvas cada 250 m · HRSC/MOLA v2, USGS, 200 m</span>
          </figcaption>
          <a className="topo-map-frame" href={mapSrc} target="_blank" rel="noopener" aria-label="Abrir el mapa topográfico en tamaño completo">
            <img src={mapSrc} width={1400} height={1358} loading="lazy" decoding="async"
              alt="Mapa de curvas de nivel del cráter Gale: el anillo del borde, la llanura Aeolis Palus al noroeste y el montículo central Aeolis Mons, con la línea de perfil A–A′ de noroeste a sureste." />
            <span className="topo-pin" style={{ left: `${BRADBURY.x * 100}%`, top: `${BRADBURY.y * 100}%` }}>
              <i aria-hidden="true" />
              <small>Bradbury Landing</small>
            </span>
            <span className="topo-zoom" aria-hidden="true">Ampliar ↗</span>
          </a>
        </figure>

        <div className="topo-side">
          {PROFILES.map((p) => (
            <figure key={p.id} className={`card topo-profile topo-${p.id}`}>
              <figcaption>
                <b>{p.title}</b>
                <span className="topo-meta">{p.meta.map((m) => <span key={m}>{m}</span>)}</span>
              </figcaption>
              <img src={p.src} width={p.w} height={p.h} alt={p.alt} loading="lazy" decoding="async" />
            </figure>
          ))}
          <div className="card topo-notes">
            <p className="card-label">Notas del plano</p>
            <ul>{NOTES.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
