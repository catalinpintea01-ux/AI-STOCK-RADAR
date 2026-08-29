import { Link } from "react-router-dom";
import { useLang } from "../i18n/index.jsx";

// Pagina "Despre" — identitatea publică a proiectului (cine, ce, ce NU).
// Publică, tradusă din dicționare (fără autentificare, fără cereri la server).
const EMAIL = "contact@stockradarai.com";

export default function Despre() {
  const { t } = useLang();
  return (
    <div className="portfolio-page legal-page">
      <Link to="/" className="back-link">
        ← AI Stock Radar
      </Link>
      <h1 className="page-title">{t("desprePagina.titlu")}</h1>
      <p className="cash">{t("desprePagina.sub")}</p>
      <section className="holdings legal-body">
        <p>{t("desprePagina.p1")}</p>

        <h2>{t("desprePagina.ceFacemTitlu")}</h2>
        <p>{t("desprePagina.ceFacem")}</p>

        <h2>{t("desprePagina.ceNuTitlu")}</h2>
        <p>{t("desprePagina.ceNu")}</p>

        <h2>{t("desprePagina.cineTitlu")}</h2>
        <p>{t("desprePagina.cine")}</p>

        <h2>{t("desprePagina.contactTitlu")}</h2>
        <p>
          {t("desprePagina.contact").split("{email}")[0]}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          {t("desprePagina.contact").split("{email}")[1]}
        </p>

        <p className="legal-nota">
          <Link to="/risc">{t("fRisc")}</Link> · <Link to="/termeni">{t("landing.termeni")}</Link> ·{" "}
          <Link to="/confidentialitate">{t("landing.confidentialitate")}</Link>
        </p>
      </section>
    </div>
  );
}
