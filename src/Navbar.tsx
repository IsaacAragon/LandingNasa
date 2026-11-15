import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { scrollTop, viewportHeight } from "./scroll";
import { getPerf, setPerfMode, subscribePerf, usePerf } from "./perf";
import { useBi, useLang, useT, type Bi } from "./i18n";

interface Link { id: string; label: Bi }

/**
 * Barra superior tipo plano técnico: línea fina, secciones numeradas en monoespaciada,
 * la sección activa marcada con una línea óxido y el avance de lectura en el borde inferior.
 */
export default function Navbar({ project, links, ctaHref }: { project: string; links: Link[]; ctaHref: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const bar = useRef<HTMLElement>(null);
  const firstId = links[0]?.id;
  const bi = useBi();
  const t = useT();

  // Sección activa: la que cruza la franja central de la pantalla
  useEffect(() => {
    const els = links.map((l) => document.getElementById(l.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [links]);

  // Fondo al bajar y progreso de lectura. Las medidas (alto de la página y posición de la primera
  // sección) se toman solo al cambiar el tamaño; en cada scroll se usa la posición ya leída.
  useEffect(() => {
    let raf = 0, max = 1, firstTop = 0;
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const first = document.getElementById(firstId);
      firstTop = first ? first.getBoundingClientRect().top + scrollY : 0;
      update();
    };
    const update = () => {
      raf = 0;
      const y = scrollTop();
      bar.current?.style.setProperty("transform", `scaleX(${Math.min(1, y / max)})`);
      setScrolled(y > 24);
      // Antes de la primera sección (hero) no hay ninguna activa
      if (firstTop - y > viewportHeight() / 2) setActive(null);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    addEventListener("scroll", queue, { passive: true });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener("scroll", queue); };
  }, [firstId]);

  return (
    <header className="topbar" data-scrolled={scrolled}>
      <div className="wrap topbar-inner">
        <a href="#top" className="brand" aria-label={`${project}, ${t("inicio", "home")}`}>
          <Logo size={26} />
          <span className="brand-name">{project}</span>
          <span className="brand-meta" aria-hidden="true">Gale · 5.4°S 137.8°E</span>
        </a>
        <nav aria-label={t("Principal", "Main")}>
          <ol>
            {links.map((l, i) => (
              <li key={l.id}>
                <a href={`#${l.id}`} aria-current={active === l.id ? "location" : undefined}>
                  <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{bi(l.label)}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="topbar-actions">
          <LangSwitch />
          <PerfToggle />
          <a className="topbar-cta" href={ctaHref} target="_blank" rel="noopener">{t("Ver demo", "View demo")} <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <i className="topbar-progress" ref={bar} aria-hidden="true" />
    </header>
  );
}

/* ---------- Selector de idioma: enlaces reales a / (inglés) y /es/ (español) ---------- */
function LangSwitch() {
  const [lang] = useLang();
  return (
    <div className="lang" role="group" aria-label="Language / Idioma">
      <a href="/" hrefLang="en" lang="en" className="lang-btn" aria-current={lang === "en" ? "true" : undefined}>EN</a>
      <a href="/es/" hrefLang="es" lang="es" className="lang-btn" aria-current={lang === "es" ? "true" : undefined}>ES</a>
    </div>
  );
}

/* ---------- Botón de modo rendimiento ----------
   Activado: menos efectos (planeta estático en el hero, sin paralaje ni animaciones de entrada).
   Si se activó solo, el título explica por qué; si se activó al medir los fps, avisa una vez. */
function PerfToggle() {
  const perf = usePerf();
  const bi = useBi();
  const t = useT();
  const [notice, setNotice] = useState(false);

  // Aviso cuando la medición de fps lo activa mientras se navega (no al cargar por hardware)
  useEffect(() => {
    let wasAuto = getPerf().auto, timer = 0;
    const off = subscribePerf(() => {
      const p = getPerf();
      if (p.auto && !wasAuto && p.mode === "auto") {
        setNotice(true);
        clearTimeout(timer);
        timer = window.setTimeout(() => setNotice(false), 7000);
      }
      wasAuto = p.auto;
    });
    return () => { off(); clearTimeout(timer); };
  }, []);

  const why = perf.auto && perf.mode === "auto" ? `${t("Activado automáticamente", "Turned on automatically")}: ${perf.reasons.map(bi).join(", ")}.` : "";
  const title = perf.lite
    ? `${t("Modo rendimiento activado.", "Performance mode is on.")} ${why} ${t("Pulsa para ver todos los efectos.", "Click to see all effects.")}`
    : t("Modo rendimiento: menos efectos para que el scroll vaya fluido en equipos modestos.", "Performance mode: fewer effects so scrolling stays smooth on modest devices.");
  const last = perf.reasons[perf.reasons.length - 1];
  return (
    <div className="perf">
      <button
        type="button"
        className="perf-toggle"
        aria-pressed={perf.lite}
        title={title}
        onClick={() => { setNotice(false); setPerfMode(perf.lite ? "off" : "on"); }}
      >
        <span className="perf-dot" aria-hidden="true" />
        <span className="perf-label">{t("Rendimiento", "Performance")}</span>
        <span className="perf-state">{perf.lite ? (perf.mode === "auto" ? "auto" : "on") : "off"}</span>
      </button>
      {notice && last && (
        <p className="perf-notice" role="status">
          {t("Activamos el modo rendimiento", "We turned on performance mode")} ({bi(last)}) {t("para que el scroll vaya fluido.", "so scrolling stays smooth.")}
          <button type="button" onClick={() => { setNotice(false); setPerfMode("off"); }}>{t("Ver todos los efectos", "See all effects")}</button>
        </p>
      )}
    </div>
  );
}
