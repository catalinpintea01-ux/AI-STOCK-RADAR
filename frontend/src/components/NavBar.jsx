import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function NavBar() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

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
  }, []);

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
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
      <button className="logout" onClick={logout}>
        Ieșire
      </button>
    </nav>
  );
}
