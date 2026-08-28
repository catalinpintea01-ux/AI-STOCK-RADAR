// Donut de alocare pe sectoare — analytics-ul vizual în stil Revolut/SWS:
// segmente SVG pastelate + legendă cu procente. Pur decorativ-descriptiv.
const CULORI_SECTOR = {
  Tehnologie: "#8a6d4e",
  Financiar: "#5f5b52",
  Sănătate: "#c9ab77",
  Consum: "#b0563a",
  Energie: "#7a4a3a",
  Industrial: "#9b8f7d",
  Telecom: "#42403a",
  Altele: "#beb6a6",
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
      // sectorCheie = numele original (românesc) al sectorului, folosit pentru
      // culoare; `sector` poate veni deja tradus în limba interfeței.
      culoare: CULORI_SECTOR[a.sectorCheie || a.sector] || CULORI_SECTOR.Altele,
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
