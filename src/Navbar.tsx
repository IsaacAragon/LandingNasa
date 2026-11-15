import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";

interface Link { id: string; label: string }

/**
 * Barra superior tipo plano técnico: línea fina, secciones numeradas en monoespaciada,
 * la sección activa marcada con una línea óxido y el avance de lectura en el borde inferior.
 */
export default function Navbar({ project, links, ctaHref }: { project: string; links: Link[]; ctaHref: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const bar = useRef<HTMLElement>(null);
  const firstId = links[0]?.id;

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

  // Fondo al bajar y progreso de lectura (solo transform, una vez por frame)
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.current?.style.setProperty("transform", `scaleX(${max > 0 ? scrollY / max : 0})`);
      setScrolled(scrollY > 24);
      // Antes de la primera sección (hero) no hay ninguna activa
      const first = document.getElementById(firstId);
      if (first && first.getBoundingClientRect().top > innerHeight / 2) setActive(null);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", queue); removeEventListener("resize", queue); };
  }, [firstId]);

  return (
    <header className="topbar" data-scrolled={scrolled}>
      <div className="wrap topbar-inner">
        <a href="#top" className="brand" aria-label={`${project}, inicio`}>
          <Logo size={26} />
          <span className="brand-name">{project}</span>
          <span className="brand-meta" aria-hidden="true">Gale · 5.4°S 137.8°E</span>
        </a>
        <nav aria-label="Principal">
          <ol>
            {links.map((l, i) => (
              <li key={l.id}>
                <a href={`#${l.id}`} aria-current={active === l.id ? "location" : undefined}>
                  <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{l.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <a className="topbar-cta" href={ctaHref}>Ver demo <span aria-hidden="true">↗</span></a>
      </div>
      <i className="topbar-progress" ref={bar} aria-hidden="true" />
    </header>
  );
}
