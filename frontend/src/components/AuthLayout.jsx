import { Radar, Newspaper, Shield } from "lucide-react";
import { useLang } from "../i18n/index.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const ICONS = [Radar, Newspaper, Shield];

export default function AuthLayout({ children }) {
  const { t } = useLang();
  const puncte = t("auth.puncte");
  return (
    <div className="auth-page">
      <div className="auth-lang">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <img src="/mascota/laptop.png" alt="" className="mascota mascota-auth" />
          <h1 className="auth-brand-title">AI Stock Radar</h1>
          <p className="auth-brand-tagline">{t("auth.tagline")}</p>
          <ul className="auth-brand-points">
            {puncte.map((text, i) => {
              const Icon = ICONS[i] || Radar;
              return (
                <li key={text}>
                  <span className="auth-brand-icon"><Icon size={16} /></span>
                  {text}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="auth-form-panel">{children}</div>
    </div>
  );
}
