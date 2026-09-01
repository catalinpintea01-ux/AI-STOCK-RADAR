import { Link } from "react-router-dom";
import { useLang } from "../i18n/index.jsx";

// Subsolul legal global — pe toate paginile aplicației (cerință de
// transparență): Termeni, Confidențialitate, Risc, Despre + firma operatoare.
export default function FooterLegal() {
  const { t } = useLang();
  return (
    <footer className="footer-legal">
      <nav className="footer-legal-links">
        <Link to="/termeni">{t("landing.termeni")}</Link>
        <span aria-hidden="true">·</span>
        <Link to="/confidentialitate">{t("landing.confidentialitate")}</Link>
        <span aria-hidden="true">·</span>
        <Link to="/risc">{t("fRisc")}</Link>
        <span aria-hidden="true">·</span>
        <Link to="/despre">{t("fDespre")}</Link>
      </nav>
      {/* Doar brandul în footer (modelul WeltPixel) — entitatea juridică
          apare exclusiv în Termeni și Confidențialitate, unde e obligatorie. */}
      <p className="footer-legal-firma">Copyright © {new Date().getFullYear()} AI Stock Radar. All rights reserved.</p>
    </footer>
  );
}
