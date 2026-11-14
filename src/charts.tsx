import { useState, type PointerEvent, type ReactNode } from "react";

/* ==========================================================================
   Gráficos de las capas de datos (skill dataviz):
   - Énfasis: un solo color (óxido #d2542a) para el dato que importa, gris para el contexto.
     Paleta validada contra la superficie oscura #141212 (contraste ≥ 3:1, CVD ΔE 8.1).
   - Barras ≤ 24 px, extremo redondeado 4 px, base recta; rejilla de 1 px recesiva.
   - Etiquetas directas en cada barra, tooltip al pasar el puntero y tabla con los datos.
   ========================================================================== */

interface Tip { x: number; y: number; text: string }

function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const bind = (text: string) => ({
    onPointerMove: (e: PointerEvent<Element>) => {
      const box = (e.currentTarget as Element).closest(".chart")!.getBoundingClientRect();
      setTip({ x: e.clientX - box.left, y: e.clientY - box.top, text });
    },
    onPointerLeave: () => setTip(null),
  });
  const node = tip && (
    <div className="chart-tip" role="presentation" style={{ left: tip.x, top: tip.y }}>{tip.text}</div>
  );
  return { bind, node };
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="chart-table">
      <summary>Ver datos</summary>
      <table>
        <caption>{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={String(r[0])}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
      </table>
    </details>
  );
}

export function ChartFrame({ title, sources, children }: { title: string; sources: string; children: ReactNode }) {
  return (
    <figure className="chart-frame">
      <figcaption>{title}</figcaption>
      {children}
      <p className="chart-src">Fuentes: {sources}</p>
    </figure>
  );
}

/* ---------- Barras horizontales con énfasis ---------- */
interface BarRow { label: string; value: number; emphasis?: boolean; note?: string }
export function BarChart({ rows, unit, digits = 2, caption }: { rows: BarRow[]; unit: string; digits?: number; caption: string }) {
  const { bind, node } = useTip();
  const max = Math.max(...rows.map((r) => r.value));
  const fmt = (v: number) => v.toLocaleString("es", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return (
    <>
      <div className="chart bars">
        {rows.map((r) => (
          <div key={r.label} className="bar-row" {...bind(`${r.label}: ${fmt(r.value)} ${unit}`)}>
            <span className="bar-label">{r.label}</span>
            <span className="bar-track">
              <span className="bar" data-emphasis={!!r.emphasis} style={{ width: `${(r.value / max) * 100}%` }} />
            </span>
            <span className="bar-value">{fmt(r.value)} <small>{unit}</small>{r.note && <em>{r.note}</em>}</span>
          </div>
        ))}
        {node}
      </div>
      <DataTable caption={caption} head={["", unit]} rows={rows.map((r) => [r.label, fmt(r.value)])} />
    </>
  );
}

/* ---------- Metano: rango estacional, media ± σ y picos en escala logarítmica ---------- */
export function MethaneChart({ m }: { m: { mean: number; sd: number; seasonalMin: number; seasonalMax: number; spike: number } }) {
  const { bind, node } = useTip();
  const lo = Math.log10(0.1), hi = Math.log10(10);
  const x = (v: number) => `${((Math.log10(v) - lo) / (hi - lo)) * 100}%`;
  const ticks = [0.1, 0.3, 1, 3, 10];
  return (
    <>
      <div className="chart methane">
        <div className="m-plot">
          {ticks.map((t) => <span key={t} className="m-grid" style={{ left: x(t) }} />)}
          <span className="m-band" style={{ left: x(m.seasonalMin), width: `calc(${x(m.seasonalMax)} - ${x(m.seasonalMin)})` }}
            {...bind(`Ciclo estacional: ${m.seasonalMin}–${m.seasonalMax} ppbv`)} />
          <span className="m-err" style={{ left: x(m.mean - m.sd), width: `calc(${x(m.mean + m.sd)} - ${x(m.mean - m.sd)})` }} />
          <span className="m-dot m-mean" style={{ left: x(m.mean) }} {...bind(`Fondo medio: ${m.mean} ± ${m.sd} ppbv`)} />
          <span className="m-dot m-spike" style={{ left: x(m.spike) }} {...bind(`Picos: ~${m.spike} ppbv`)} />
          <span className="m-lab" style={{ left: x(m.mean) }}>Fondo {m.mean} ± {m.sd}</span>
          <span className="m-lab m-lab-up" style={{ left: x(Math.sqrt(m.seasonalMin * m.seasonalMax)) }}>Estaciones {m.seasonalMin}–{m.seasonalMax}</span>
          <span className="m-lab" style={{ left: x(m.spike) }}>Picos ~{m.spike}</span>
        </div>
        <div className="m-axis">{ticks.map((t) => <span key={t} style={{ left: x(t) }}>{t}</span>)}</div>
        <p className="m-unit">ppbv · escala logarítmica</p>
        {node}
      </div>
      <DataTable caption="Metano en Gale (ppbv)" head={["Medida", "ppbv"]} rows={[
        ["Fondo medio", `${m.mean} ± ${m.sd}`], ["Ciclo estacional", `${m.seasonalMin}–${m.seasonalMax}`], ["Picos", `~${m.spike}`],
      ]} />
    </>
  );
}

/* ---------- Columna estratigráfica (esquema: orden de capas, sin espesores) ---------- */
export function StrataChart({ strata, km }: { strata: { name: string; note: string }[]; km: number }) {
  return (
    <div className="chart strata">
      <div className="s-axis"><span>~{km} km<br />más nuevas</span><span>0<br />más viejas</span></div>
      <ol className="s-col">
        {[...strata].reverse().map((s, i) => (
          <li key={s.name} data-emphasis={i === 0}>
            <b>{s.name}</b><span>{s.note}</span>
          </li>
        ))}
      </ol>
      <p className="m-unit">Esquema: orden de las capas al subir, no su espesor</p>
    </div>
  );
}

/* ---------- Elementos de la vida medidos en Yellowknife Bay ---------- */
export function ElementsChart({ items }: { items: { symbol: string; name: string; status: string }[] }) {
  const measured = items.filter((e) => e.status === "medido").length;
  return (
    <div className="chart elements">
      <p className="el-head"><b>{measured} de {items.length}</b> elementos clave medidos directamente</p>
      <ul>
        {items.map((e) => (
          <li key={e.symbol} data-status={e.status}>
            <b>{e.symbol}</b><span>{e.name}</span><small>{e.status === "medido" ? "✓ medido" : "◌ inferido"}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Línea de tiempo ---------- */
export function Timeline({ items }: { items: { date: string; label: string; src: string }[] }) {
  return (
    <ol className="chart timeline">
      {items.map((t) => (
        <li key={t.date}><time>{t.date}</time><span>{t.label}</span><small>{t.src}</small></li>
      ))}
    </ol>
  );
}

/* ---------- Fila de cifras (stat tiles) ---------- */
export function Kpis({ items }: { items: { value: string; label: string }[] }) {
  return (
    <dl className="kpis">
      {items.map((k) => <div key={k.label}><dt>{k.label}</dt><dd>{k.value}</dd></div>)}
    </dl>
  );
}

/* ---------- Rango sobre una escala (meter) ---------- */
export function RangeMeter({ min, max, scale, unit, label }: { min: number; max: number; scale: number; unit: string; label: string }) {
  const { bind, node } = useTip();
  return (
    <div className="chart meter">
      <p className="meter-label">{label} <b>{min}–{max} {unit}</b></p>
      <div className="meter-track">
        <span className="meter-fill" style={{ left: `${(min / scale) * 100}%`, width: `${((max - min) / scale) * 100}%` }}
          {...bind(`${label}: ${min}–${max} ${unit}`)} />
      </div>
      <div className="meter-axis"><span>0</span><span>{scale} {unit}</span></div>
      {node}
    </div>
  );
}
