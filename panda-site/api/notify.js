// ── Email notifications via Resend ──
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.RESEND_API_KEY;
  // Daca nu e configurat, returnam ok silentios
  if (!apiKey) return res.status(200).json({ ok: true });

  const { type, data } = req.body || {};

  const templates = {
    new_user: {
      subject: `🐼 User nou pe Bucataria lui Panda!`,
      html: `<h2 style="color:#4E7C3F">User nou inregistrat 🐼</h2>
             <p><b>Email:</b> ${data?.email}</p>
             <p><b>Inregistrat la:</b> ${data?.createdAt}</p>
             <p><b>Metoda:</b> ${data?.provider || 'email/parola'}</p>`
    },
    new_proposal: {
      subject: `🎋 Propunere noua de reteta!`,
      html: `<h2 style="color:#4E7C3F">Propunere noua de reteta 🎋</h2>
             <p><b>De la:</b> ${data?.email || 'anonim'}</p>
             <p><b>Trimisa la:</b> ${data?.timestamp}</p>
             <p><b>Continut:</b></p>
             <p style="background:#f5f5f5;padding:12px;border-radius:8px">${(data?.text || '').substring(0, 600)}</p>
             <p><a href="https://bucataria-lui-panda.vercel.app" style="color:#4E7C3F">Deschide site-ul</a></p>`
    }
  };

  const tpl = templates[type];
  if (!tpl) return res.status(400).json({ error: 'Unknown notification type' });

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Bucataria lui Panda <onboarding@resend.dev>',
        to: ['Antonio.nula@gmail.com'],
        subject: tpl.subject,
        html: tpl.html
      })
    });
  } catch(e) {
    console.error('[Notify] Resend error:', e.message);
  }

  return res.status(200).json({ ok: true });
}
