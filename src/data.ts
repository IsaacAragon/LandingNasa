/* ==========================================================================
   Datos de Aresmap: cráter Gale y Mount Sharp.
   Cada cifra lleva su fuente [F#] tal como viene en la investigación del equipo.
   Los textos son bilingües: { en, es }. Edita aquí; los gráficos se redibujan solos.
   ========================================================================== */
import type { Bi } from "./i18n";

export type Sources = string[];

/* ---------- Capa: geología (lago habitable) ---------- */
export const ELEMENTS: { symbol: string; name: Bi; status: "measured" | "inferred" }[] = [
  { symbol: "C", name: { en: "Carbon", es: "Carbono" }, status: "measured" },
  { symbol: "H", name: { en: "Hydrogen", es: "Hidrógeno" }, status: "measured" },
  { symbol: "O", name: { en: "Oxygen", es: "Oxígeno" }, status: "measured" },
  { symbol: "S", name: { en: "Sulfur", es: "Azufre" }, status: "measured" },
  { symbol: "N", name: { en: "Nitrogen", es: "Nitrógeno" }, status: "measured" },
  { symbol: "P", name: { en: "Phosphorus", es: "Fósforo" }, status: "inferred" },
];

/* ---------- Capa: topografía (Mount Sharp, de abajo hacia arriba) ---------- */
export const STRATA: { name: Bi; note: Bi }[] = [
  { name: { en: "Clays", es: "Arcillas" }, note: { en: "The oldest layers: stable water", es: "Las capas más viejas: agua estable" } },
  { name: { en: "Sulfates", es: "Sulfatos" }, note: { en: "Salty minerals: the water was drying up", es: "Minerales salados: el agua se secaba" } },
  { name: { en: "Boxwork layer", es: "Capa con boxwork" }, note: { en: "Groundwater ridges, km long", es: "Crestas de agua subterránea, km de extensión" } },
];
export const MOUNT_SHARP_KM = 5;

/* ---------- Capa: objetivo (boxwork) ---------- */
export const BOXWORK_TIMELINE: { date: Bi; label: Bi; src: string }[] = [
  { date: { en: "8 Jun 2025", es: "8 jun 2025" }, label: { en: "Drilling of “Altadena” in the boxwork area", es: "Perforación de «Altadena» en la zona boxwork" }, src: "F4" },
  { date: { en: "Oct 2025", es: "oct 2025" }, label: { en: "The “Monte Grande” hole is chosen", es: "Se elige el hueco «Monte Grande»" }, src: "F5" },
];

/* ---------- Capa: muestreo (metano en ppbv) ---------- */
export const METHANE = { mean: 0.41, sd: 0.16, seasonalMin: 0.24, seasonalMax: 0.65, spike: 7 };

/* ---------- Capa: radiación (dosis equivalente, mSv/día) ---------- */
export const DOSE = { cruise: 1.8, surface: 0.67, terrainCut: 0.19 };
export const RADIATION_BARS: { label: Bi; value: number; src: string; emphasis?: boolean; note?: Bi }[] = [
  { label: { en: "Trip to Mars (inside the spacecraft)", es: "Viaje a Marte (dentro de la nave)" }, value: DOSE.cruise, src: "F10, F11" },
  { label: { en: "Gale surface", es: "Superficie de Gale" }, value: DOSE.surface, src: "F10, F11", emphasis: true },
  { label: { en: "Next to ridges and buttes", es: "Junto a lomas y buttes" }, value: +(DOSE.surface * (1 - DOSE.terrainCut)).toFixed(2), src: "F34", note: { en: "up to 19% less", es: "hasta 19 % menos" } },
];

/* ---------- Capa: clima (REMS y registro de posiciones) ---------- */
export const REMS_FIELDS: [string, Bi][] = [
  ["min_temp / max_temp", { en: "Air temperature", es: "Temperatura del aire" }],
  ["min_gts_temp / max_gts_temp", { en: "Ground temperature", es: "Temperatura del suelo" }],
  ["pressure", { en: "Pressure", es: "Presión" }],
  ["atmo_opacity", { en: "Opacity", es: "Opacidad" }],
  ["local_uv_irradiance_index", { en: "UV index", es: "Índice UV" }],
];
export const TRAVERSE = { points: 1389, sol: 5073, km: 38.6, years: 14 };

/* ---------- Capa: terreno humano (votos del taller de Zonas de Exploración, 2015) ---------- */
export const EZ_VOTES: { label: Bi | string; value: number; emphasis?: boolean }[] = [
  { label: "Melas Chasma", value: 9 },
  { label: "Jezero", value: 8 },
  { label: { en: "Gale · proposal #1020", es: "Gale · propuesta #1020" }, value: 6, emphasis: true },
];
export const SOIL_WATER = { min: 1.5, max: 3 };

/* ---------- Ruta segura hacia el boxwork ----------
   Paradas del camino que Curiosity ya recorrió: cada metro está probado por un rover.
   pos = posición esquemática dentro de Gale en unidades del radio del cráter (este, norte),
   centrada en el cráter. Inicio en el piso noroeste, final en la ladera de Mount Sharp. */
export const ROUTE_STOPS: { name: string | Bi; what: Bi; layer: Bi; pos: [number, number] }[] = [
  { name: "Bradbury Landing", what: { en: "Curiosity lands, Aug 2012", es: "Aterrizaje de Curiosity, ago 2012" }, layer: { en: "Start", es: "Inicio" }, pos: [-0.32, 0.62] },
  { name: "Yellowknife Bay", what: { en: "Ancient habitable lake: neutral pH, low salt", es: "Lago antiguo habitable: pH neutro, poca sal" }, layer: { en: "Geology", es: "Geología" }, pos: [-0.2, 0.66] },
  { name: "Pahrump Hills", what: { en: "Foot of Mount Sharp: the climb begins", es: "Base de Mount Sharp: empieza la subida" }, layer: { en: "Topography", es: "Topografía" }, pos: [-0.4, 0.48] },
  { name: "Glen Torridon", what: { en: "Region rich in clays", es: "Región rica en arcillas" }, layer: { en: "Geology", es: "Geología" }, pos: [-0.34, 0.38] },
  { name: { en: "Sulfate unit", es: "Unidad de sulfatos" }, what: { en: "The climate was getting drier", es: "El clima se volvía más seco" }, layer: { en: "Topography", es: "Topografía" }, pos: [-0.3, 0.29] },
  { name: "Boxwork", what: { en: "Target: “Altadena” and “Monte Grande”", es: "Objetivo: «Altadena» y «Monte Grande»" }, layer: { en: "Target", es: "Objetivo" }, pos: [-0.24, 0.21] },
];

/* ---------- Gale en fechas ---------- */
export const GALE_TIMELINE: { date: Bi; label: Bi }[] = [
  { date: { en: "1865–1945", es: "1865–1945" }, label: { en: "Walter F. Gale, an Australian amateur astronomer who observed Mars. The crater is named after him.", es: "Walter F. Gale, astrónomo aficionado australiano que observó Marte. El cráter lleva su nombre." } },
  { date: { en: "22 Jul 2011", es: "22 jul 2011" }, label: { en: "NASA picks Gale as Curiosity’s landing site.", es: "La NASA elige Gale como sitio de aterrizaje de Curiosity." } },
  { date: { en: "6 Aug 2012", es: "6 ago 2012" }, label: { en: "Curiosity lands with the sky crane.", es: "Curiosity aterriza con la grúa aérea (sky crane)." } },
  { date: { en: "22 Aug 2012", es: "22 ago 2012" }, label: { en: "The landing site is named Bradbury Landing, after Ray Bradbury.", es: "El punto de aterrizaje se bautiza Bradbury Landing, por Ray Bradbury." } },
  { date: { en: "8 Feb 2013", es: "8 feb 2013" }, label: { en: "First rock drilled on Mars: “John Klein”, at Yellowknife Bay.", es: "Primera perforación de una roca en Marte: «John Klein», en Yellowknife Bay." } },
  { date: { en: "12 Mar 2013", es: "12 mar 2013" }, label: { en: "NASA announces Gale had a habitable environment.", es: "La NASA anuncia que Gale tuvo un ambiente habitable." } },
  { date: { en: "Jun 2018", es: "jun 2018" }, label: { en: "SAM confirms organics in ~3-billion-year-old mudstones.", es: "SAM confirma orgánicos en lodolitas de ~3000 millones de años." } },
  { date: { en: "8 Jun 2025", es: "8 jun 2025" }, label: { en: "Drilling of “Altadena” in the boxwork area.", es: "Perforación de «Altadena» en la zona boxwork." } },
];

/* ---------- Datos curiosos ---------- */
export const GALE_FACTS: { value: Bi; label: Bi }[] = [
  { value: { en: "~154 km", es: "~154 km" }, label: { en: "in diameter", es: "de diámetro" } },
  { value: { en: "3.5–3.8 B", es: "3.500–3.800 M" }, label: { en: "years: estimated age of the impact that formed it", es: "de años: edad estimada del impacto que lo formó" } },
  { value: { en: "Aeolis Mons", es: "Aeolis Mons" }, label: { en: "is Mount Sharp’s official name, honoring geologist Robert P. Sharp", es: "es el nombre oficial de Mount Sharp, que honra al geólogo Robert P. Sharp" } },
  { value: { en: "~5 km", es: "~5 km" }, label: { en: "tall from the crater floor, taller than Mont Blanc", es: "de altura de Mount Sharp sobre el fondo del cráter, más que el Mont Blanc" } },
];

/* ---------- Galería (imágenes públicas de la NASA; w × h = tamaño servido, evita saltos de diseño) ---------- */
const NASA = "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia";
const R1280 = "jcr:content/renditions/cq5dam.web.1280.1280.jpeg";
export const GALLERY: { id: string; w: number; h: number; src: string; title: Bi; date: Bi; text: Bi; credit: string }[] = [
  { id: "PIA16032", w: 1280, h: 720, src: `${NASA}/pia16/pia16032/PIA16032.jpg/${R1280}`, title: { en: "Mount Sharp on the horizon", es: "Mount Sharp en el horizonte" }, date: { en: "Aug 2012", es: "ago 2012" }, text: { en: "Part of the first 360° color Mastcam panorama, days after landing.", es: "Parte del primer panorama a color de 360° de Mastcam, días después del aterrizaje." }, credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA16099", w: 399, h: 200, src: `${NASA}/pia16/pia16099/figures/PIA16099_fig1_thumb.jpg/${R1280}`, title: { en: "Getting to know Mount Sharp", es: "Conociendo Mount Sharp" }, date: { en: "2012", es: "2012" }, text: { en: "Mastcam shows the mountain’s layers that Curiosity would climb for over a decade.", es: "Mastcam muestra las capas de la montaña que Curiosity subiría durante más de una década." }, credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA26551", w: 1280, h: 209, src: `${NASA}/pia26/pia26551/PIA26551.jpg/${R1280}`, title: { en: "Looking back into the crater", es: "Mirando hacia el fondo del cráter" }, date: { en: "7 Feb 2025", es: "7 feb 2025" }, text: { en: "From the sulfate unit, looking back at Gale’s floor.", es: "Desde la unidad de sulfatos, de vuelta hacia el piso de Gale." }, credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA26552", w: 1280, h: 130, src: `${NASA}/pia26/pia26552/PIA26552.jpg/${R1280}`, title: { en: "On the road to the boxwork", es: "Camino a los boxwork" }, date: { en: "9 Mar 2025", es: "9 mar 2025" }, text: { en: "122-image panorama: the ridge network stretches 10 to 20 km up the slope.", es: "Panorama de 122 imágenes: la red de crestas se extiende 10 a 20 km por la ladera." }, credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA26560", w: 1280, h: 239, src: `${NASA}/pia26/pia26560/PIA26560.jpg/${R1280}`, title: { en: "Boxwork from a distance", es: "Boxwork a la distancia" }, date: { en: "22 May 2025", es: "22 may 2025" }, text: { en: "First close look at the boxwork region, from 23 images.", es: "Primera mirada de cerca a la región boxwork, en 23 imágenes." }, credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA26632", w: 356, h: 200, src: `${NASA}/pia26/pia26632/figures/PIA26632_figA_thumb.jpg/${R1280}`, title: { en: "Ridges and buttes", es: "Crestas y buttes" }, date: { en: "26 Jul 2025", es: "26 jul 2025" }, text: { en: "Boxwork ridges with the Mishe Mokwa and Texoli buttes behind the rover.", es: "Crestas boxwork con los buttes Mishe Mokwa y Texoli detrás del rover." }, credit: "NASA/JPL-Caltech/MSSS" },
  { id: "PIA26306", w: 393, h: 200, src: `${NASA}/pia26/pia26306/figures/PIA26306_figA_thumb.jpg/${R1280}`, title: { en: "Boxwork from orbit", es: "Boxwork desde órbita" }, date: { en: "2006 · published Dec 2024", es: "2006 · publicada dic 2024" }, text: { en: "HiRISE sees the ridge network like a spider web, before Curiosity arrived.", es: "HiRISE ve la red de crestas como una telaraña antes de que Curiosity llegara." }, credit: "NASA/JPL-Caltech/UArizona" },
];
