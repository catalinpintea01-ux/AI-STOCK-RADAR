import { Link } from "react-router-dom";


// Empty state cu personalitate (în locul unui rând de text gri): radarul —
// motivul grafic recurent al brandului — plus un pas următor concret.
export default function EmptyState({ titlu, text, ctaText, ctaTo }) {
  return (
    <div className="empty-state">
      <img src="/mascota/ganditor.png" alt="" className="mascota mascota-empty" loading="lazy" />
      <h3 className="empty-state-title">{titlu}</h3>
      <p className="empty-state-text">{text}</p>
      {ctaText && ctaTo && (
        <Link to={ctaTo} className="add-watchlist-button">
          {ctaText}
        </Link>
      )}
    </div>
  );
}
