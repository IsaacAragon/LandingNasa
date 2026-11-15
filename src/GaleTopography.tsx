import mapSrc from "./assets/topo/gale-topo-map.webp";
import profileAA from "./assets/topo/gale-profile-aa.webp";
import profileRover from "./assets/topo/gale-profile-rover.webp";
import profileEva from "./assets/topo/gale-profile-eva.webp";
import { useBi, useT, type Bi } from "./i18n";
import "./topography.css";

/* ==========================================================================
   Plano topográfico de Gale (captura del PDF "Gale_topografia-Layout1",
   Autodesk Civil 3D). Las líneas se pasaron a platino sobre transparente
   para el fondo oscuro; el contenido es el del plano original.
   ========================================================================== */

/* Posición de Bradbury Landing dentro del recorte del mapa (0–1 desde la esquina superior izquierda) */
const BRADBURY = { x: 0.364, y: 0.26 };

const PROFILES: { id: string; src: string; w: number; h: number; title: Bi; meta: Bi[]; alt: Bi }[] = [
  {
    id: "aa", src: profileAA, w: 1396, h: 555,
    title: { en: "Profile A–A′ · Aeolis Mons", es: "Perfil A–A′ · Aeolis Mons" },
    meta: [{ en: "NW to SE", es: "NO a SE" }, { en: "DTM 200 m", es: "DTM 200 m" }, { en: "10× vertical exaggeration", es: "Exageración vertical 10×" }],
    alt: {
      en: "Elevation profile A–A′ from northwest to southeast across Gale: the floor drops to about −4,500 m and Aeolis Mons rises near +800 m, over 175 km.",
      es: "Perfil de elevación A–A′ de noroeste a sureste a través de Gale: el piso baja a unos −4.500 m y Aeolis Mons sube cerca de +800 m, en 175 km.",
    },
  },
  {
    id: "rover", src: profileRover, w: 1396, h: 240,
    title: { en: "Rover profile · R0–R1", es: "Perfil rover · R0–R1" },
    meta: [{ en: "935.7 m", es: "935,7 m" }, { en: "MSL geolocation", es: "Geolocalización MSL" }, { en: "Max 6.2° over 10 m", es: "Máx. 6,2° en 10 m" }],
    alt: {
      en: "Rover route profile R0–R1: 935.7 m long, a gentle descent from about −4,502 m to −4,521 m, with a maximum slope of 6.2° over 10 m.",
      es: "Perfil de la ruta del rover R0–R1: 935,7 m con un descenso suave de unos −4.502 m a −4.521 m y pendiente máxima de 6,2° en 10 m.",
    },
  },
  {
    id: "eva", src: profileEva, w: 1396, h: 201,
    title: { en: "EVA profile · E0–E1", es: "Perfil EVA · E0–E1" },
    meta: [{ en: "317 m out", es: "317 m ida" }, { en: "634 m round trip", es: "634 m ida y vuelta" }, { en: "Max 4.3° over 10 m", es: "Máx. 4,3° en 10 m" }],
    alt: {
      en: "EVA walk profile E0–E1: 317 m out, height changes of about 4 m, and a maximum slope of 4.3° over 10 m.",
      es: "Perfil de la caminata EVA E0–E1: 317 m de ida, desniveles de unos 4 m y pendiente máxima de 4,3° en 10 m.",
    },
  },
];

const NOTES: Bi[] = [
  { en: "Preliminary EVA: check firmness, rocks, steps and the ability to return on the surface.", es: "EVA preliminar: verificar firmeza, rocas, escalones y capacidad de retorno en superficie." },
  { en: "XYZ in meters, X east / Y north. Origin: Bradbury Landing, 137.441633° E, −4.589467°.", es: "XYZ en metros, X este / Y norte. Origen: Bradbury Landing, 137,441633° E, −4,589467°." },
  { en: "Local equidistant projection on a Mars sphere of 3,396,190 m; scale parallel −4.589467°.", es: "Equidistante local sobre esfera marciana de 3.396.190 m; paralelo de escala −4,589467°." },
  { en: "Z relative to the Martian areoid. Profiles shifted east for easier reading.", es: "Z respecto al areoide marciano. Perfiles desplazados al este para su lectura." },
  { en: "Sources: USGS HRSC/MOLA v2, ESA Mars Express HRSC, NASA/JPL MSL, HiRISE/UArizona.", es: "Fuentes: USGS HRSC/MOLA v2, ESA Mars Express HRSC, NASA/JPL MSL, HiRISE/UArizona." },
];

export default function GaleTopography() {
  const t = useT();
  const bi = useBi();
  return (
    <section id="topografia" className="wrap topo">
      <header className="section-head">
        <p className="kicker"><span className="dot" aria-hidden="true" />{t("Plano topográfico", "Topographic map")}</p>
        <h2>{t("Gale, ", "Gale, ")}<span>{t("curva por curva.", "contour by contour.")}</span></h2>
        <p className="lead">
          {t(
            "Curvas regionales cada 250 m sobre el modelo HRSC/MOLA v2 de USGS (200 m), con tres perfiles: el cruce completo del cráter, la ruta del rover y la primera caminata.",
            "Regional contours every 250 m from the USGS HRSC/MOLA v2 model (200 m), with three profiles: a full crossing of the crater, the rover route and the first walk.",
          )}
        </p>
      </header>

      <div className="topo-grid">
        <figure className="card topo-map">
          <figcaption className="topo-title">
            <b>{t("Cráter Gale / Marte", "Gale Crater / Mars")}</b>
            <span>{t("Curvas cada 250 m · HRSC/MOLA v2, USGS, 200 m", "Contours every 250 m · HRSC/MOLA v2, USGS, 200 m")}</span>
          </figcaption>
          <a className="topo-map-frame" href={mapSrc} target="_blank" rel="noopener" aria-label={t("Abrir el mapa topográfico en tamaño completo", "Open the topographic map at full size")}>
            <img src={mapSrc} width={1400} height={1358} loading="lazy" decoding="async"
              alt={t(
                "Mapa de curvas de nivel del cráter Gale: el anillo del borde, la llanura Aeolis Palus al noroeste y el montículo central Aeolis Mons, con la línea de perfil A–A′ de noroeste a sureste.",
                "Contour map of Gale crater: the rim ring, the Aeolis Palus plain to the northwest and the central mound Aeolis Mons, with profile line A–A′ from northwest to southeast.",
              )} />
            <span className="topo-pin" style={{ left: `${BRADBURY.x * 100}%`, top: `${BRADBURY.y * 100}%` }}>
              <i aria-hidden="true" />
              <small>Bradbury Landing</small>
            </span>
            <span className="topo-zoom" aria-hidden="true">{t("Ampliar", "Enlarge")} ↗</span>
          </a>
        </figure>

        <div className="topo-side">
          {PROFILES.map((p) => (
            <figure key={p.id} className={`card topo-profile topo-${p.id}`}>
              <figcaption>
                <b>{bi(p.title)}</b>
                <span className="topo-meta">{p.meta.map((m) => <span key={m.en}>{bi(m)}</span>)}</span>
              </figcaption>
              <img src={p.src} width={p.w} height={p.h} alt={bi(p.alt)} loading="lazy" decoding="async" />
            </figure>
          ))}
          <div className="card topo-notes">
            <p className="card-label">{t("Notas del plano", "Map notes")}</p>
            <ul>{NOTES.map((n) => <li key={n.en}>{bi(n)}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
