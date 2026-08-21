import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// Tema (light/dark) se aplică înainte de primul render, ca să nu existe flash.
const temaSalvata = localStorage.getItem("tema");
if (temaSalvata === "dark") document.documentElement.dataset.theme = "dark";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
