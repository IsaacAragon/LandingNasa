import { useBi, useT, type Bi } from "./i18n";

/* ==========================================================================
   ARES Map, el simulador (documento del equipo "MARTE.docx").
   Qué es, qué problema resuelve, la primera demostración y cómo se construye.
   ========================================================================== */

const OBJECTIVES: Bi[] = [
  {
    en: "Integrate data from several NASA missions into a 3D view of the area: topography, orbital images, thermal context and local environmental observations.",
    es: "Integrar datos de varias misiones de la NASA en una vista 3D del sector: topografía, imágenes orbitales, contexto térmico y observaciones ambientales locales.",
  },
  {
    en: "Show a hyper-local Martian area by layers, to understand the environment and its risks.",
    es: "Visualizar por capas una zona marciana hiperlocalizada para entender el entorno y sus riesgos.",
  },
  {
    en: "Compute and compare routes between the same start and goal by distance, slope and documented obstacles, flagging sections with insufficient coverage.",
    es: "Calcular y comparar recorridos entre un mismo origen y destino según distancia, pendiente y obstáculos documentados, señalando los tramos con cobertura insuficiente.",
  },
  {
    en: "Help identify scientific points of interest during exploration.",
    es: "Facilitar la identificación de puntos de interés científico durante la exploración.",
  },
];

const PIPELINE: { n: string; tool: string; title: Bi; text: Bi }[] = [
  {
    n: "01", tool: "USGS",
    title: { en: "Starting data", es: "Datos de partida" },
    text: { en: "Gale elevation model (1 m cells) and orthophoto mosaic, with their source, coverage and resolution.", es: "Modelo de elevación de Gale (celdas de 1 m) y mosaico de ortofotos, con su procedencia, cobertura y resolución." },
  },
  {
    n: "02", tool: "Autodesk Civil 3D",
    title: { en: "Relief", es: "Relieve" },
    text: { en: "Triangulated surface (TIN) of the corridor in meters: contours, slope ranges and longitudinal profiles.", es: "Superficie triangulada (TIN) del corredor en metros: curvas de nivel, rangos de pendiente y perfiles longitudinales." },
  },
  {
    n: "03", tool: "Cesium for Unity",
    title: { en: "Georeference", es: "Georreferencia" },
    text: { en: "Cesium Mars terrain with the corridor placed in a Martian frame, checked against Bradbury Landing and John Klein.", es: "Terreno de Cesium Mars y el corredor ubicado en un marco marciano, verificado con Bradbury Landing y John Klein." },
  },
  {
    n: "04", tool: "Unity",
    title: { en: "Simulator", es: "Simulador" },
    text: { en: "Interactive layers, markers and route comparison on a grid with distance, slope and obstacle costs.", es: "Capas interactivas, marcadores y comparación de rutas sobre una cuadrícula con costos de distancia, pendiente y obstáculos." },
  },
];

const MARKERS: { color: string; label: Bi; text: Bi }[] = [
  { color: "#4a8df0", label: { en: "Bradbury Landing", es: "Bradbury Landing" }, text: { en: "Historic contact point of Curiosity", es: "Punto histórico de contacto de Curiosity" } },
  { color: "#47b26b", label: { en: "Candidate landing", es: "Aterrizaje candidato" }, text: { en: "Polygon on Gale’s floor, around Bradbury", es: "Polígono en el piso de Gale, alrededor de Bradbury" } },
  { color: "#9a6bd8", label: { en: "Temporary habitat", es: "Hábitat temporal" }, text: { en: "Outside the landing footprint, with a round-trip corridor", es: "Fuera de la huella de aterrizaje, con corredor de ida y vuelta" } },
  { color: "#e8893a", label: { en: "John Klein", es: "John Klein" }, text: { en: "Scientific target of the walk", es: "Objetivo científico de la caminata" } },
  { color: "#d8463a", label: { en: "Hazards", es: "Peligros" }, text: { en: "Steps, obstacles and areas excluded from the route", es: "Escalones, obstáculos y zonas excluidas de la ruta" } },
  { color: "#8a8580", label: { en: "Insufficient coverage", es: "Cobertura insuficiente" }, text: { en: "Sections without enough data, shown in the comparison", es: "Tramos sin datos suficientes, visibles en la comparación" } },
];

export default function AresProject() {
  const t = useT();
  const bi = useBi();
  return (
    <section id="proyecto" className="wrap project">
      <header className="section-head">
        <p className="kicker"><span className="dot" aria-hidden="true" />{t("El proyecto · Equipo Salomonsters", "The project · Team Salomonsters")}</p>
        <h2>ARES Map, <span>{t("el simulador.", "the simulator.")}</span></h2>
        <p className="lead">
          {t(
            "Un simulador 3D en Unity para planificar recorridos de superficie en el cráter Gale. Integra relieve, imágenes orbitales y observaciones del rover Curiosity: permite consultar sitios históricos, comparar zonas candidatas de aterrizaje y hábitat, identificar peligros y trazar una ruta hacia un objetivo científico.",
            "A 3D Unity simulator for planning surface routes in Gale crater. It combines relief, orbital images and observations from the Curiosity rover: it lets you explore historic sites, compare candidate landing and habitat areas, identify hazards and plot a route to a scientific target.",
          )}
        </p>
      </header>

      <div className="project-grid">
        <article className="card project-problem">
          <p className="card-label">{t("El problema", "The problem")}</p>
          <p>
            {t(
              "Hoy Marte se explora con robots. Los primeros astronautas necesitarán una interfaz unificada y de alta resolución para ver juntos la zona de exploración y sus métricas de seguridad: los datos de las misiones están dispersos y herramientas globales como Mars Trek no se enfocan en salidas de superficie tan localizadas.",
              "Today Mars is explored with robots. The first astronauts will need a unified, high-resolution interface to see the exploration area and its safety metrics together: mission data is scattered, and global tools like Mars Trek do not focus on such local surface trips.",
            )}
          </p>
          <p className="project-question">
            {t(
              "¿Cómo integrar datos de varias misiones en una vista 3D por capas que permita planificar y ejecutar recorridos seguros y científicamente productivos?",
              "How can data from several missions be integrated into a layered 3D view that lets people plan and carry out safe and scientifically productive routes?",
            )}
          </p>
        </article>

        <article className="card project-goal">
          <p className="card-label">{t("Objetivo", "Goal")}</p>
          <p>
            {t(
              "Un sistema interactivo de modelado 3D y mapeo por capas de la superficie de Marte en Unity, con datos científicos de la NASA, para planificar y ejecutar caminatas espaciales de forma segura.",
              "An interactive 3D modeling and layered mapping system for the Martian surface in Unity, built on NASA scientific data, to plan and carry out spacewalks safely.",
            )}
          </p>
          <ol className="project-objectives">
            {OBJECTIVES.map((o) => <li key={o.en}>{bi(o)}</li>)}
          </ol>
        </article>

        <article className="card project-demo">
          <p className="card-label">{t("Primera demostración", "First demonstration")}</p>
          <div className="demo-route" aria-hidden="true">
            <span className="demo-stop" style={{ ["--c" as string]: "#4a8df0" }}><i />Bradbury Landing</span>
            <span className="demo-line"><b>~445 m</b><small>{t("en línea recta", "straight line")}</small></span>
            <span className="demo-stop" style={{ ["--c" as string]: "#e8893a" }}><i />John Klein</span>
          </div>
          <p>
            {t(
              "Corredor Bradbury Landing–Yellowknife Bay, de unos 445 m en línea recta según el perfil publicado por la NASA. La tarea: documentar los estratos de la lutita Sheepbed cerca de John Klein y relacionarlos con las evidencias del antiguo lago.",
              "Bradbury Landing–Yellowknife Bay corridor, about 445 m in a straight line according to the profile published by NASA. The task: document the Sheepbed mudstone layers near John Klein and relate them to the evidence of the ancient lake.",
            )}
          </p>
          <p className="project-note">
            {t(
              "Se comparan dos rutas con el mismo origen: una de referencia y otra con restricciones de terreno. Para cada una se registran distancia, ascenso y descenso, pendiente máxima y tramos sin cobertura. Las cifras se publicarán al probar el prototipo.",
              "Two routes with the same start are compared: a reference route and one with terrain constraints. For each one, distance, climb and descent, maximum slope and sections without coverage are recorded. The figures will be published once the prototype is tested.",
            )}
          </p>
        </article>

        <article className="card project-markers">
          <p className="card-label">{t("Marcadores del mapa", "Map markers")}</p>
          <ul>
            {MARKERS.map((m) => (
              <li key={m.label.en}><i style={{ background: m.color }} aria-hidden="true" /><span><b>{bi(m.label)}</b><small>{bi(m.text)}</small></span></li>
            ))}
          </ul>
        </article>
      </div>

      <ol className="pipeline" aria-label={t("Cómo se construye ARES Map", "How ARES Map is built")}>
        {PIPELINE.map((p) => (
          <li key={p.n} className="card">
            <span className="step-n">{p.n} · {p.tool}</span>
            <b>{bi(p.title)}</b>
            <span>{bi(p.text)}</span>
          </li>
        ))}
      </ol>

      <div className="card project-impact">
        <div>
          <p className="card-label">{t("Para quién", "Who it is for")}</p>
          <p>{t("Futuros astronautas, planificadores de misión y científicos planetarios: menos tiempo de planificación, menos riesgo en terreno desconocido y más ciencia en cada salida.", "Future astronauts, mission planners and planetary scientists: less planning time, less risk on unknown terrain and more science on every trip.")}</p>
        </div>
        <div>
          <p className="card-label">{t("Lo que sigue", "What's next")}</p>
          <p>{t("Telemetría en tiempo real de trajes o rovers de apoyo, visualización en cascos con pantalla o realidad aumentada, clima marciano dinámico y exploración en parejas o con asistencia robótica.", "Real-time telemetry from suits or support rovers, display in helmets or augmented reality, dynamic Martian weather, and exploration in pairs or with robotic assistance.")}</p>
        </div>
      </div>
    </section>
  );
}
