import { Link } from "react-router-dom";
import { useLang } from "../i18n/index.jsx";

// Avertismentul de risc — pagină publică dedicată, tradusă din dicționare.
// Textul cheie ("pierderea capitalului") apare și în disclaimerul global.
export default function Risc() {
  const { t } = useLang();
  return (
    <div className="portfolio-page legal-page">
      <Link to="/" className="back-link">
        ← AI Stock Radar
      </Link>
      <h1 className="page-title">{t("riscPagina.titlu")}</h1>
      <section className="holdings legal-body">
        <p>
          <strong>{t("riscPagina.p1")}</strong>
        </p>
        <p>{t("riscPagina.p2")}</p>
        <p>{t("riscPagina.p3")}</p>
        <p>{t("riscPagina.p4")}</p>
        <p>{t("riscPagina.p5")}</p>

        <p className="legal-nota">
          <Link to="/despre">{t("fDespre")}</Link> · <Link to="/termeni">{t("landing.termeni")}</Link> ·{" "}
          <Link to="/confidentialitate">{t("landing.confidentialitate")}</Link>
        </p>
      </section>
    </div>
  );
}
