/**
 * Posición de scroll compartida.
 *
 * Leer `window.scrollY` obliga al navegador a recalcular el layout si algún estilo ya cambió
 * en ese frame. Como varias animaciones escriben estilos (paralaje, estrellas, planeta), cada
 * lectura posterior forzaba un layout completo. Aquí se lee UNA vez por evento de scroll,
 * antes de que nadie escriba, y todos usan ese valor.
 */
let y = 0, h = 800;

if (typeof window !== "undefined") {
  y = window.scrollY; h = window.innerHeight;
  // En captura y registrado al cargar el módulo: se actualiza antes que los demás oyentes
  addEventListener("scroll", () => { y = window.scrollY; }, { passive: true, capture: true });
  addEventListener("resize", () => { y = window.scrollY; h = window.innerHeight; }, { passive: true, capture: true });
}

export const scrollTop = () => y;
/** Alto de la ventana (también fuerza layout al leerlo de `window`, por eso se guarda aquí) */
export const viewportHeight = () => h;
