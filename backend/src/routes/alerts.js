const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { checkForNewAlerts, getAlerts, getUnreadCount, markAlertRead, markAllRead } = require("../services/alerts");

const router = express.Router();

router.post("/check", requireAuth, async (req, res) => {
  const newCount = await checkForNewAlerts(req.userId);
  res.json({ newCount });
});

router.get("/", requireAuth, async (req, res) => {
  const [items, unreadCount] = await Promise.all([getAlerts(req.userId), getUnreadCount(req.userId)]);
  res.json({ items, unreadCount });
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
