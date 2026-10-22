import admin from 'firebase-admin';

// Initializeaza Firebase Admin o singura data
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch(e) {
    console.error('[Propose] Firebase Admin init error:', e.message);
  }
}

const MAX_TEXT = 2000;
const MAX_PHOTOS_CHARS = 900 * 1024; // documentul Firestore are limita de 1MB

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('[Propose] TURNSTILE_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const { text = '', photos = [], token, idToken, anonymous = false } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Missing token' });
  if (typeof text !== 'string' || text.length > MAX_TEXT) return res.status(400).json({ error: 'Invalid text' });
  if (!Array.isArray(photos) || !photos.every(p => typeof p?.dataUrl === 'string' && p.dataUrl.startsWith('data:image/'))) {
    return res.status(400).json({ error: 'Invalid photos' });
  }
  if (!text.trim() && !photos.length) return res.status(400).json({ error: 'Empty proposal' });
  if (photos.reduce((n, p) => n + p.dataUrl.length, 0) > MAX_PHOTOS_CHARS) {
    return res.status(413).json({ error: 'Photos too large' });
  }

  // Valideaza tokenul Turnstile la Cloudflare
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'];
  try {
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, ...(ip && { remoteip: ip }) })
    });
    const result = await verify.json();
    if (!result.success) {
      return res.status(403).json({ error: 'Turnstile failed', codes: result['error-codes'] });
    }
  } catch(e) {
    console.error('[Propose] Siteverify error:', e.message);
    return res.status(502).json({ error: 'Verification unavailable' });
  }

  // Identitatea vine din ID token-ul Firebase, nu din ce declara clientul
  let uid = null, userEmail = 'anonim';
  if (idToken) {
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
      userEmail = decoded.email || 'anonim';
    } catch(e) {
      return res.status(401).json({ error: 'Invalid session' });
    }
  }

  // Numele public vine din profil, doar daca userul nu a ales "anonim"
  let author = null;
  if (uid && !anonymous) {
    try { author = (await admin.firestore().collection('users').doc(uid).get()).get('name') || null; } catch(e) {}
  }

  const now = new Date();
  const timestampDisplay = now.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' });
  try {
    await admin.firestore().collection('proposals').add({
      text: text.trim(),
      photos: photos.map(p => ({ name: String(p.name || 'poza.jpg').slice(0, 120), dataUrl: p.dataUrl })),
      timestamp: now.toISOString(),
      timestampDisplay,
      status: 'pending',
      uid,
      userEmail,
      author
    });
  } catch(e) {
    console.error('[Propose] Firestore error:', e.message);
    return res.status(500).json({ error: 'Server error' });
  }

  return res.status(200).json({ ok: true, userEmail, timestampDisplay });
}
