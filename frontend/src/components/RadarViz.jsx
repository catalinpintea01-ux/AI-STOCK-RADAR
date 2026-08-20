// Radar animat, pur CSS — vizualul de brand al aplicației. Blip-urile și
// simbolurile sunt decorative (aria-hidden), nu date live.
const BLIPS = [
  { top: "20%", left: "60%", label: "AAPL", delay: "0s" },
  { top: "50%", left: "24%", label: "NVDA", delay: "1.1s" },
  { top: "68%", left: "58%", label: "TSLA", delay: "2s" },
  { top: "36%", left: "42%", label: "", delay: "2.8s" },
];

export default function RadarViz({ size = 280, showLabels = true }) {
  return (
    <div className="radar-viz" style={{ width: size, height: size }} aria-hidden="true">
      <div className="radar-viz-ring r1" />
      <div className="radar-viz-ring r2" />
      <div className="radar-viz-ring r3" />
      <div className="radar-viz-cross-h" />
      <div className="radar-viz-cross-v" />
      <div className="radar-viz-sweep" />
      {BLIPS.map((b, i) => (
        <div key={i} className="radar-viz-blip" style={{ top: b.top, left: b.left, animationDelay: b.delay }}>
          {showLabels && size >= 180 && b.label && <span className="radar-viz-blip-label">{b.label}</span>}
        </div>
      ))}
    </div>
  );
}
