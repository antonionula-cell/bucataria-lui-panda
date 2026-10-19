import admin from 'firebase-admin';

// Initializeaza Firebase Admin o singura data
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch(e) {
    console.error('[Image] Firebase Admin init error:', e.message);
  }
}

const ADMIN_EMAIL = 'antonio.nula@gmail.com';
// gemini-2.5-flash-image a fost oprit pe 2 oct 2026; 2.1 e recomandat, $0.0336 / imagine 1K
const MODEL = 'gemini-nano-banana-2.1';

// ── In-memory rate limit store ──
const rateLimitStore = {};
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

// ── Global daily cap ──
const DAILY_GLOBAL_CAP = 200;
let globalDaily = { count: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 };

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore[ip];
  if (!entry || now > entry.resetAt) {
    rateLimitStore[ip] = { count: 1, resetAt: now + WINDOW_MS };
    return { allowed: true, remaining: LIMIT - 1, resetIn: Math.ceil(WINDOW_MS / 60000) };
  }
  if (entry.count >= LIMIT) {
    const resetIn = Math.ceil((entry.resetAt - now) / 60000);
    return { allowed: false, remaining: 0, resetIn };
  }
  entry.count++;
  return { allowed: true, remaining: LIMIT - entry.count, resetIn: Math.ceil((entry.resetAt - now) / 60000) };
}

// Doar adminul genereaza imagini: identitatea vine din ID token-ul Firebase
async function isAdmin(idToken) {
  if (!idToken) return false;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (decoded.email?.toLowerCase() === ADMIN_EMAIL) return true;
    const snap = await admin.firestore().doc(`users/${decoded.uid}`).get();
    return snap.exists && snap.data().role === 'admin';
  } catch(e) {
    return false;
  }
}

function buildPrompt(titlu, ingrediente) {
  return `Professional food photograph of the finished dish "${titlu}"`
    + (ingrediente.length ? `, made with ${ingrediente.join(', ')}` : '')
    + '. The dish is served on a plate, shot from a 45 degree angle, natural window daylight, '
    + 'soft shadows, neutral light background, shallow depth of field, appetizing and realistic. '
    + 'No text, no letters, no logos, no watermark, no people, no hands.';
}

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = ['https://bucatarialuipanda.ro', 'https://www.bucatarialuipanda.ro', 'https://bucataria-lui-panda.vercel.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  else res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Kill switch
  if (process.env.GEMINI_DISABLED === 'true') {
    return res.status(503).json({ error: 'Functia AI e temporar dezactivata.' });
  }

  const { titlu, ingrediente = [], idToken } = req.body || {};
  if (typeof titlu !== 'string' || !titlu.trim() || titlu.length > 200) {
    return res.status(400).json({ error: 'Missing titlu' });
  }
  if (!Array.isArray(ingrediente) || !ingrediente.every(i => typeof i === 'string')) {
    return res.status(400).json({ error: 'Invalid ingrediente' });
  }

  if (!(await isAdmin(idToken))) return res.status(403).json({ error: 'Doar adminul genereaza imagini.' });

  // Global daily cap
  const now = Date.now();
  if (now > globalDaily.resetAt) {
    globalDaily = { count: 0, resetAt: now + 24 * 60 * 60 * 1000 };
  }
  if (globalDaily.count >= DAILY_GLOBAL_CAP) {
    return res.status(429).json({ error: 'Limita zilnica de imagini atinsa. Revino maine.' });
  }
  globalDaily.count++;

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || 'unknown';
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Ai folosit toate cele ${LIMIT} imagini. Mai asteapta ${rl.resetIn} minute.`
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const prompt = buildPrompt(titlu.trim(), ingrediente.slice(0, 6).map(i => i.slice(0, 60)));

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        model: MODEL,
        input: [{ type: 'text', text: prompt }],
        response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '4:3', image_size: '1K' },
        store: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Gemini API error: ' + errText });
    }

    const data = await response.json();
    const image = (data.steps || [])
      .filter(s => s.type === 'model_output')
      .flatMap(s => s.content || [])
      .filter(c => c.type === 'image' && c.data)
      .pop();
    if (!image) return res.status(502).json({ error: 'Gemini nu a intors nicio imagine.' });

    return res.status(200).json({ dataUrl: `data:${image.mime_type || 'image/jpeg'};base64,${image.data}` });

  } catch(e) {
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
}
