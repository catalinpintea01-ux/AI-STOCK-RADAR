const VERDICT_INFO = {
  optimist: { label: "Sentiment AI: optimist", className: "verdict-optimist" },
  neutru: { label: "Sentiment AI: neutru", className: "verdict-neutru" },
  rezervat: { label: "Sentiment AI: rezervat", className: "verdict-rezervat" },
};

export default function VerdictBadge({ verdict, incredere }) {
  const info = VERDICT_INFO[verdict] || VERDICT_INFO.neutru;

  return (
    <div className={`verdict-badge ${info.className}`}>
      <span>
        <span className={`vdot vdot-${verdict}`} /> {info.label}
      </span>
      {incredere && <span className="verdict-confidence">Încredere: {incredere}</span>}
    </div>
  );
}
