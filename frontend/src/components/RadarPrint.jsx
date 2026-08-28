import { useEffect, useState } from "react";
import { useLang } from "../i18n/index.jsx";

// "Amprenta Radar" — graficul-păianjen al celor 4 sub-scoruri, semnătura
// vizuală a analizei. Axa de risc e inversată ("Siguranță" = 100 − risc),
// ca forma să citească mereu la fel: mai mare = tablou mai solid.
// Canvas-ul e mai lat decât pânza: etichetele laterale au coloană proprie
// și nu mai sunt tăiate de marginea SVG-ului.
const AXE = [
  { cheie: "analisti", scor: (s) => s.analisti },
  { cheie: "momentum", scor: (s) => s.momentum },
  { cheie: "fundamental", scor: (s) => s.fundamental },
  { cheie: "siguranta", scor: (s) => 100 - s.risc },
];

export default function RadarPrint({ analisti, momentum, fundamental, risc, size = 220 }) {
  const { t } = useLang();
  const scoruri = { analisti, momentum, fundamental, risc };

  const MARGINE = 104; // loc pentru etichetele din stânga/dreapta
  const W = size + MARGINE * 2;
  const H = size + 40;
  const cx = W / 2;
  const cy = H / 2;
  const R = size * 0.42;

  function punct(valoare, idx, raza = R) {
    const unghi = (Math.PI / 2) * idx - Math.PI / 2; // sus, dreapta, jos, stânga
    const r = (valoare / 100) * raza;
    return [cx + r * Math.cos(unghi), cy + r * Math.sin(unghi)];
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

  // Etichete: sus/jos centrate, stânga/dreapta în coloanele laterale.
  const etichete = [
    { x: cx, y: cy - R - 12, ancora: "middle" },
    { x: cx + R + 12, y: cy + 4, ancora: "start" },
    { x: cx, y: cy + R + 20, ancora: "middle" },
    { x: cx - R - 12, y: cy + 4, ancora: "end" },
  ].map((pozitie, i) => ({
    ...pozitie,
    text: t(`screens.${AXE[i].cheie}`),
    valoare: AXE[i].scor(scoruri),
  }));

  return (
    <svg
      className="radar-print"
      viewBox={`0 0 ${W} ${H}`}
      style={{ maxWidth: W }}
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
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="radar-print-axa" />;
      })}
      <polygon points={poligon} className="radar-print-forma" />
      {AXE.map((axa, i) => {
        const [x, y] = punct(Math.max(4, axa.scor(scoruri) * factor), i);
        return <circle key={i} cx={x} cy={y} r="3.5" className="radar-print-punct" />;
      })}
      {etichete.map((e) => (
        <text key={e.text} x={e.x} y={e.y} textAnchor={e.ancora} className="radar-print-eticheta">
          {e.text} <tspan className="radar-print-valoare">{e.valoare}</tspan>
        </text>
      ))}
    </svg>
  );
}
