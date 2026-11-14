/* ==========================================================================
   Datos de Aresmap: cráter Gale y Mount Sharp.
   Cada cifra lleva su fuente [F#] tal como viene en la investigación del equipo.
   Edita aquí; los gráficos se redibujan solos.
   ========================================================================== */

export type Sources = string[];

/* ---------- Capa: geología (lago habitable) ---------- */
export const ELEMENTS: { symbol: string; name: string; status: "medido" | "inferido" }[] = [
  { symbol: "C", name: "Carbono", status: "medido" },
  { symbol: "H", name: "Hidrógeno", status: "medido" },
  { symbol: "O", name: "Oxígeno", status: "medido" },
  { symbol: "S", name: "Azufre", status: "medido" },
  { symbol: "N", name: "Nitrógeno", status: "medido" },
  { symbol: "P", name: "Fósforo", status: "inferido" },
];

/* ---------- Capa: topografía (Mount Sharp, de abajo hacia arriba) ---------- */
export const STRATA = [
  { name: "Arcillas", note: "Las capas más viejas: agua estable" },
  { name: "Sulfatos", note: "Minerales salados: el agua se secaba" },
  { name: "Capa con boxwork", note: "Crestas de agua subterránea, km de extensión" },
];
export const MOUNT_SHARP_KM = 5;

/* ---------- Capa: objetivo (boxwork) ---------- */
export const BOXWORK_TIMELINE = [
  { date: "8 jun 2025", label: "Perforación de «Altadena» en la zona boxwork", src: "F4" },
  { date: "oct 2025", label: "Se elige el hueco «Monte Grande»", src: "F5" },
];

/* ---------- Capa: muestreo (metano en ppbv) ---------- */
export const METHANE = { mean: 0.41, sd: 0.16, seasonalMin: 0.24, seasonalMax: 0.65, spike: 7 };

/* ---------- Capa: radiación (dosis equivalente, mSv/día) ---------- */
export const DOSE = { cruise: 1.8, surface: 0.67, terrainCut: 0.19 };
export const RADIATION_BARS = [
  { label: "Viaje a Marte (dentro de la nave)", value: DOSE.cruise, src: "F10, F11" },
  { label: "Superficie de Gale", value: DOSE.surface, src: "F10, F11", emphasis: true },
  { label: "Junto a lomas y buttes", value: +(DOSE.surface * (1 - DOSE.terrainCut)).toFixed(2), src: "F34", note: "hasta 19 % menos" },
];

/* ---------- Capa: clima (REMS y registro de posiciones) ---------- */
export const REMS_FIELDS = [
  ["min_temp / max_temp", "Temperatura del aire"],
  ["min_gts_temp / max_gts_temp", "Temperatura del suelo"],
  ["pressure", "Presión"],
  ["atmo_opacity", "Opacidad"],
  ["local_uv_irradiance_index", "Índice UV"],
];
export const TRAVERSE = { points: 1389, sol: 5073, km: 38.6, years: 14 };

/* ---------- Capa: terreno humano (votos del taller de Zonas de Exploración, 2015) ---------- */
export const EZ_VOTES = [
  { label: "Melas Chasma", value: 9 },
  { label: "Jezero", value: 8 },
  { label: "Gale · propuesta #1020", value: 6, emphasis: true },
];
export const SOIL_WATER = { min: 1.5, max: 3 };

/* ---------- Ruta segura hacia el boxwork ----------
   Paradas del camino que Curiosity ya recorrió: cada metro está probado por un rover. */
export const ROUTE_STOPS = [
  { name: "Bradbury Landing", what: "Aterrizaje de Curiosity, ago 2012", layer: "Inicio" },
  { name: "Yellowknife Bay", what: "Lago antiguo habitable: pH neutro, poca sal", layer: "Geología" },
  { name: "Pahrump Hills", what: "Base de Mount Sharp: empieza la subida", layer: "Topografía" },
  { name: "Glen Torridon", what: "Región rica en arcillas", layer: "Geología" },
  { name: "Unidad de sulfatos", what: "El clima se volvía más seco", layer: "Topografía" },
  { name: "Boxwork", what: "Objetivo: «Altadena» y «Monte Grande»", layer: "Objetivo" },
];
