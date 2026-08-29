const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../db");
const { trimiteEmail } = require("../services/mailer");

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const RESET_TTL_MS = 60 * 60 * 1000; // linkul de resetare e valabil o oră

// Textele emailului de resetare, per limbă (limba vine din X-Limba).
const EMAIL_RESET = {
  ro: { subiect: "Resetează-ți parola AI Stock Radar", text: "Am primit o cerere de resetare a parolei pentru contul tău. Apasă butonul de mai jos — linkul e valabil o oră.", buton: "Resetează parola", ignora: "Dacă nu tu ai cerut asta, ignoră emailul — parola rămâne neschimbată." },
  en: { subiect: "Reset your AI Stock Radar password", text: "We received a request to reset the password for your account. Click the button below — the link is valid for one hour.", buton: "Reset password", ignora: "If you didn't request this, ignore this email — your password stays unchanged." },
  es: { subiect: "Restablece tu contraseña de AI Stock Radar", text: "Recibimos una solicitud para restablecer la contraseña de tu cuenta. Pulsa el botón de abajo; el enlace es válido durante una hora.", buton: "Restablecer contraseña", ignora: "Si no lo has solicitado tú, ignora este correo: tu contraseña no cambia." },
  fr: { subiect: "Réinitialisez votre mot de passe AI Stock Radar", text: "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte. Cliquez sur le bouton ci-dessous — le lien est valable une heure.", buton: "Réinitialiser le mot de passe", ignora: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail — votre mot de passe reste inchangé." },
  de: { subiect: "Setze dein AI-Stock-Radar-Passwort zurück", text: "Wir haben eine Anfrage zum Zurücksetzen des Passworts für dein Konto erhalten. Klicke auf den Button unten — der Link ist eine Stunde gültig.", buton: "Passwort zurücksetzen", ignora: "Wenn du das nicht warst, ignoriere diese E-Mail — dein Passwort bleibt unverändert." },
  it: { subiect: "Reimposta la tua password di AI Stock Radar", text: "Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account. Premi il pulsante qui sotto — il link è valido per un'ora.", buton: "Reimposta password", ignora: "Se non sei stato tu, ignora questa email: la password resta invariata." },
  pt: { subiect: "Redefine a tua palavra-passe do AI Stock Radar", text: "Recebemos um pedido para redefinir a palavra-passe da tua conta. Clica no botão abaixo — o link é válido por uma hora.", buton: "Redefinir palavra-passe", ignora: "Se não foste tu, ignora este email — a tua palavra-passe fica igual." },
  nl: { subiect: "Stel je AI Stock Radar-wachtwoord opnieuw in", text: "We hebben een verzoek ontvangen om het wachtwoord van je account opnieuw in te stellen. Klik op de knop hieronder — de link is één uur geldig.", buton: "Wachtwoord opnieuw instellen", ignora: "Heb jij dit niet aangevraagd? Negeer deze e-mail — je wachtwoord blijft ongewijzigd." },
  pl: { subiect: "Zresetuj hasło do AI Stock Radar", text: "Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta. Kliknij przycisk poniżej — link jest ważny przez godzinę.", buton: "Zresetuj hasło", ignora: "Jeśli to nie Ty, zignoruj tę wiadomość — hasło pozostanie bez zmian." },
  hu: { subiect: "AI Stock Radar jelszó visszaállítása", text: "Kérelmet kaptunk a fiókod jelszavának visszaállítására. Kattints az alábbi gombra — a link egy órán át érvényes.", buton: "Jelszó visszaállítása", ignora: "Ha nem te kérted, hagyd figyelmen kívül ezt az emailt — a jelszavad változatlan marad." },
};

function emailResetHtml(limba, link) {
  const tr = EMAIL_RESET[limba] || EMAIL_RESET.ro;
  return {
    subject: tr.subiect,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1d1a15">
  <h2 style="margin:0 0 12px">AI Stock Radar</h2>
  <p style="line-height:1.6">${tr.text}</p>
  <p style="margin:24px 0"><a href="${link}" style="background:#8a6d4e;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block">${tr.buton}</a></p>
  <p style="line-height:1.6;color:#82796a;font-size:13px">${tr.ignora}</p>
</div>`,
  };
}

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

// Cerere de resetare: răspunsul e mereu generic {ok:true} — nu confirmăm dacă
// emailul există în baza de date (anti-enumerare de conturi).
router.post("/forgot", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  res.json({ ok: true }); // răspundem imediat; restul rulează în fundal

  if (!email) return;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    // Un singur token activ per user — cererile vechi se invalidează.
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await prisma.passwordReset.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    });

    const link = `${FRONTEND_URL}/resetare/${token}`;
    const { subject, html } = emailResetHtml(req.limba, link);
    const trimis = await trimiteEmail({ to: email, subject, html });
    if (!trimis) {
      // Fără serviciu de email configurat, linkul apare în loguri — fluxul
      // rămâne testabil, iar un utilizator blocat poate fi ajutat manual.
      console.log(`[auth] email de resetare netrimis pentru ${email} — link: ${link}`);
    }
  } catch (err) {
    console.error(`[auth] forgot eșuat pentru ${email}: ${err.message}`);
  }
});

router.post("/reset", async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const password = String(req.body?.password || "");

  if (!token || password.length < 8) {
    return res.status(400).json({ error: "Parolă de minim 8 caractere este obligatorie" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const cerere = await prisma.passwordReset.findUnique({ where: { tokenHash } });

  if (!cerere || cerere.usedAt || cerere.expiresAt < new Date()) {
    return res.status(400).json({ error: "Linkul de resetare este invalid sau a expirat" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: cerere.userId }, data: { passwordHash } });
  await prisma.passwordReset.update({ where: { id: cerere.id }, data: { usedAt: new Date() } });
  await prisma.passwordReset.deleteMany({ where: { userId: cerere.userId, usedAt: null } });

  res.json({ ok: true });
});

module.exports = router;
