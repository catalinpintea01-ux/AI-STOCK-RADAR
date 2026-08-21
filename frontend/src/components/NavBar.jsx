import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function NavBar() {
  const navigate = useNavigate();
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
          🔔{unreadCount > 0 ? ` ${unreadCount}` : ""}
        </NavLink>

        {premium === true && <span className="badge-chip">⭐ Premium</span>}
        {premium === false && (
          <button className="upgrade-button" onClick={handleUpgradeClick}>
            ⭐ Premium
          </button>
        )}

        <div className="navbar-menu-wrapper" ref={menuRef}>
          <button
            className="navbar-menu-button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Meniu"
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
                Portofoliu virtual
              </NavLink>
              <NavLink
                to="/informare"
                className={({ isActive }) => (isActive ? "navbar-dropdown-link active" : "navbar-dropdown-link")}
                onClick={() => setMenuOpen(false)}
              >
                Informare
              </NavLink>
              <NavLink
                to="/comunitate"
                className={({ isActive }) => (isActive ? "navbar-dropdown-link active" : "navbar-dropdown-link")}
                onClick={() => setMenuOpen(false)}
              >
                Comunitate
              </NavLink>
              {premium === true && (
                <button className="navbar-dropdown-link navbar-dropdown-button" onClick={handleManageClick}>
                  Gestionează abonamentul
                </button>
              )}
              <button
                className="navbar-dropdown-link navbar-dropdown-button navbar-dropdown-separator"
                onClick={logout}
              >
                Ieșire
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
