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
   Paradas del camino que Curiosity ya recorrió: cada metro está probado por un rover.
   pos = posición esquemática dentro de Gale en unidades del radio del cráter (este, norte),
   centrada en el cráter. Inicio en el piso noroeste, final en la ladera de Mount Sharp. */
export const ROUTE_STOPS: { name: string; what: string; layer: string; pos: [number, number] }[] = [
  { name: "Bradbury Landing", what: "Aterrizaje de Curiosity, ago 2012", layer: "Inicio", pos: [-0.32, 0.62] },
  { name: "Yellowknife Bay", what: "Lago antiguo habitable: pH neutro, poca sal", layer: "Geología", pos: [-0.2, 0.66] },
  { name: "Pahrump Hills", what: "Base de Mount Sharp: empieza la subida", layer: "Topografía", pos: [-0.4, 0.48] },
  { name: "Glen Torridon", what: "Región rica en arcillas", layer: "Geología", pos: [-0.34, 0.38] },
  { name: "Unidad de sulfatos", what: "El clima se volvía más seco", layer: "Topografía", pos: [-0.3, 0.29] },
  { name: "Boxwork", what: "Objetivo: «Altadena» y «Monte Grande»", layer: "Objetivo", pos: [-0.24, 0.21] },
];

/* ---------- Gale en fechas ---------- */
export const GALE_TIMELINE = [
  { date: "1865–1945", label: "Walter F. Gale, astrónomo aficionado australiano que observó Marte. El cráter lleva su nombre." },
  { date: "22 jul 2011", label: "La NASA elige Gale como sitio de aterrizaje de Curiosity." },
  { date: "6 ago 2012", label: "Curiosity aterriza con la grúa aérea (sky crane)." },
  { date: "22 ago 2012", label: "El punto de aterrizaje se bautiza Bradbury Landing, por Ray Bradbury." },
  { date: "8 feb 2013", label: "Primera perforación de una roca en Marte: «John Klein», en Yellowknife Bay." },
  { date: "12 mar 2013", label: "La NASA anuncia que Gale tuvo un ambiente habitable." },
  { date: "jun 2018", label: "SAM confirma orgánicos en lodolitas de ~3000 millones de años." },
  { date: "8 jun 2025", label: "Perforación de «Altadena» en la zona boxwork." },
];

/* ---------- Datos curiosos ---------- */
export const GALE_FACTS = [
  { value: "~154 km", label: "de diámetro" },
  { value: "3.500–3.800 M", label: "de años: edad estimada del impacto que lo formó" },
  { value: "Aeolis Mons", label: "es el nombre oficial de Mount Sharp, que honra al geólogo Robert P. Sharp" },
  { value: "~5 km", label: "de altura de Mount Sharp sobre el fondo del cráter, más que el Mont Blanc" },
];

/* ---------- Galería (imágenes públicas de la NASA; w × h = tamaño servido, evita saltos de diseño) ---------- */
const NASA = "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia";
const R1280 = "jcr:content/renditions/cq5dam.web.1280.1280.jpeg";
export const GALLERY = [
  { id: "PIA16032", w: 1280, h: 720, src: `${NASA}/pia16/pia16032/PIA16032.jpg/${R1280}`, title: "Mount Sharp en el horizonte", date: "ago 2012", text: "Parte del primer panorama a color de 360° de Mastcam, días después del aterrizaje.", credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA16099", w: 399, h: 200, src: `${NASA}/pia16/pia16099/figures/PIA16099_fig1_thumb.jpg/${R1280}`, title: "Conociendo Mount Sharp", date: "2012", text: "Mastcam muestra las capas de la montaña que Curiosity subiría durante más de una década.", credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA26551", w: 1280, h: 209, src: `${NASA}/pia26/pia26551/PIA26551.jpg/${R1280}`, title: "Mirando hacia el fondo del cráter", date: "7 feb 2025", text: "Desde la unidad de sulfatos, de vuelta hacia el piso de Gale.", credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA26552", w: 1280, h: 130, src: `${NASA}/pia26/pia26552/PIA26552.jpg/${R1280}`, title: "Camino a los boxwork", date: "9 mar 2025", text: "Panorama de 122 imágenes: la red de crestas se extiende 10 a 20 km por la ladera.", credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA26560", w: 1280, h: 239, src: `${NASA}/pia26/pia26560/PIA26560.jpg/${R1280}`, title: "Boxwork a la distancia", date: "22 may 2025", text: "Primera mirada de cerca a la región boxwork, en 23 imágenes.", credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA26632", w: 356, h: 200, src: `${NASA}/pia26/pia26632/figures/PIA26632_figA_thumb.jpg/${R1280}`, title: "Crestas y buttes", date: "26 jul 2025", text: "Crestas boxwork con los buttes Mishe Mokwa y Texoli detrás del rover.", credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA26306", w: 393, h: 200, src: `${NASA}/pia26/pia26306/figures/PIA26306_figA_thumb.jpg/${R1280}`, title: "Boxwork desde órbita", date: "2006 · publicada dic 2024", text: "HiRISE ve la red de crestas como una telaraña antes de que Curiosity llegara.", credit: "NASA/JPL-Caltech/UArizona" },
];
