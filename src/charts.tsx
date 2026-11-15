import { useState, type PointerEvent, type ReactNode } from "react";
import { useLocale, useT, type Bi } from "./i18n";
import { useBi } from "./i18n";

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
  const t = useT();
  return (
    <details className="chart-table">
      <summary>{t("Ver datos", "View data")}</summary>
      <table>
        <caption>{caption}</caption>
        <thead><tr>{head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={String(r[0])}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
      </table>
    </details>
  );
}

export function ChartFrame({ title, sources, children }: { title: string; sources: string; children: ReactNode }) {
  const t = useT();
  return (
    <figure className="chart-frame">
      <figcaption>{title}</figcaption>
      {children}
      <p className="chart-src">{t("Fuentes", "Sources")}: {sources}</p>
    </figure>
  );
}

/* ---------- Barras horizontales con énfasis ---------- */
interface BarRow { label: Bi | string; value: number; emphasis?: boolean; note?: Bi }
export function BarChart({ rows, unit, digits = 2, caption }: { rows: BarRow[]; unit: string; digits?: number; caption: string }) {
  const { bind, node } = useTip();
  const bi = useBi();
  const locale = useLocale();
  const name = (l: Bi | string) => (typeof l === "string" ? l : bi(l));
  const max = Math.max(...rows.map((r) => r.value));
  const fmt = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return (
    <>
      <div className="chart bars">
        {rows.map((r) => (
          <div key={name(r.label)} className="bar-row" {...bind(`${name(r.label)}: ${fmt(r.value)} ${unit}`)}>
            <span className="bar-label">{name(r.label)}</span>
            <span className="bar-track">
              <span className="bar" data-emphasis={!!r.emphasis} style={{ width: `${(r.value / max) * 100}%` }} />
            </span>
            <span className="bar-value">{fmt(r.value)} <small>{unit}</small>{r.note && <em>{bi(r.note)}</em>}</span>
          </div>
        ))}
        {node}
      </div>
      <DataTable caption={caption} head={["", unit]} rows={rows.map((r) => [name(r.label), fmt(r.value)])} />
    </>
  );
}

/* ---------- Metano: rango estacional, media ± σ y picos en escala logarítmica ---------- */
export function MethaneChart({ m }: { m: { mean: number; sd: number; seasonalMin: number; seasonalMax: number; spike: number } }) {
  const { bind, node } = useTip();
  const t = useT();
  const lo = Math.log10(0.1), hi = Math.log10(10);
  const x = (v: number) => `${((Math.log10(v) - lo) / (hi - lo)) * 100}%`;
  const ticks = [0.1, 0.3, 1, 3, 10];
  return (
    <>
      <div className="chart methane">
        <div className="m-plot">
          {ticks.map((k) => <span key={k} className="m-grid" style={{ left: x(k) }} />)}
          <span className="m-band" style={{ left: x(m.seasonalMin), width: `calc(${x(m.seasonalMax)} - ${x(m.seasonalMin)})` }}
            {...bind(`${t("Ciclo estacional", "Seasonal cycle")}: ${m.seasonalMin}–${m.seasonalMax} ppbv`)} />
          <span className="m-err" style={{ left: x(m.mean - m.sd), width: `calc(${x(m.mean + m.sd)} - ${x(m.mean - m.sd)})` }} />
          <span className="m-dot m-mean" style={{ left: x(m.mean) }} {...bind(`${t("Fondo medio", "Mean background")}: ${m.mean} ± ${m.sd} ppbv`)} />
          <span className="m-dot m-spike" style={{ left: x(m.spike) }} {...bind(`${t("Picos", "Spikes")}: ~${m.spike} ppbv`)} />
          <span className="m-lab" style={{ left: x(m.mean) }}>{t("Fondo", "Background")} {m.mean} ± {m.sd}</span>
          <span className="m-lab m-lab-up" style={{ left: x(Math.sqrt(m.seasonalMin * m.seasonalMax)) }}>{t("Estaciones", "Seasons")} {m.seasonalMin}–{m.seasonalMax}</span>
          <span className="m-lab" style={{ left: x(m.spike) }}>{t("Picos", "Spikes")} ~{m.spike}</span>
        </div>
        <div className="m-axis">{ticks.map((k) => <span key={k} style={{ left: x(k) }}>{k}</span>)}</div>
        <p className="m-unit">{t("ppbv · escala logarítmica", "ppbv · logarithmic scale")}</p>
        {node}
      </div>
      <DataTable caption={t("Metano en Gale (ppbv)", "Methane at Gale (ppbv)")} head={[t("Medida", "Measure"), "ppbv"]} rows={[
        [t("Fondo medio", "Mean background"), `${m.mean} ± ${m.sd}`],
        [t("Ciclo estacional", "Seasonal cycle"), `${m.seasonalMin}–${m.seasonalMax}`],
        [t("Picos", "Spikes"), `~${m.spike}`],
      ]} />
    </>
  );
}

/* ---------- Columna estratigráfica (esquema: orden de capas, sin espesores) ---------- */
export function StrataChart({ strata, km }: { strata: { name: Bi; note: Bi }[]; km: number }) {
  const t = useT();
  const bi = useBi();
  return (
    <div className="chart strata">
      <div className="s-axis"><span>~{km} km<br />{t("más nuevas", "newest")}</span><span>0<br />{t("más viejas", "oldest")}</span></div>
      <ol className="s-col">
        {[...strata].reverse().map((s, i) => (
          <li key={s.name.en} data-emphasis={i === 0}>
            <b>{bi(s.name)}</b><span>{bi(s.note)}</span>
          </li>
        ))}
      </ol>
      <p className="m-unit">{t("Esquema: orden de las capas al subir, no su espesor", "Schematic: order of the layers going up, not their thickness")}</p>
    </div>
  );
}

/* ---------- Elementos de la vida medidos en Yellowknife Bay ---------- */
export function ElementsChart({ items }: { items: { symbol: string; name: Bi; status: string }[] }) {
  const t = useT();
  const bi = useBi();
  const measured = items.filter((e) => e.status === "measured").length;
  return (
    <div className="chart elements">
      <p className="el-head"><b>{measured} {t("de", "of")} {items.length}</b> {t("elementos clave medidos directamente", "key elements measured directly")}</p>
      <ul>
        {items.map((e) => (
          <li key={e.symbol} data-status={e.status}>
            <b>{e.symbol}</b><span>{bi(e.name)}</span>
            <small>{e.status === "measured" ? t("✓ medido", "✓ measured") : t("◌ inferido", "◌ inferred")}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Línea de tiempo ---------- */
export function Timeline({ items }: { items: { date: Bi; label: Bi; src: string }[] }) {
  const bi = useBi();
  return (
    <ol className="chart timeline">
      {items.map((t) => (
        <li key={t.date.en}><time>{bi(t.date)}</time><span>{bi(t.label)}</span><small>{t.src}</small></li>
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
