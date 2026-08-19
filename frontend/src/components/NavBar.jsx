import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function NavBar() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [premium, setPremium] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

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

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  async function handleUpgradeClick() {
    setUpgrading(true);
    try {
      const data = await api.createCheckoutSession();
      window.location.href = data.url;
    } catch (err) {
      alert(err.message);
      setUpgrading(false);
    }
  }

  async function handleManageClick() {
    try {
      const data = await api.openBillingPortal();
      window.location.href = data.url;
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          AI Stock Radar
        </NavLink>
        <NavLink to="/portofoliu" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Portofoliu virtual
        </NavLink>
        <NavLink to="/informare" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Informare
        </NavLink>
        <NavLink to="/comunitate" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Comunitate
        </NavLink>
        <NavLink to="/alerte" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          🔔{unreadCount > 0 ? ` ${unreadCount}` : ""}
        </NavLink>
      </div>
      {premium === true && (
        <>
          <span className="badge-chip">⭐ Premium</span>
          <button className="logout" onClick={handleManageClick}>
            Gestionează abonamentul
          </button>
        </>
      )}
      {premium === false && (
        <button className="why-button" onClick={handleUpgradeClick} disabled={upgrading}>
          {upgrading ? "Se încarcă..." : "⭐ Treci la Premium"}
        </button>
      )}
      <button className="logout" onClick={logout}>
        Ieșire
      </button>
    </nav>
  );
}
