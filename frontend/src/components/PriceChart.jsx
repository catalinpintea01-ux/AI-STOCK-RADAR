import { useMemo, useRef, useState } from "react";

// Grafic de preț în stilul brokerilor moderni: linie + umplere gradient,
// verde/roșu după direcția intervalului, crosshair la hover cu preț și dată.
// SVG pur — zero dependențe de charting.
const W = 720;
const H = 220;
const PAD_TOP = 14;
const PAD_BOTTOM = 6;

export default function PriceChart({ istoric }) {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const { path, areaPath, puncte, min, max, crestere } = useMemo(() => {
    if (!istoric || istoric.length < 2) return { puncte: [] };
    const valori = istoric.map((p) => p.pret);
    const min = Math.min(...valori);
    const max = Math.max(...valori);
    const interval = max - min || 1;
    const puncte = istoric.map((p, i) => ({
      x: (i / (istoric.length - 1)) * W,
      y: PAD_TOP + (1 - (p.pret - min) / interval) * (H - PAD_TOP - PAD_BOTTOM),
      ...p,
    }));
    const path = puncte.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("");
    const areaPath = `${path}L${W},${H}L0,${H}Z`;
    return { path, areaPath, puncte, min, max, crestere: valori[valori.length - 1] >= valori[0] };
  }, [istoric]);

  if (!istoric || istoric.length < 2) {
    return <p className="chart-empty">Istoricul de preț se acumulează — revino curând.</p>;
  }

  const culoare = crestere ? "#2e7d5b" : "#bf4438";
  const gradId = crestere ? "chart-grad-up" : "chart-grad-down";
  const hover = hoverIdx !== null ? puncte[hoverIdx] : null;

  function handleMove(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * W;
    const idx = Math.round((x / W) * (puncte.length - 1));
    setHoverIdx(Math.max(0, Math.min(puncte.length - 1, idx)));
  }

  return (
    <div className="price-chart-wrap">
      <div className="price-chart-hover-info">
        {hover ? (
          <>
            <strong>${hover.pret.toFixed(2)}</strong>
            <span className="muted">
              {new Date(hover.t).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </>
        ) : (
          <span className="muted">
            Interval: ${min.toFixed(2)} – ${max.toFixed(2)}
          </span>
        )}
      </div>
      <svg
        ref={svgRef}
        className="price-chart"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchMove={handleMove}
        onTouchEnd={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="chart-grad-up" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e7d5b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2e7d5b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="chart-grad-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bf4438" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#bf4438" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={path} fill="none" stroke={culoare} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" pathLength="1" className="price-chart-line" />
        {hover && (
          <>
            <line x1={hover.x} y1={PAD_TOP} x2={hover.x} y2={H} stroke="#9d968a" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
            <circle cx={hover.x} cy={hover.y} r="4.5" fill={culoare} stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  );
}
