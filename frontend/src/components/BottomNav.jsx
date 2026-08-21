import { NavLink } from "react-router-dom";
import { Radar, Briefcase, Bell, BookOpen } from "lucide-react";

// Bară de navigare jos, doar pe mobil — destinațiile principale la un deget
// distanță (pattern-ul standard al aplicațiilor de trading), în locul
// meniului hamburger din colțul greu accesibil.
const ITEMS = [
  { to: "/", label: "Radar", icon: Radar, end: true },
  { to: "/portofoliu", label: "Portofoliu", icon: Briefcase },
  { to: "/alerte", label: "Digest", icon: Bell },
  { to: "/informare", label: "Învață", icon: BookOpen },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navigare principală">
      {ITEMS.map((item) => (
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
