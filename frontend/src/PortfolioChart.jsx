const INITIAL_CASH = 10000;

// Reconstruiește evoluția valorii portofoliului din istoricul tranzacțiilor.
// Pentru simplitate, valoarea deținerilor la fiecare pas folosește ultimul preț
// tranzacționat al fiecărui simbol (nu prețul de piață din acel moment) —
// doar ultimul punct ("Acum") folosește prețurile live curente.
export function buildValueHistory(portfolio, currentTotalValue) {
  const txs = [...portfolio.transactions].sort((a, b) => new Date(a.data) - new Date(b.data));

  let cash = INITIAL_CASH;
  const heldQty = {};
  const lastPrice = {};
  const points = [{ label: "Start", value: INITIAL_CASH }];

  for (const tx of txs) {
    const semn = tx.tip === "cumparare" ? 1 : -1;
    heldQty[tx.simbol] = (heldQty[tx.simbol] || 0) + semn * tx.cantitate;
    lastPrice[tx.simbol] = tx.pret;
    cash -= semn * tx.pret * tx.cantitate;

    const holdingsValue = Object.entries(heldQty).reduce(
      (sum, [simbol, qty]) => sum + qty * (lastPrice[simbol] || 0),
      0
    );
    points.push({ label: tx.simbol, value: cash + holdingsValue });
  }

  points.push({ label: "Acum", value: currentTotalValue });
  return points;
}

export function PortfolioChart({ points }) {
  const width = 320;
  const height = 90;
  const padding = 6;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x =
      points.length === 1 ? width / 2 : padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
    return [x, y];
  });

  const lineD = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaD = `${lineD} L${coords[coords.length - 1][0].toFixed(1)},${height} L${coords[0][0].toFixed(1)},${height} Z`;

  const isUp = values[values.length - 1] >= values[0];
  const colorClass = isUp ? "up" : "down";

  return (
    <svg
      className="portfolio-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Evoluția valorii portofoliului"
    >
      <path d={areaD} className={`chart-area chart-area-${colorClass}`} />
      <path d={lineD} className={`chart-line chart-line-${colorClass}`} fill="none" />
    </svg>
  );
}
