const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { checkForNewAlerts, getAlerts, getDigest, markAlertRead, markAllRead } = require("../services/alerts");

const router = express.Router();

router.post("/check", requireAuth, async (req, res) => {
  const newCount = await checkForNewAlerts(req.userId);
  res.json({ newCount });
});

router.get("/", requireAuth, async (req, res) => {
  const [items, digestData] = await Promise.all([getAlerts(req.userId), getDigest(req.userId)]);
  res.json({ items, digest: digestData.digest, unreadCount: digestData.unreadCount });
});

router.post("/:id/read", requireAuth, async (req, res) => {
  await markAlertRead(req.userId, req.params.id);
  res.json({ ok: true });
});

router.post("/read-all", requireAuth, async (req, res) => {
  await markAllRead(req.userId);
  res.json({ ok: true });
});

module.exports = router;
