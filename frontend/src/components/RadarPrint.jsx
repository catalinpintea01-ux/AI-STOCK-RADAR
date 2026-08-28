import { useEffect, useState } from "react";
import { useLang } from "../i18n/index.jsx";

// "Amprenta Radar" — graficul-păianjen al celor 4 sub-scoruri, semnătura
// vizuală a analizei (echivalentul nostru pentru Snowflake-ul de la SWS).
// Axa de risc e inversată ("Siguranță" = 100 − risc), ca forma să citească
// mereu la fel: mai mare = tablou mai solid. Pur descriptiv.
const AXE = [
  { cheie: "analisti", scor: (s) => s.analisti },
  { cheie: "momentum", scor: (s) => s.momentum },
  { cheie: "fundamental", scor: (s) => s.fundamental },
  { cheie: "siguranta", scor: (s) => 100 - s.risc },
];

export default function RadarPrint({ analisti, momentum, fundamental, risc, size = 210 }) {
  const { t } = useLang();
  const scoruri = { analisti, momentum, fundamental, risc };

  const c = size / 2;
  const R = size * 0.33;

  function punct(valoare, idx, raza = R) {
    const unghi = (Math.PI / 2) * idx - Math.PI / 2; // sus, dreapta, jos, stânga
    const r = (valoare / 100) * raza;
    return [c + r * Math.cos(unghi), c + r * Math.sin(unghi)];
  }

  // Animăm forma de la centru spre valorile reale la montare.
  const [factor, setFactor] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setFactor(1));
    return () => cancelAnimationFrame(id);
  }, []);

  const poligon = AXE.map((axa, i) =>
    punct(Math.max(4, axa.scor(scoruri) * factor), i)
      .map((n) => n.toFixed(1))
      .join(",")
  ).join(" ");

  const etichete = AXE.map((axa, i) => {
    const [x, y] = punct(128, i);
    const ancora = i === 1 ? "start" : i === 3 ? "end" : "middle";
    return { x, y: i === 0 ? y + 2 : i === 2 ? y + 6 : y + 3, ancora, text: t(`screens.${axa.cheie}`), valoare: axa.scor(scoruri) };
  });

  return (
    <svg
      className="radar-print"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={AXE.map((a) => `${t(`screens.${a.cheie}`)} ${a.scor(scoruri)}/100`).join(", ")}
    >
      {[25, 50, 75, 100].map((g) => (
        <polygon
          key={g}
          points={AXE.map((_, i) => punct(g, i).map((n) => n.toFixed(1)).join(",")).join(" ")}
          className="radar-print-grila"
        />
      ))}
      {AXE.map((_, i) => {
        const [x, y] = punct(100, i);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} className="radar-print-axa" />;
      })}
      <polygon points={poligon} className="radar-print-forma" />
      {AXE.map((axa, i) => {
        const [x, y] = punct(Math.max(4, axa.scor(scoruri) * factor), i);
        return <circle key={i} cx={x} cy={y} r="3.2" className="radar-print-punct" />;
      })}
      {etichete.map((e) => (
        <text key={e.text} x={e.x} y={e.y} textAnchor={e.ancora} className="radar-print-eticheta">
          {e.text} · {e.valoare}
        </text>
      ))}
    </svg>
  );
}
