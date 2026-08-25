import { useEffect, useState } from "react";
import { api } from "../api";
import Disclaimer from "../components/Disclaimer.jsx";
import { Star } from "lucide-react";
import { track } from "@vercel/analytics";

// Paywall cu propunere de valoare explicită: utilizatorul vede EXACT ce
// primește în plus înainte să plătească — nu doar un buton "Premium".
// Toate diferențele listate sunt reale, aplicate server-side (402).
const RANDURI = [
  { functie: "Acțiuni urmărite în radar", gratuit: "3", premium: "Nelimitat" },
  { functie: "Scoruri AI complete (4 sub-scoruri + verdict + factori)", gratuit: true, premium: true },
  { functie: "Digest zilnic cu schimbările importante", gratuit: true, premium: true },
  { functie: "Știri analizate AI pe zi", gratuit: "3", premium: "7" },
  { functie: "Research zilnic (creșteri + scăderi)", gratuit: "2 + 2", premium: "4 + 4" },
  { functie: "Portofoliu virtual de 10.000 USD", gratuit: true, premium: true },
  { functie: "Calendar de raportări", gratuit: true, premium: true },
  { functie: "Top scoruri AI din tot universul", gratuit: true, premium: true },
  { functie: "Screener AI (verdict / sector / scor / sortare)", gratuit: false, premium: true },
  { functie: "Comparator A vs B (scoruri + preț, față în față)", gratuit: false, premium: true },
  { functie: "Onboarding pe interese cu 10 acțiuni dintr-o dată", gratuit: "până la limita de 3", premium: true },
];

function Celula({ valoare }) {
  if (valoare === true) return <span className="premium-check">✓</span>;
  if (valoare === false) return <span className="premium-lock">—</span>;
  return <span className="premium-text">{valoare}</span>;
}

export default function Premium() {
  const [premium, setPremium] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getBillingStatus()
      .then((data) => setPremium(data.premium))
      .catch(() => setPremium(false));
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    try {
      track("start_trial");
      const data = await api.createCheckoutSession();
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    setError("");
    try {
      const data = await api.openBillingPortal();
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="portfolio-page premium-page">
      <h1 className="page-title">Planuri și prețuri</h1>
      <p className="cash">
        Tot ce ține de învățare rămâne gratuit. Premium adaugă instrumentele de research avansat și
        un radar fără limite.
      </p>

      {premium === true && (
        <div className="premium-active-banner">
          <Star size={14} className="ic" /> Ai abonamentul <strong>Premium activ</strong> — toate instrumentele sunt deblocate.
          <button className="logout" onClick={handleManage} disabled={loading}>
            {loading ? "..." : "Gestionează abonamentul"}
          </button>
        </div>
      )}

      <section className="holdings premium-table-wrap">
        <table className="premium-table">
          <thead>
            <tr>
              <th></th>
              <th>
                Gratuit
                <span className="premium-price">0 RON</span>
              </th>
              <th className="premium-col">
                <Star size={13} className="ic" /> Premium
                <span className="premium-price">3 zile gratuit, apoi 29,99 RON/lună</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {RANDURI.map((r) => (
              <tr key={r.functie}>
                <th>{r.functie}</th>
                <td>
                  <Celula valoare={r.gratuit} />
                </td>
                <td className="premium-col">
                  <Celula valoare={r.premium} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {premium === false && (
          <div className="premium-cta-row">
            <img src="/mascota/sarbatoreste.png" alt="" className="mascota mascota-premium" loading="lazy" />
            <button className="landing-cta" onClick={handleUpgrade} disabled={loading}>
              {loading ? "Se deschide activarea..." : <><Star size={14} className="ic" /> Începe cu 3 zile gratuit →</>}
            </button>
            <p className="muted premium-note">
              Cardul se introduce la activare, prin Stripe · Primele 3 zile sunt gratuite, apoi
              abonamentul continuă automat cu 29,99 RON/lună · Anulezi oricând în perioada de
              probă și nu plătești nimic
            </p>
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </section>

      <Disclaimer />
    </div>
  );
}
