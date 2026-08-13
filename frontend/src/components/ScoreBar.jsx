export default function ScoreBar({ label, score }) {
  return (
    <div className="score-bar">
      <div className="score-bar-label">
        <span>{label}</span>
        <span>{score}/100</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
