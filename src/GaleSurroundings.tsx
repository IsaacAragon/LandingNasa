import { useState } from "react";
import mosaic from "./assets/gale/gale-alrededores.webp";
import centro from "./assets/gale/gale-centro.webp";
import norte from "./assets/gale/gale-norte-babati.webp";
import sur from "./assets/gale/gale-sur.webp";
import noroeste from "./assets/gale/gale-noroeste.webp";
import oeste from "./assets/gale/gale-oeste-robert-sharp.webp";
import "./surroundings.css";

/* ==========================================================================
   Gale y sus alrededores (documento del equipo "MARTE.docx").
   Mosaico de relieve con el norte arriba; cada marcador abre el modelo de esa área hecho en
   Autodesk Civil 3D. Posiciones en % del mosaico recortado (1510 × 680 px).
   ========================================================================== */

interface Area {
  id: string;
  name: string;
  place: string;
  text: string;
  src: string; w: number; h: number;
  pin: [number, number];                       // marcador (izquierda %, arriba %)
  box: [number, number, number, number];       // recuadro del área (izq, arriba, ancho, alto en %)
}

const AREAS: Area[] = [
  {
    id: "centro", name: "Gale", place: "Área central",
    text: "Superficie triangulada del piso de Gale y de Aeolis Mons, generada en Civil 3D a partir del modelo de elevación. Es la base del relieve, las pendientes y los perfiles de ruta.",
    src: centro, w: 1272, h: 977, pin: [55.2, 54.7], box: [41.3, 22, 31.7, 72.4],
  },
  {
    id: "norte", name: "Babati", place: "Norte",
    text: "Cráter Babati y el borde norte de Gale, en curvas de nivel y en dos vistas isométricas.",
    src: norte, w: 1400, h: 907, pin: [58.8, 13.5], box: [54.7, 3.5, 8.4, 28.7],
  },
  {
    id: "noroeste", name: "Franja noroeste", place: "Noroeste",
    text: "Relieve exterior al noroeste de Gale, entre Robert Sharp y Babati, en curvas de nivel y en vista isométrica.",
    src: noroeste, w: 1400, h: 886, pin: [50.2, 13.5], box: [46.1, 3.5, 8.7, 26.2],
  },
  {
    id: "sur", name: "Farah Vallis", place: "Sur",
    text: "Sector sur de Aeolis Mons, el borde sur de Gale y Farah Vallis, el valle que corta el borde del cráter.",
    src: sur, w: 1400, h: 927, pin: [57.5, 91.5], box: [43.5, 54.6, 28, 44.3],
  },
  {
    id: "oeste", name: "Robert Sharp", place: "Oeste",
    text: "Cráter Robert Sharp, al oeste de Gale: un piso lleno de montículos, modelado en curvas de nivel y en dos vistas isométricas.",
    src: oeste, w: 1400, h: 875, pin: [13.8, 23.8], box: [0.6, 1.2, 45.4, 61],
  },
];

export default function GaleSurroundings() {
  const [sel, setSel] = useState(AREAS[0].id);
  const area = AREAS.find((a) => a.id === sel)!;

  return (
    <section id="alrededores" className="wrap around">
      <header className="section-head">
        <p className="kicker"><span className="dot" aria-hidden="true" />Gale y sus alrededores</p>
        <h2>Cinco áreas, <span>un mismo relieve.</span></h2>
        <p className="lead">
          Mosaico de relieve con el norte arriba. Además de Gale, el equipo modeló en Civil 3D los cráteres Babati y
          Robert Sharp, la franja noroeste y el sector sur con Farah Vallis. Elige un área para ver su modelo.
        </p>
      </header>

      <div className="around-grid">
        <figure className="card around-map">
          <div className="around-mosaic">
            <img src={mosaic} width={1510} height={680} loading="lazy" decoding="async"
              alt="Mosaico de relieve de Gale y sus alrededores: Robert Sharp al oeste, Babati al norte, Gale con Aeolis Mons al centro y Farah Vallis en el borde sur." />
            <span className="around-box" aria-hidden="true"
              style={{ left: `${area.box[0]}%`, top: `${area.box[1]}%`, width: `${area.box[2]}%`, height: `${area.box[3]}%` }} />
            {AREAS.map((a) => (
              <button key={a.id} type="button" className="around-pin" aria-pressed={a.id === sel}
                style={{ left: `${a.pin[0]}%`, top: `${a.pin[1]}%` }} onClick={() => setSel(a.id)}
                aria-label={`${a.place}: ${a.name}`}>
                <i aria-hidden="true" />
              </button>
            ))}
            <span className="around-north" aria-hidden="true">N ↑</span>
          </div>
          <figcaption className="around-tabs" role="tablist" aria-label="Áreas modeladas">
            {AREAS.map((a) => (
              <button key={a.id} type="button" role="tab" aria-selected={a.id === sel} aria-controls="around-panel" onClick={() => setSel(a.id)}>
                <small>{a.place}</small>{a.name}
              </button>
            ))}
          </figcaption>
        </figure>

        <figure className="card around-model" id="around-panel" role="tabpanel" key={area.id}>
          <div className="around-model-frame">
            <img src={area.src} width={area.w} height={area.h} loading="lazy" decoding="async"
              alt={`Modelo de ${area.name} (${area.place.toLowerCase()}) en Autodesk Civil 3D: curvas de nivel y vista isométrica.`} />
          </div>
          <figcaption>
            <span className="card-label">{area.place} · Autodesk Civil 3D</span>
            <b>{area.name}</b>
            <span>{area.text}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
