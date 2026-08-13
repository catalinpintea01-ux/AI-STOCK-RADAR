import { useEffect, useState } from "react";
import { api } from "../api";

const REFRESH_MS = 45_000;

export default function TickerTape() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function load() {
      api
        .getTicker()
        .then((data) => setItems(data.ticker))
        .catch(() => {});
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  if (items.length === 0) return null;

  const randul = [...items, ...items]; // duplicat pentru buclă continuă

  return (
    <div className="ticker-tape">
      <div className="ticker-track">
        {randul.map((item, i) => (
          <span key={i} className="ticker-item">
            <strong>{item.simbol}</strong> {item.nume}{" "}
            <span className={item.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}>
              ${item.pret.toFixed(2)} {item.variatieProcent >= 0 ? "▲" : "▼"}
              {item.variatieProcent >= 0 ? "+" : ""}
              {item.variatieProcent.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
