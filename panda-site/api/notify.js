// ── Email notifications via Resend ──
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.RESEND_API_KEY;
  // Daca nu e configurat, returnam ok silentios
  if (!apiKey) return res.status(200).json({ ok: true });

  const { type, data } = req.body || {};

  const brandStyle = `font-family:Nunito,sans-serif;max-width:560px;margin:0 auto`;
  const btn = (text, url) => `<a href="${url}" style="display:inline-block;background:#7FB069;color:white;font-weight:700;padding:12px 28px;border-radius:30px;text-decoration:none;margin-top:16px">${text}</a>`;

  const templates = {
    new_user: {
      to: 'Antonio.nula@gmail.com',
      subject: `🐼 User nou pe Bucataria lui Panda!`,
      html: `<div style="${brandStyle}">
        <h2 style="color:#4E7C3F">User nou inregistrat 🐼</h2>
        <p><b>Email:</b> ${data?.email}</p>
        <p><b>Inregistrat la:</b> ${data?.createdAt}</p>
        <p><b>Metoda:</b> ${data?.provider || 'email/parola'}</p>
        ${btn('Deschide Admin Panel', 'https://bucataria-lui-panda.vercel.app')}
      </div>`
    },
    welcome_user: {
      to: data?.email,
      subject: `🐼 Bun venit la Bucataria lui Panda!`,
      html: `<div style="${brandStyle}">
        <div style="background:#1A1A1A;padding:32px;border-radius:16px 16px 0 0;text-align:center">
          <div style="font-size:64px">🐼</div>
          <h1 style="color:#7FB069;font-family:Georgia,serif;margin:8px 0">Bucataria lui Panda</h1>
          <p style="color:rgba(255,255,255,.5);margin:0">Retete cu sarcasm. Verificate de panda.</p>
        </div>
        <div style="background:#f9f9f7;padding:32px;border-radius:0 0 16px 16px">
          <h2 style="color:#2B2B2B">Ai intrat in gaura de bambus a lui Panda 🎋</h2>
          <p>Panda confirma: contul tau este creat. El e surprins ca te-ai inscris, dar aproba decizia. <i>Putin.</i></p>
          <p>Ce poti face acum:</p>
          <ul style="line-height:2">
            <li>🔍 Cere Panda-ului sa gaseasca retete din ce ai in casa</li>
            <li>🔖 Salveaza-ti retetele preferate</li>
            <li>🎋 Propune o reteta noua pentru comunitate</li>
          </ul>
          <p style="font-size:12px;color:#999;margin-top:24px">PS: Panda nu garanteaza ca retetele vor iesi exact ca in poza. Garanteaza doar sarcasticul.</p>
          ${btn('Mergi la Bucataria lui Panda 🐼', 'https://bucataria-lui-panda.vercel.app')}
        </div>
      </div>`
    },
    new_proposal: {
      to: 'Antonio.nula@gmail.com',
      subject: `🎋 Propunere noua de reteta!`,
      html: `<div style="${brandStyle}">
        <h2 style="color:#4E7C3F">Propunere noua de reteta 🎋</h2>
        <p><b>De la:</b> ${data?.email || 'anonim'}</p>
        <p><b>Trimisa la:</b> ${data?.timestamp}</p>
        <p><b>Continut:</b></p>
        <p style="background:#f5f5f5;padding:12px;border-radius:8px">${(data?.text || '').substring(0, 600)}</p>
        ${btn('Deschide Admin Panel', 'https://bucataria-lui-panda.vercel.app')}
      </div>`
    },
    reset_password: {
      to: data?.email,
      subject: `🔐 Resetare parola — Bucataria lui Panda`,
      html: `<div style="${brandStyle}">
        <div style="background:#1A1A1A;padding:32px;border-radius:16px 16px 0 0;text-align:center">
          <div style="font-size:48px">🔐</div>
          <h1 style="color:#7FB069;font-family:Georgia,serif;margin:8px 0">Bucataria lui Panda</h1>
        </div>
        <div style="background:#f9f9f7;padding:32px;border-radius:0 0 16px 16px">
          <h2 style="color:#2B2B2B">Ai uitat parola? Panda nu judeca.</h2>
          <p>Cineva (probabil tu) a cerut resetarea parolei pentru <b>${data?.email}</b>.</p>
          <p>Apasa butonul de mai jos — linkul expira in <b>1 ora</b>. Ca si rabdarea lui Panda.</p>
          ${btn('🔑 Reseteaza parola', data?.link || '#')}
          <p style="font-size:12px;color:#999;margin-top:24px">Daca nu ai cerut tu resetarea, ignora acest email. Panda te va ignora la randul lui. Fair.</p>
        </div>
      </div>`
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
        to: [tpl.to || 'Antonio.nula@gmail.com'],
        subject: tpl.subject,
        html: tpl.html
      })
    });
  } catch(e) {
    console.error('[Notify] Resend error:', e.message);
  }

  return res.status(200).json({ ok: true });
}
