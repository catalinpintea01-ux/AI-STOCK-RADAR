import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../api";
import { Bell, Star, Moon, Sun } from "lucide-react";
import { useLang } from "../i18n/index.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

export default function NavBar() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [tema, setTema] = useState(document.documentElement.dataset.theme || "light");

  function toggleTema() {
    const noua = tema === "dark" ? "light" : "dark";
    setTema(noua);
    if (noua === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    localStorage.setItem("tema", noua);
  }
  const [unreadCount, setUnreadCount] = useState(0);
  const [premium, setPremium] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    api
      .checkAlerts()
      .catch(() => {})
      .finally(() => {
        api
          .getAlerts()
          .then((data) => setUnreadCount(data.unreadCount))
          .catch(() => {});
      });

    api
      .getBillingStatus()
      .then((data) => setPremium(data.premium))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  // Butonul din meniu duce la pagina de comparație Gratuit vs Premium —
  // utilizatorul vede ce primește ÎNAINTE de pagina de plată Stripe.
  function handleUpgradeClick() {
    navigate("/premium");
  }

  async function handleManageClick() {
    setMenuOpen(false);
    try {
      const data = await api.openBillingPortal();
      window.location.href = data.url;
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <nav className="navbar">
      <NavLink to="/" end className="navbar-brand">
        AI Stock Radar
      </NavLink>

      <div className="navbar-actions">
        <NavLink to="/alerte" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          <Bell size={17} className="ic" />{unreadCount > 0 ? ` ${unreadCount}` : ""}
        </NavLink>

        <button className="theme-toggle" onClick={toggleTema} aria-label={t("nav.comutaTema")}>
          {tema === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <LanguageSwitcher />

        {premium === true && <span className="badge-chip"><Star size={12} className="ic" /> Premium</span>}
        {premium === false && (
          <button className="upgrade-button" onClick={handleUpgradeClick}>
            <Star size={13} className="ic" /> Premium
          </button>
        )}

        <div className="navbar-menu-wrapper" ref={menuRef}>
          <button
            className="navbar-menu-button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t("nav.meniu")}
          >
            ☰
          </button>
          {menuOpen && (
            <div className="navbar-dropdown">
              <NavLink
                to="/portofoliu"
                className={({ isActive }) => (isActive ? "navbar-dropdown-link active" : "navbar-dropdown-link")}
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.portofoliuVirtual")}
              </NavLink>
              <NavLink
                to="/informare"
                className={({ isActive }) => (isActive ? "navbar-dropdown-link active" : "navbar-dropdown-link")}
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.informare")}
              </NavLink>
              <NavLink
                to="/comunitate"
                className={({ isActive }) => (isActive ? "navbar-dropdown-link active" : "navbar-dropdown-link")}
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.comunitate")}
              </NavLink>
              {premium === true && (
                <button className="navbar-dropdown-link navbar-dropdown-button" onClick={handleManageClick}>
                  {t("nav.gestioneaza")}
                </button>
              )}
              <button
                className="navbar-dropdown-link navbar-dropdown-button navbar-dropdown-separator"
                onClick={logout}
              >
                {t("nav.iesire")}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
