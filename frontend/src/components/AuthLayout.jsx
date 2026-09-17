import { useLang } from "../i18n/index.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import FooterLegal from "./FooterLegal.jsx";
import DemoLive from "./DemoLive.jsx";

// Paginile de cont: în stânga NU o listă de promisiuni, ci produsul însuși —
// cardul cu scorul real al acțiunii pe care vizitatorul a ales-o în demo
// (sau AAPL, dacă a venit direct). Continuitatea landing → cont e motivul
// pentru care nu-l mai punem să "creadă" nimic: vede ce urmează să urmărească.
//  mod = "register" | "login" (schimbă doar titlul panoului)
export default function AuthLayout({ children, mod = "register", simbol }) {
  const { t } = useLang();
  const simbolAfisat = simbol || "AAPL";
  return (
    <div className="auth-page">
      <div className="auth-lang">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <p className="auth-brand-title">AI Stock Radar</p>
          <h2 className="auth-brand-heading">
            {mod === "login"
              ? t("auth.panelLogin")
              : t("auth.panelRegister").replace("{simbol}", simbolAfisat)}
          </h2>
          <p className="auth-brand-tagline">
            {mod === "login" ? t("auth.panelLoginSub") : t("auth.panelRegisterSub")}
          </p>
          <DemoLive compact simbolInitial={simbolAfisat} />
        </div>
      </div>
      <div className="auth-form-panel">
        {children}
        <FooterLegal />
      </div>
    </div>
  );
}
