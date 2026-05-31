import admin from 'firebase-admin';

// Initializeaza Firebase Admin o singura data
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch(e) {
    console.error('[Reset] Firebase Admin init error:', e.message);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Verifica daca userul exista si nu e Google-only
  try {
    const user = await admin.auth().getUserByEmail(email);
    const isGoogleOnly = user.providerData.length === 1
      && user.providerData[0].providerId === 'google.com';

    if (isGoogleOnly) {
      return res.status(200).json({
        ok: true,
        message: 'google_user',
        hint: 'Contul tau foloseste Google Sign-In. Reseteaza parola din contul Google.'
      });
    }

    // Genereaza link de resetare
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: 'https://bucataria-lui-panda.vercel.app',
      handleCodeInApp: false
    });

    // Trimite email custom via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Bucataria lui Panda <onboarding@resend.dev>',
          to: [email],
          subject: '🔐 Resetare parola — Bucataria lui Panda',
          html: buildResetEmail(email, resetLink)
        })
      });
    }

    return res.status(200).json({ ok: true, message: 'email_sent' });

  } catch(e) {
    if (e.code === 'auth/user-not-found') {
      // Nu revealam daca emailul exista sau nu (securitate)
      return res.status(200).json({ ok: true, message: 'email_sent' });
    }
    console.error('[Reset] Error:', e.message);
    return res.status(500).json({ error: 'Server error' });
  }
}

function buildResetEmail(email, link) {
  return `
  <div style="font-family:Nunito,sans-serif;max-width:560px;margin:0 auto">
    <div style="background:#1A1A1A;padding:32px;border-radius:16px 16px 0 0;text-align:center">
      <div style="font-size:48px">🔐</div>
      <h1 style="color:#7FB069;font-family:Georgia,serif;margin:8px 0">Bucataria lui Panda</h1>
    </div>
    <div style="background:#f9f9f7;padding:32px;border-radius:0 0 16px 16px">
      <h2 style="color:#2B2B2B">Ai uitat parola? Panda nu judeca.</h2>
      <p>Cineva (probabil tu) a cerut resetarea parolei pentru <b>${email}</b>.</p>
      <p>Apasa butonul de mai jos — linkul expira in <b>1 ora</b>. Ca si rabdarea lui Panda.</p>
      <a href="${link}" style="display:inline-block;background:#7FB069;color:white;font-weight:700;padding:14px 32px;border-radius:30px;text-decoration:none;margin-top:8px;font-size:16px">
        🔑 Reseteaza parola
      </a>
      <p style="margin-top:24px;font-size:13px;color:#555">Sau copiaza linkul:</p>
      <p style="font-size:11px;color:#999;word-break:break-all;background:#eee;padding:8px;border-radius:8px">${link}</p>
      <p style="font-size:12px;color:#999;margin-top:24px">Daca nu ai cerut tu resetarea, ignora acest email. Panda te va ignora la randul lui. Fair.</p>
    </div>
  </div>`;
}
