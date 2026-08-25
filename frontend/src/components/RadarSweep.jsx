// Fundalul de radar al hero-urilor: inele aurii + fascicul rotativ lent (16s)
// și tickere care "se aprind" când trece fasciculul peste ele (delay-ul
// fiecărui blip = unghi/360 × 16s). Pur decorativ — doar simboluri reale,
// fără cifre inventate. Folosit pe landing și pe dashboard-ul logat.
const BLIPS_IMPLICITE = [
  { sym: "NVDA", top: "22%", left: "58%", delay: "1.1s" },
  { sym: "AAPL", top: "34%", left: "30%", delay: "13.4s" },
  { sym: "TSLA", top: "58%", left: "24%", delay: "10.8s" },
  { sym: "MSFT", top: "70%", left: "56%", delay: "7.4s" },
  { sym: "AMZN", top: "48%", left: "72%", delay: "3.8s" },
  { sym: "META", top: "26%", left: "76%", delay: "2.4s" },
];

export default function RadarSweep({ blips = BLIPS_IMPLICITE }) {
  return (
    <div className="mega-hero-radar" aria-hidden="true">
      <div className="mh-ring mh-r1" />
      <div className="mh-ring mh-r2" />
      <div className="mh-ring mh-r3" />
      <div className="mh-cross-h" />
      <div className="mh-cross-v" />
      <div className="mh-sweep" />
      {blips.map((b) => (
        <span key={b.sym} className="mh-blip" style={{ top: b.top, left: b.left, animationDelay: b.delay }}>
          <i />
          {b.sym}
        </span>
      ))}
    </div>
  );
}
