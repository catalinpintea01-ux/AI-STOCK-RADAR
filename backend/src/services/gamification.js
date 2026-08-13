const prisma = require("../db");

const XP_PER_LEVEL = 100;
const XP_DAILY_CHECKIN = 10;
const XP_PER_TRADE = 5;
const STREAK_BADGE_THRESHOLD = 7;
const DIVERSIFICARE_THRESHOLD = 3;

function levelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a, b) {
  const ms = startOfDay(b) - startOfDay(a);
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

async function awardBadge(userId, tipBadge) {
  const existing = await prisma.badge.findFirst({ where: { userId, tipBadge } });
  if (existing) return null;
  return prisma.badge.create({ data: { userId, tipBadge } });
}

// Actualizează streak-ul zilnic la prima activitate din zi (deschiderea
// portofoliului). Streak-ul crește doar dacă ultima activitate a fost ieri;
// altfel se resetează la 1. XP-ul de check-in se acordă o singură dată pe zi.
async function recordDailyCheckIn(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const now = new Date();

  if (user.dataUltimaActivitate && daysBetween(user.dataUltimaActivitate, now) === 0) {
    return user;
  }

  const streakCurent =
    user.dataUltimaActivitate && daysBetween(user.dataUltimaActivitate, now) === 1
      ? user.streakCurent + 1
      : 1;

  const xp = user.xp + XP_DAILY_CHECKIN;
  const nivel = levelFromXp(xp);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { streakCurent, xp, nivel, dataUltimaActivitate: now },
  });

  if (streakCurent >= STREAK_BADGE_THRESHOLD) {
    await awardBadge(userId, "consecventa");
  }

  return updated;
}

async function awardXpForTrade(userId) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: XP_PER_TRADE } },
  });

  const nivel = levelFromXp(user.xp);
  if (nivel !== user.nivel) {
    await prisma.user.update({ where: { id: userId }, data: { nivel } });
  }
}

async function checkTradeBadges(userId, portfolio) {
  if (portfolio.transactions.length === 1) {
    await awardBadge(userId, "primul-pas");
  }
  if (portfolio.holdings.length >= DIVERSIFICARE_THRESHOLD) {
    await awardBadge(userId, "diversificare");
  }
}

async function getUserStats(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      nivel: true,
      xp: true,
      streakCurent: true,
      badges: { orderBy: { dataObtinut: "desc" } },
    },
  });
}

module.exports = {
  recordDailyCheckIn,
  awardXpForTrade,
  checkTradeBadges,
  getUserStats,
  levelFromXp,
  XP_PER_LEVEL,
};
