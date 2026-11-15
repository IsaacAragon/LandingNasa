import { useState } from "react";
import mosaic from "./assets/gale/gale-alrededores.webp";
import centro from "./assets/gale/gale-centro.webp";
import norte from "./assets/gale/gale-norte-babati.webp";
import sur from "./assets/gale/gale-sur.webp";
import noroeste from "./assets/gale/gale-noroeste.webp";
import oeste from "./assets/gale/gale-oeste-robert-sharp.webp";
import { useBi, useT, type Bi } from "./i18n";
import "./surroundings.css";

/* ==========================================================================
   Gale y sus alrededores (documento del equipo "MARTE.docx").
   Mosaico de relieve con el norte arriba; cada marcador abre el modelo de esa área hecho en
   Autodesk Civil 3D. Posiciones en % del mosaico recortado (1510 × 680 px).
   ========================================================================== */

interface Area {
  id: string;
  name: Bi;
  place: Bi;
  text: Bi;
  src: string; w: number; h: number;
  pin: [number, number];                       // marcador (izquierda %, arriba %)
  box: [number, number, number, number];       // recuadro del área (izq, arriba, ancho, alto en %)
  alt: Bi;
}

const AREAS: Area[] = [
  {
    id: "centro", name: { en: "Gale", es: "Gale" }, place: { en: "Central area", es: "Área central" },
    text: {
      en: "Triangulated surface of Gale’s floor and Aeolis Mons, built in Civil 3D from the elevation model. It is the basis for the relief, slopes and route profiles.",
      es: "Superficie triangulada del piso de Gale y de Aeolis Mons, generada en Civil 3D a partir del modelo de elevación. Es la base del relieve, las pendientes y los perfiles de ruta.",
    },
    src: centro, w: 1272, h: 977, pin: [55.2, 54.7], box: [41.3, 22, 31.7, 72.4],
    alt: { en: "Civil 3D model of Gale’s central area: contours and isometric view.", es: "Modelo de Civil 3D del área central de Gale: curvas de nivel y vista isométrica." },
  },
  {
    id: "norte", name: { en: "Babati", es: "Babati" }, place: { en: "North", es: "Norte" },
    text: {
      en: "Babati crater and Gale’s northern rim, in contours and in two isometric views.",
      es: "Cráter Babati y el borde norte de Gale, en curvas de nivel y en dos vistas isométricas.",
    },
    src: norte, w: 1400, h: 907, pin: [58.8, 13.5], box: [54.7, 3.5, 8.4, 28.7],
    alt: { en: "Civil 3D model of Babati crater and Gale’s north rim: contours and two isometric views.", es: "Modelo de Civil 3D del cráter Babati y el borde norte de Gale: curvas de nivel y dos vistas isométricas." },
  },
  {
    id: "noroeste", name: { en: "Northwest strip", es: "Franja noroeste" }, place: { en: "Northwest", es: "Noroeste" },
    text: {
      en: "Terrain northwest of Gale, between Robert Sharp and Babati, in contours and isometric view.",
      es: "Relieve exterior al noroeste de Gale, entre Robert Sharp y Babati, en curvas de nivel y en vista isométrica.",
    },
    src: noroeste, w: 1400, h: 886, pin: [50.2, 13.5], box: [46.1, 3.5, 8.7, 26.2],
    alt: { en: "Civil 3D model of the northwest strip of Gale: contours and isometric view.", es: "Modelo de Civil 3D de la franja noroeste de Gale: curvas de nivel y vista isométrica." },
  },
  {
    id: "sur", name: { en: "Farah Vallis", es: "Farah Vallis" }, place: { en: "South", es: "Sur" },
    text: {
      en: "South sector of Aeolis Mons, Gale’s south rim and Farah Vallis, the valley that cuts through the crater rim.",
      es: "Sector sur de Aeolis Mons, el borde sur de Gale y Farah Vallis, el valle que corta el borde del cráter.",
    },
    src: sur, w: 1400, h: 927, pin: [57.5, 91.5], box: [43.5, 54.6, 28, 44.3],
    alt: { en: "Civil 3D model of the south sector of Gale and Farah Vallis: contours and isometric views.", es: "Modelo de Civil 3D del sector sur de Gale y Farah Vallis: curvas de nivel y vistas isométricas." },
  },
  {
    id: "oeste", name: { en: "Robert Sharp", es: "Robert Sharp" }, place: { en: "West", es: "Oeste" },
    text: {
      en: "Robert Sharp crater, west of Gale: a floor full of mounds, modeled in contours and in two isometric views.",
      es: "Cráter Robert Sharp, al oeste de Gale: un piso lleno de montículos, modelado en curvas de nivel y en dos vistas isométricas.",
    },
    src: oeste, w: 1400, h: 875, pin: [13.8, 23.8], box: [0.6, 1.2, 45.4, 61],
    alt: { en: "Civil 3D model of Robert Sharp crater: contours and two isometric views.", es: "Modelo de Civil 3D del cráter Robert Sharp: curvas de nivel y dos vistas isométricas." },
  },
];

export default function GaleSurroundings() {
  const t = useT();
  const bi = useBi();
  const [sel, setSel] = useState(AREAS[0].id);
  const area = AREAS.find((a) => a.id === sel)!;

  return (
    <section id="alrededores" className="wrap around">
      <header className="section-head">
        <p className="kicker"><span className="dot" aria-hidden="true" />{t("Gale y sus alrededores", "Gale and its surroundings")}</p>
        <h2>{t("Cinco áreas, ", "Five areas, ")}<span>{t("un mismo relieve.", "one same terrain.")}</span></h2>
        <p className="lead">
          {t(
            "Mosaico de relieve con el norte arriba. Además de Gale, el equipo modeló en Civil 3D los cráteres Babati y Robert Sharp, la franja noroeste y el sector sur con Farah Vallis. Elige un área para ver su modelo.",
            "Relief mosaic with north at the top. Besides Gale, the team modeled Babati and Robert Sharp craters, the northwest strip and the south sector with Farah Vallis in Civil 3D. Pick an area to see its model.",
          )}
        </p>
      </header>

      <div className="around-grid">
        <figure className="card around-map">
          <div className="around-mosaic">
            <img src={mosaic} width={1510} height={680} loading="lazy" decoding="async"
              alt={t(
                "Mosaico de relieve de Gale y sus alrededores: Robert Sharp al oeste, Babati al norte, Gale con Aeolis Mons al centro y Farah Vallis en el borde sur.",
                "Relief mosaic of Gale and its surroundings: Robert Sharp to the west, Babati to the north, Gale with Aeolis Mons in the center and Farah Vallis on the south rim.",
              )} />
            <span className="around-box" aria-hidden="true"
              style={{ left: `${area.box[0]}%`, top: `${area.box[1]}%`, width: `${area.box[2]}%`, height: `${area.box[3]}%` }} />
            {AREAS.map((a) => (
              <button key={a.id} type="button" className="around-pin" aria-pressed={a.id === sel}
                style={{ left: `${a.pin[0]}%`, top: `${a.pin[1]}%` }} onClick={() => setSel(a.id)}
                aria-label={`${bi(a.place)}: ${bi(a.name)}`}>
                <i aria-hidden="true" />
              </button>
            ))}
            <span className="around-north" aria-hidden="true">N ↑</span>
          </div>
          <figcaption className="around-tabs" role="tablist" aria-label={t("Áreas modeladas", "Modeled areas")}>
            {AREAS.map((a) => (
              <button key={a.id} type="button" role="tab" aria-selected={a.id === sel} aria-controls="around-panel" onClick={() => setSel(a.id)}>
                <small>{bi(a.place)}</small>{bi(a.name)}
              </button>
            ))}
          </figcaption>
        </figure>

        <figure className="card around-model" id="around-panel" role="tabpanel" key={area.id}>
          <div className="around-model-frame">
            <img src={area.src} width={area.w} height={area.h} loading="lazy" decoding="async" alt={bi(area.alt)} />
          </div>
          <figcaption>
            <span className="card-label">{bi(area.place)} · Autodesk Civil 3D</span>
            <b>{bi(area.name)}</b>
            <span>{bi(area.text)}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
