import { useId } from "react";

/**
 * Marca de Aresmap: Marte, el cráter Gale con Mount Sharp y la ruta que llega al destino.
 * Misma geometría que public/favicon.svg (si cambias una, cambia la otra).
 */
export default function Logo({ size = 28, title }: { size?: number; title?: string }) {
  const id = useId();
  const mars = `${id}-mars`, crater = `${id}-crater`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <radialGradient id={mars} cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#f2a56c" />
          <stop offset="0.45" stopColor="#d2542a" />
          <stop offset="1" stopColor="#4a180a" />
        </radialGradient>
        <radialGradient id={crater} cx="60%" cy="65%" r="70%">
          <stop offset="0" stopColor="#9a3a1a" />
          <stop offset="1" stopColor="#3a1208" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill={`url(#${mars})`} />
      <circle cx="40" cy="25" r="10.5" fill={`url(#${crater})`} />
      <circle cx="40" cy="25" r="10.5" fill="none" stroke="#f2b07e" strokeOpacity="0.75" strokeWidth="1.6" />
      <circle cx="41.5" cy="27" r="4.2" fill="#c8693a" />
      <path d="M13 47 C 20 41, 22 31, 31 30 S 38 25, 40 25" fill="none" stroke="#f5f2ec" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="13" cy="47" r="3.2" fill="#f5f2ec" />
      <circle cx="40" cy="25" r="4.6" fill="#f5f2ec" />
      <circle className="logo-target" cx="40" cy="25" r="2.1" fill="#d2542a" />
    </svg>
  );
}
