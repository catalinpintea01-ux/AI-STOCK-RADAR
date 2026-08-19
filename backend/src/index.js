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
const webhookRoutes = require("./routes/webhooks");

const app = express();

app.use(cors());

// Montat înainte de express.json() — Stripe are nevoie de raw body pentru
// verificarea semnăturii webhook-ului.
app.use("/api/webhooks", webhookRoutes);

app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/stocks", stocksRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/billing", billingRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend rulează pe portul ${port}`));
