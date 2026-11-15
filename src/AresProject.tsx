/* ==========================================================================
   ARES Map, el simulador (documento del equipo "MARTE.docx").
   Qué es, qué problema resuelve, la primera demostración y cómo se construye.
   ========================================================================== */

const OBJECTIVES = [
  "Integrar datos de varias misiones de la NASA en una vista 3D del sector: topografía, imágenes orbitales, contexto térmico y observaciones ambientales locales.",
  "Visualizar por capas una zona marciana hiperlocalizada para entender el entorno y sus riesgos.",
  "Calcular y comparar recorridos entre un mismo origen y destino según distancia, pendiente y obstáculos documentados, señalando los tramos con cobertura insuficiente.",
  "Facilitar la identificación de puntos de interés científico durante la exploración.",
];

const PIPELINE = [
  { n: "01", tool: "USGS", title: "Datos de partida", text: "Modelo de elevación de Gale (celdas de 1 m) y mosaico de ortofotos, con su procedencia, cobertura y resolución." },
  { n: "02", tool: "Autodesk Civil 3D", title: "Relieve", text: "Superficie triangulada (TIN) del corredor en metros: curvas de nivel, rangos de pendiente y perfiles longitudinales." },
  { n: "03", tool: "Cesium for Unity", title: "Georreferencia", text: "Terreno de Cesium Mars y el corredor ubicado en un marco marciano, verificado con Bradbury Landing y John Klein." },
  { n: "04", tool: "Unity", title: "Simulador", text: "Capas interactivas, marcadores y comparación de rutas sobre una cuadrícula con costos de distancia, pendiente y obstáculos." },
];

const MARKERS = [
  { color: "#4a8df0", label: "Bradbury Landing", text: "Punto histórico de contacto de Curiosity" },
  { color: "#47b26b", label: "Aterrizaje candidato", text: "Polígono en el piso de Gale, alrededor de Bradbury" },
  { color: "#9a6bd8", label: "Hábitat temporal", text: "Fuera de la huella de aterrizaje, con corredor de ida y vuelta" },
  { color: "#e8893a", label: "John Klein", text: "Objetivo científico de la caminata" },
  { color: "#d8463a", label: "Peligros", text: "Escalones, obstáculos y zonas excluidas de la ruta" },
  { color: "#8a8580", label: "Cobertura insuficiente", text: "Tramos sin datos suficientes, visibles en la comparación" },
];

export default function AresProject() {
  return (
    <section id="proyecto" className="wrap project">
      <header className="section-head">
        <p className="kicker"><span className="dot" aria-hidden="true" />El proyecto · Equipo Salomonsters</p>
        <h2>ARES Map, <span>el simulador.</span></h2>
        <p className="lead">
          Un simulador 3D en Unity para planificar recorridos de superficie en el cráter Gale. Integra relieve, imágenes
          orbitales y observaciones del rover Curiosity: permite consultar sitios históricos, comparar zonas candidatas de
          aterrizaje y hábitat, identificar peligros y trazar una ruta hacia un objetivo científico.
        </p>
      </header>

      <div className="project-grid">
        <article className="card project-problem">
          <p className="card-label">El problema</p>
          <p>
            Hoy Marte se explora con robots. Los primeros astronautas necesitarán una interfaz unificada y de alta resolución
            para ver juntos la zona de exploración y sus métricas de seguridad: los datos de las misiones están dispersos y
            herramientas globales como Mars Trek no se enfocan en salidas de superficie tan localizadas.
          </p>
          <p className="project-question">
            ¿Cómo integrar datos de varias misiones en una vista 3D por capas que permita planificar y ejecutar recorridos
            seguros y científicamente productivos?
          </p>
        </article>

        <article className="card project-goal">
          <p className="card-label">Objetivo</p>
          <p>
            Un sistema interactivo de modelado 3D y mapeo por capas de la superficie de Marte en Unity, con datos científicos de
            la NASA, para planificar y ejecutar caminatas espaciales de forma segura.
          </p>
          <ol className="project-objectives">
            {OBJECTIVES.map((o) => <li key={o}>{o}</li>)}
          </ol>
        </article>

        <article className="card project-demo">
          <p className="card-label">Primera demostración</p>
          <div className="demo-route" aria-hidden="true">
            <span className="demo-stop" style={{ ["--c" as string]: "#4a8df0" }}><i />Bradbury Landing</span>
            <span className="demo-line"><b>~445 m</b><small>en línea recta</small></span>
            <span className="demo-stop" style={{ ["--c" as string]: "#e8893a" }}><i />John Klein</span>
          </div>
          <p>
            Corredor Bradbury Landing–Yellowknife Bay, de unos 445 m en línea recta según el perfil publicado por la NASA. La
            tarea: documentar los estratos de la lutita Sheepbed cerca de John Klein y relacionarlos con las evidencias del
            antiguo lago.
          </p>
          <p className="project-note">
            Se comparan dos rutas con el mismo origen: una de referencia y otra con restricciones de terreno. Para cada una se
            registran distancia, ascenso y descenso, pendiente máxima y tramos sin cobertura. Las cifras se publicarán al probar
            el prototipo.
          </p>
        </article>

        <article className="card project-markers">
          <p className="card-label">Marcadores del mapa</p>
          <ul>
            {MARKERS.map((m) => (
              <li key={m.label}><i style={{ background: m.color }} aria-hidden="true" /><span><b>{m.label}</b><small>{m.text}</small></span></li>
            ))}
          </ul>
        </article>
      </div>

      <ol className="pipeline" aria-label="Cómo se construye ARES Map">
        {PIPELINE.map((p) => (
          <li key={p.n} className="card">
            <span className="step-n">{p.n} · {p.tool}</span>
            <b>{p.title}</b>
            <span>{p.text}</span>
          </li>
        ))}
      </ol>

      <div className="card project-impact">
        <div>
          <p className="card-label">Para quién</p>
          <p>Futuros astronautas, planificadores de misión y científicos planetarios: menos tiempo de planificación, menos riesgo en terreno desconocido y más ciencia en cada salida.</p>
        </div>
        <div>
          <p className="card-label">Lo que sigue</p>
          <p>Telemetría en tiempo real de trajes o rovers de apoyo, visualización en cascos con pantalla o realidad aumentada, clima marciano dinámico y exploración en parejas o con asistencia robótica.</p>
        </div>
      </div>
    </section>
  );
}
