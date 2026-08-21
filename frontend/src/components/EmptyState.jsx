import { Link } from "react-router-dom";
import RadarViz from "./RadarViz.jsx";

// Empty state cu personalitate (în locul unui rând de text gri): radarul —
// motivul grafic recurent al brandului — plus un pas următor concret.
export default function EmptyState({ titlu, text, ctaText, ctaTo }) {
  return (
    <div className="empty-state">
      <div className="empty-state-viz">
        <RadarViz size={96} showLabels={false} />
      </div>
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
