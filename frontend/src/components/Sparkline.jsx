const WIDTH = 56;
const HEIGHT = 24;

// Necesită cel puțin 2 puncte — istoricul se acumulează zi de zi (nu există
// OHLC istoric gratuit de la Finnhub), deci primele zile pot să nu aibă
// destule puncte încă. Randăm nimic în loc de un grafic înșelător.
export default function Sparkline({ puncte }) {
  if (!Array.isArray(puncte) || puncte.length < 2) return null;

  const min = Math.min(...puncte);
  const max = Math.max(...puncte);
  const interval = max - min || 1;

  const coords = puncte.map((p, i) => {
    const x = (i / (puncte.length - 1)) * WIDTH;
    const y = HEIGHT - ((p - min) / interval) * HEIGHT;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const culoare = puncte[puncte.length - 1] >= puncte[0] ? "#16a34a" : "#dc2626";

  return (
    <svg className="sparkline" width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <polyline
        className="sparkline-line"
        points={coords.join(" ")}
        pathLength="1"
        fill="none"
        stroke={culoare}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
