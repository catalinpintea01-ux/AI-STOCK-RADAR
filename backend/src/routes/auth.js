const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || password.length < 8) {
    return res.status(400).json({
      error: "Email valid și parolă de minim 8 caractere sunt obligatorii",
    });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Există deja un cont cu acest email" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      portfolios: { create: { tip: "simulat", cashBalance: 10000 } },
      subscriptions: { create: { plan: "free", status: "active" } },
    },
    include: { portfolios: true },
  });

  const token = signToken(user.id);
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, nivel: user.nivel, xp: user.xp },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Email sau parolă incorecte" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Email sau parolă incorecte" });
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, email: user.email, nivel: user.nivel, xp: user.xp },
  });
});

module.exports = router;
