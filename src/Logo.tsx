/**
 * Logo de Salomonsters · Aresmap (imagen del escudo, con fondo transparente).
 * El mismo archivo se usa en el favicon (favicon-32.png / favicon.ico) y en la barra superior.
 */
export default function Logo({ size = 28 }: { size?: number; title?: string }) {
  return <img src="/logo.png" width={size} height={size} alt="" decoding="async" className="logo-img" />;
}
