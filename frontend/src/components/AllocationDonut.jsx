// Donut de alocare pe sectoare — analytics-ul vizual în stil Revolut/SWS:
// segmente SVG pastelate + legendă cu procente. Pur decorativ-descriptiv.
const CULORI_SECTOR = {
  Tehnologie: "#6366f1",
  Financiar: "#0ea5e9",
  Sănătate: "#10b981",
  Consum: "#f59e0b",
  Energie: "#ef4444",
  Industrial: "#8b5cf6",
  Telecom: "#14b8a6",
  Altele: "#94a3b8",
};

const R = 44;
const CIRC = 2 * Math.PI * R;

export default function AllocationDonut({ alocari }) {
  // alocari: [{ sector, valoare }] — agregate deja de apelant
  const total = alocari.reduce((s, a) => s + a.valoare, 0);
  if (total <= 0 || alocari.length === 0) return null;

  const sortate = [...alocari].sort((a, b) => b.valoare - a.valoare);
  let offset = 0;
  const segmente = sortate.map((a) => {
    const fractie = a.valoare / total;
    const seg = {
      ...a,
      fractie,
      dash: `${(fractie * CIRC).toFixed(2)} ${CIRC.toFixed(2)}`,
      offset: (-offset * CIRC).toFixed(2),
      culoare: CULORI_SECTOR[a.sector] || CULORI_SECTOR.Altele,
    };
    offset += fractie;
    return seg;
  });

  return (
    <div className="alloc-wrap">
      <svg viewBox="0 0 110 110" className="alloc-donut" aria-hidden="true">
        {segmente.map((s) => (
          <circle
            key={s.sector}
            cx="55"
            cy="55"
            r={R}
            fill="none"
            stroke={s.culoare}
            strokeWidth="13"
            strokeDasharray={s.dash}
            strokeDashoffset={s.offset}
            transform="rotate(-90 55 55)"
          />
        ))}
        <text x="55" y="52" textAnchor="middle" className="alloc-center-nr">
          {sortate.length}
        </text>
        <text x="55" y="66" textAnchor="middle" className="alloc-center-label">
          {sortate.length === 1 ? "sector" : "sectoare"}
        </text>
      </svg>
      <ul className="alloc-legend">
        {segmente.map((s) => (
          <li key={s.sector}>
            <span className="alloc-dot" style={{ background: s.culoare }} />
            <span className="alloc-sector">{s.sector}</span>
            <span className="alloc-pct">{Math.round(s.fractie * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
