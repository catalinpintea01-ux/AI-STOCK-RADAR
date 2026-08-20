import { useEffect, useState } from "react";

const VERDICT_COLOR = {
  optimist: "#2563eb",
  neutru: "#6b7280",
  rezervat: "#c2410c",
};

const RADIUS = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ScoreRing({ score, verdict }) {
  const culoare = VERDICT_COLOR[verdict] || VERDICT_COLOR.neutru;
  const progresTarget = Math.max(0, Math.min(100, score));

  // Pornim de la 0 și trecem la valoarea reală un frame mai târziu, ca CSS
  // transition-ul pe stroke-dashoffset să aibă de la ce animat — dacă am
  // seta direct valoarea finală, React ar picta-o gata umplută.
  const [progres, setProgres] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setProgres(progresTarget));
    return () => cancelAnimationFrame(id);
  }, [progresTarget]);

  const dashoffset = CIRCUMFERENCE * (1 - progres / 100);

  return (
    <svg className="score-ring" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={RADIUS} fill="none" stroke="#e7eef0" strokeWidth="4" />
      <circle
        className="score-ring-fill"
        cx="18"
        cy="18"
        r={RADIUS}
        fill="none"
        stroke={culoare}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashoffset}
        transform="rotate(-90 18 18)"
      />
      <text x="18" y="19" textAnchor="middle" dominantBaseline="middle" fontSize="10.5" fontWeight="700" fill={culoare}>
        {progresTarget}
      </text>
    </svg>
  );
}
