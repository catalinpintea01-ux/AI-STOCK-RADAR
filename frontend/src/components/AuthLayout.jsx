const TRUST_POINTS = [
  { icon: "📡", text: "Scor AI recalculat automat pentru fiecare acțiune urmărită" },
  { icon: "📰", text: "Context zilnic din piețele bursiere, tradus și explicat" },
  { icon: "🛡️", text: "Conținut educațional — niciodată recomandări de cumpărare sau vânzare" },
];

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <h1 className="auth-brand-title">AI Stock Radar</h1>
          <p className="auth-brand-tagline">
            Urmărește acțiuni, primești context AI zilnic despre ele și exersează pe un portofoliu virtual — fără risc real.
          </p>
          <ul className="auth-brand-points">
            {TRUST_POINTS.map((p) => (
              <li key={p.text}>
                <span className="auth-brand-icon">{p.icon}</span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="auth-form-panel">{children}</div>
    </div>
  );
}
