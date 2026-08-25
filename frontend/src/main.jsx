import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";

// Tema (light/dark) se aplică înainte de primul render, ca să nu existe flash.
// Fără o alegere explicită a utilizatorului, urmăm tema sistemului (telefonul
// pe dark mode → aplicația pe dark), exact ca aplicațiile native.
const temaSalvata = localStorage.getItem("tema");
const sistemDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
if (temaSalvata === "dark" || (!temaSalvata && sistemDark)) {
  document.documentElement.dataset.theme = "dark";
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>
);
