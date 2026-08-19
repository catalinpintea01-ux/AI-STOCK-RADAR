import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import Disclaimer from "../components/Disclaimer.jsx";

function formatData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewsDetail() {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setNews(null);
    setError("");
    api
      .getMarketNewsDetail(id)
      .then((data) => setNews(data.news))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="page-message">Eroare: {error}</div>;
  if (!news) return <div className="page-message">Se încarcă...</div>;

  return (
    <div className="portfolio-page">
      <Link to="/" className="back-link">
        ← AI Stock Radar
      </Link>

      <div
        className="news-detail-hero"
        style={news.imagine ? { backgroundImage: `url(${news.imagine})` } : undefined}
      >
        <div className="news-detail-hero-body">
          <span className="hero-news-source">
            {news.sursa} · {formatData(news.data)}
          </span>
          <h1 className="news-detail-title">{news.titluAI}</h1>
        </div>
      </div>

      <p className="news-detail-body">{news.analiza}</p>

      <a href={news.url} target="_blank" rel="noopener noreferrer" className="back-link">
        Citește sursa completă ({news.sursa}) ↗
      </a>

      <Disclaimer />
    </div>
  );
}
