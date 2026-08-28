require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const portfolioRoutes = require("./routes/portfolio");
const stocksRoutes = require("./routes/stocks");
const watchlistRoutes = require("./routes/watchlist");
const alertsRoutes = require("./routes/alerts");
const communityRoutes = require("./routes/community");
const billingRoutes = require("./routes/billing");
const toolsRoutes = require("./routes/tools");
const webhookRoutes = require("./routes/webhooks");
const scheduler = require("./services/scheduler");

const app = express();

app.use(cors());

// Montat înainte de express.json() — Stripe are nevoie de raw body pentru
// verificarea semnăturii webhook-ului.
app.use("/api/webhooks", webhookRoutes);

app.use(express.json());

// Limba interfeței, trimisă de frontend (X-Limba) — folosită pentru a livra
// conținutul generat (narative radar, știri, motive) în limba utilizatorului.
const { normalizeazaLimba } = require("./services/i18nContent");
app.use((req, res, next) => {
  req.limba = normalizeazaLimba(req.headers["x-limba"]);
  next();
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/stocks", stocksRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/i18n", require("./routes/i18n"));
app.use("/api/narative", require("./routes/narative"));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend rulează pe portul ${port}`));

// Completează în fundal scorurile AI lipsă/expirate pentru tot ce e urmărit,
// ca un utilizator care doar deschide aplicația să găsească deja analiză
// gata făcută, nu un buton pe care nu știe că trebuie să-l apese.
scheduler.start();
