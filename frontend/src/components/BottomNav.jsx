import { NavLink } from "react-router-dom";
import { Radar, Briefcase, Bell, BookOpen } from "lucide-react";
import { useLang } from "../i18n/index.jsx";

// Bară de navigare jos, doar pe mobil — destinațiile principale la un deget
// distanță (pattern-ul standard al aplicațiilor de trading), în locul
// meniului hamburger din colțul greu accesibil.
export default function BottomNav() {
  const { t } = useLang();
  const items = [
    { to: "/", label: t("bottom.radar"), icon: Radar, end: true },
    { to: "/portofoliu", label: t("bottom.portofoliu"), icon: Briefcase },
    { to: "/alerte", label: t("bottom.digest"), icon: Bell },
    { to: "/informare", label: t("bottom.invata"), icon: BookOpen },
  ];
  return (
    <nav className="bottom-nav" aria-label="Meniu">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
