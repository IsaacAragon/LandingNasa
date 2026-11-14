/** Centro del cráter Gale (latitud negativa = sur, °E) */
export const GALE = { lat: -5.4, lon: 137.8 };

/**
 * Radio angular con el que se dibuja Gale en el planeta (radianes).
 * El real es ~0.023 rad (77 km / 3389.5 km); se exagera ~4× para que el cráter
 * y Mount Sharp se lean al girar el planeta.
 */
export const CRATER_ANGLE = 0.09;

/** Mount Sharp dentro del cráter, en unidades del radio del cráter (este, norte) */
export const MOUNT_SHARP = { x: 0.05, y: -0.05, r: 0.5 };
