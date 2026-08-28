import { useEffect, useState } from "react";
import { SkeletonPage } from "../components/Skeleton.jsx";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import Disclaimer from "../components/Disclaimer.jsx";
import { useLang } from "../i18n/index.jsx";
import { useTraduse } from "../i18n/useTraduse.js";

export default function NewsDetail() {
  const { id } = useParams();
  const { t, locale } = useLang();
  const tt = useTraduse({
    sursa: "Citește sursa completă",
  });
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

  if (error) return <div className="page-message">{t("dash.eroare")} {error}</div>;
  if (!news) return <SkeletonPage />;

  const dataFormatata = news.data
    ? new Date(news.data).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
    : "";

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
            {news.sursa} · {dataFormatata}
          </span>
          <h1 className="news-detail-title">{news.titluAI}</h1>
        </div>
      </div>

      <p className="news-detail-body">{news.analiza}</p>

      <a href={news.url} target="_blank" rel="noopener noreferrer" className="back-link">
        {tt("sursa")} ({news.sursa}) ↗
      </a>

      <Disclaimer />
    </div>
  );
}
