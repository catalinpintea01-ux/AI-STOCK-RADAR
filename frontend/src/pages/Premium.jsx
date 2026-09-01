import { useEffect, useState } from "react";
import { api } from "../api";
import Disclaimer from "../components/Disclaimer.jsx";
import { Star } from "lucide-react";
import { track } from "@vercel/analytics";
import { useTraduse } from "../i18n/useTraduse.js";

// Paywall cu propunere de valoare explicită: utilizatorul vede EXACT ce
// primește în plus înainte să plătească — nu doar un buton "Premium".
// Toate diferențele listate sunt reale, aplicate server-side (402).
const RANDURI = [
  { cheie: "r0", gratuit: "3", premium: "nelimitat" },
  { cheie: "r1", gratuit: true, premium: true },
  { cheie: "r2", gratuit: true, premium: true },
  { cheie: "r3", gratuit: "2", premium: "7" },
  { cheie: "r4", gratuit: "1 + 1", premium: "5 + 5" },
  { cheie: "r5", gratuit: true, premium: true },
  { cheie: "r6", gratuit: true, premium: true },
  { cheie: "r7", gratuit: "top 3", premium: "top 5" },
  { cheie: "r8", gratuit: false, premium: true },
  { cheie: "r9", gratuit: false, premium: true },
  { cheie: "r10", gratuit: "panaLa3", premium: true },
];

export default function Premium() {
  const tt = useTraduse({
    titlu: "Planuri și prețuri",
    sub: "Tot ce ține de învățare rămâne gratuit. Premium adaugă instrumentele de research avansat și un radar fără limite.",
    activ: "Ai abonamentul Premium activ — toate instrumentele sunt deblocate.",
    gestioneaza: "Gestionează abonamentul",
    gratuit: "Gratuit",
    trial: "3 zile gratuit, apoi de la $24/lună",
    nelimitat: "Nelimitat",
    panaLa3: "până la limita de 3",
    alegePlanul: "Alege-ți planul",
    planLunar: "Lunar",
    planLunarPret: "$29/lună",
    planAnual: "Anual",
    planAnualPret: "$290/an",
    planAnualEcon: "2 luni gratuite · ~$24/lună",
    celMaiAvantajos: "Cel mai avantajos",
    cta: "Începe cu 3 zile gratuit →",
    deschid: "Se deschide activarea...",
    nota: "Cardul se introduce la activare, prin Stripe · Primele 3 zile sunt gratuite, apoi abonamentul continuă automat cu prețul planului ales (în USD) · Anulezi oricând în perioada de probă și nu plătești nimic",
    r0: "Acțiuni urmărite în radar",
    r1: "Scoruri AI complete (4 sub-scoruri + verdict + factori)",
    r2: "Digest zilnic cu schimbările importante",
    r3: "Știri analizate AI pe zi",
    r4: "Research zilnic (creșteri + scăderi)",
    r5: "Portofoliu virtual de 10.000 USD",
    r6: "Calendar de raportări",
    r7: "Top scoruri AI din tot universul",
    r8: "Screener AI (verdict / sector / scor / sortare)",
    r9: "Comparator A vs B (scoruri + preț, față în față)",
    r10: "Onboarding pe interese cu 10 acțiuni dintr-o dată",
  });
  const [premium, setPremium] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("anual"); // preselectat cel avantajos

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
      track("start_trial", { plan });
      const data = await api.createCheckoutSession(plan);
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

  function Celula({ valoare }) {
    if (valoare === true) return <span className="premium-check">✓</span>;
    if (valoare === false) return <span className="premium-lock">—</span>;
    if (valoare === "nelimitat") return <span className="premium-text">{tt("nelimitat")}</span>;
    if (valoare === "panaLa3") return <span className="premium-text">{tt("panaLa3")}</span>;
    return <span className="premium-text">{valoare}</span>;
  }

  return (
    <div className="portfolio-page premium-page">
      <h1 className="page-title">{tt("titlu")}</h1>
      <p className="cash">{tt("sub")}</p>

      {premium === true && (
        <div className="premium-active-banner">
          <Star size={14} className="ic" /> {tt("activ")}
          <button className="logout" onClick={handleManage} disabled={loading}>
            {loading ? "..." : tt("gestioneaza")}
          </button>
        </div>
      )}

      <section className="holdings premium-table-wrap">
        <table className="premium-table">
          <thead>
            <tr>
              <th></th>
              <th>
                {tt("gratuit")}
                <span className="premium-price">0 RON</span>
              </th>
              <th className="premium-col">
                <Star size={13} className="ic" /> Premium
                <span className="premium-price">{tt("trial")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {RANDURI.map((r) => (
              <tr key={r.cheie}>
                <th>{tt(r.cheie)}</th>
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
          <div className="premium-cta-row premium-prelansare">
            <img src="/mascota/sarbatoreste.png" alt="" className="mascota mascota-premium" loading="lazy" />
            <h3 className="prelansare-titlu">{tt("alegePlanul")}</h3>

            <div className="plan-selector">
              <button
                type="button"
                className={`plan-card ${plan === "lunar" ? "active" : ""}`}
                aria-pressed={plan === "lunar"}
                onClick={() => setPlan("lunar")}
              >
                <span className="plan-nume">{tt("planLunar")}</span>
                <span className="plan-pret">{tt("planLunarPret")}</span>
              </button>
              <button
                type="button"
                className={`plan-card ${plan === "anual" ? "active" : ""}`}
                aria-pressed={plan === "anual"}
                onClick={() => setPlan("anual")}
              >
                <span className="plan-badge">{tt("celMaiAvantajos")}</span>
                <span className="plan-nume">{tt("planAnual")}</span>
                <span className="plan-pret">{tt("planAnualPret")}</span>
                <span className="plan-econ">{tt("planAnualEcon")}</span>
              </button>
            </div>

            <button className="landing-cta" onClick={handleUpgrade} disabled={loading}>
              {loading ? tt("deschid") : <><Star size={14} className="ic" /> {tt("cta")}</>}
            </button>
            <p className="muted premium-note">{tt("nota")}</p>
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </section>

      <Disclaimer />
    </div>
  );
}
