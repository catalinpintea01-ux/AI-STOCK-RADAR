import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useLang } from "../i18n/index.jsx";

// Comutatorul light/dark, refolosit în NavBar (logat), pe landing și pe
// paginile de autentificare. Tema se aplică pe <html data-theme> și se
// salvează — main.jsx o re-aplică înainte de primul render, fără flash.
export default function ThemeToggle() {
  const { t } = useLang();
  const [tema, setTema] = useState(document.documentElement.dataset.theme || "light");

  function toggle() {
    const noua = tema === "dark" ? "light" : "dark";
    setTema(noua);
    if (noua === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("tema", noua);
    } catch {
      /* mod privat strict — tema rămâne doar pe sesiune */
    }
  }

  return (
    <button className="theme-toggle" onClick={toggle} aria-label={t("nav.comutaTema")}>
      {tema === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
