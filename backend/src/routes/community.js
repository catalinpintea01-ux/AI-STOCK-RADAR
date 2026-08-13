const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { getStock } = require("../services/marketData");

const router = express.Router();

const CAPITAL_INITIAL = 10000;

async function getPortfolioSummary(userId) {
  const portofoliu = await prisma.portfolio.findFirst({
    where: { userId, tip: "simulat" },
    include: { holdings: true },
  });

  if (!portofoliu) return null;

  let holdingsValue = 0;
  const holdings = [];

  for (const h of portofoliu.holdings) {
    const stock = await getStock(h.simbol);
    const pretCurent = stock?.pret ?? h.pretMediuAchizitie;
    holdingsValue += h.cantitate * pretCurent;
    holdings.push({
      simbol: h.simbol,
      cantitate: h.cantitate,
      pretMediuAchizitie: h.pretMediuAchizitie,
      pretCurent,
    });
  }

  const valoareTotala = portofoliu.cashBalance + holdingsValue;

  return {
    cashBalance: portofoliu.cashBalance,
    valoareTotala,
    randamentProcent: ((valoareTotala - CAPITAL_INITIAL) / CAPITAL_INITIAL) * 100,
    holdings,
  };
}

// Codul de invitație e chiar id-ul utilizatorului — nu are nevoie de o
// coloană separată. Trebuie distribuit manual (copiat și trimis) de acela
// care vrea să fie adăugat ca prieten — asta e mecanismul de consimțământ.
router.get("/me", requireAuth, (req, res) => {
  res.json({ inviteCode: req.userId });
});

router.get("/friends", requireAuth, async (req, res) => {
  const prietenii = await prisma.friendship.findMany({ where: { userId: req.userId } });
  const friendIds = prietenii.map((p) => p.friendId);

  const users = friendIds.length
    ? await prisma.user.findMany({ where: { id: { in: friendIds } } })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const rezultat = [];
  for (const friendId of friendIds) {
    const user = userMap.get(friendId);
    if (!user) continue;
    const summary = await getPortfolioSummary(friendId);
    rezultat.push({ id: user.id, email: user.email, ...summary });
  }

  res.json({ friends: rezultat });
});

router.post("/friends", requireAuth, async (req, res) => {
  const { cod } = req.body;
  if (!cod) {
    return res.status(400).json({ error: "Cod de invitație obligatoriu" });
  }
  if (cod === req.userId) {
    return res.status(400).json({ error: "Nu te poți adăuga pe tine însuți" });
  }

  const friend = await prisma.user.findUnique({ where: { id: cod } });
  if (!friend) {
    return res.status(404).json({ error: "Cod de invitație invalid" });
  }

  await prisma.friendship.upsert({
    where: { userId_friendId: { userId: req.userId, friendId: friend.id } },
    update: {},
    create: { userId: req.userId, friendId: friend.id },
  });
  await prisma.friendship.upsert({
    where: { userId_friendId: { userId: friend.id, friendId: req.userId } },
    update: {},
    create: { userId: friend.id, friendId: req.userId },
  });

  res.status(201).json({ ok: true });
});

router.delete("/friends/:friendId", requireAuth, async (req, res) => {
  const { friendId } = req.params;
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { userId: req.userId, friendId },
        { userId: friendId, friendId: req.userId },
      ],
    },
  });
  res.json({ ok: true });
});

module.exports = router;
