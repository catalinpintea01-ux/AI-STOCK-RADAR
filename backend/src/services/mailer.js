// Trimitere de email prin API-ul HTTP Resend — fără dependențe noi.
// Neconfigurat (fără RESEND_API_KEY): trimiteEmail întoarce false, iar
// apelantul decide fallback-ul (la resetare de parolă: linkul apare în
// logurile Railway, ca fluxul să fie testabil și înainte de configurare).
const RESEND_URL = "https://api.resend.com/emails";
const FROM = process.env.EMAIL_FROM || "AI Stock Radar <resetare@stockradarai.com>";

function esteConfigurat() {
  return Boolean(process.env.RESEND_API_KEY);
}

async function trimiteEmail({ to, subject, html }) {
  if (!esteConfigurat()) return false;

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      const detalii = await res.text().catch(() => "");
      throw new Error(`Resend a răspuns cu status ${res.status}: ${detalii.slice(0, 200)}`);
    }
    return true;
  } catch (err) {
    console.error(`[mailer] trimitere eșuată către ${to}: ${err.message}`);
    return false;
  }
}

module.exports = { trimiteEmail, esteConfigurat };
