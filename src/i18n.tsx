import { useSyncExternalStore } from "react";

/* ==========================================================================
   Idioma del sitio. Por defecto inglés. El usuario puede cambiarlo con el selector
   de la barra superior; la elección se guarda en el navegador.
   El servidor (prerender) siempre renderiza inglés; si el usuario eligió español,
   el cambio se aplica después de hidratar, igual que el modo de movimiento reducido.
   ========================================================================== */

export type Lang = "en" | "es";
/** Texto bilingüe: se escribe junto a su traducción. */
export type Bi = { en: string; es: string };

/* El idioma sale de la URL: "/" es inglés y "/es/" es español. Cada página se prerenderiza
   en su idioma, así que el HTML que reciben los buscadores ya trae el texto correcto. */
let pageLang: Lang = "en";        // idioma con el que se generó el HTML (servidor y primera hidratación)
let lang: Lang = "en";            // idioma actual en el navegador
const listeners = new Set<() => void>();

/** Idioma según la ruta: cualquier ruta que empiece por /es es español. */
export const langFromPath = (path: string): Lang => (/^\/es(\/|$)/.test(path) ? "es" : "en");

/** Fija el idioma de la página (en el servidor antes de renderizar, y en el navegador antes de hidratar). */
export function setPageLang(l: Lang) {
  pageLang = l;
  lang = l;
  if (typeof document !== "undefined") document.documentElement.lang = l;
}

/** Se llama en el navegador antes de hidratar. */
export function initLang(path: string) {
  setPageLang(langFromPath(path));
}

const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

/** Idioma actual. En la hidratación se usa el idioma con el que se generó el HTML. */
export function useLang(): [Lang, (l: Lang) => void] {
  const current = useSyncExternalStore(subscribe, () => lang, () => pageLang);
  return [current, () => {}];
}

/** Versión en el idioma actual de un texto bilingüe. */
export function useBi(): (b: Bi) => string {
  const [current] = useLang();
  return (b) => (current === "es" ? b.es : b.en);
}

/** Devuelve t(es, en): elige el texto del idioma actual. */
export function useT(): (es: string, en: string) => string {
  const [current] = useLang();
  return (es, en) => (current === "es" ? es : en);
}

/** Localización para formato de números y fechas. */
export function useLocale(): string {
  const [current] = useLang();
  return current === "es" ? "es" : "en-US";
}

/** Ruta de la página en el otro idioma (conserva la sección del ancla). */
export const otherLangHref = (l: Lang) => (l === "es" ? "/es/" : "/");
