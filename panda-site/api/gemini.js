// ── In-memory rate limit store ──
const rateLimitStore = {};
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

// ── Global daily cap ──
const DAILY_GLOBAL_CAP = 200;
const AUTO_KILL_THRESHOLD = 150;
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

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Kill switch
  if (process.env.GEMINI_DISABLED === 'true') {
    return res.status(503).json({ error: 'Functia AI e temporar dezactivata. Revino curand. 🐼' });
  }

  // Global daily cap
  const now = Date.now();
  if (now > globalDaily.resetAt) {
    globalDaily = { count: 0, resetAt: now + 24 * 60 * 60 * 1000 };
  }
  if (globalDaily.count >= DAILY_GLOBAL_CAP) {
    return res.status(429).json({ error: 'Panda a gatit destul pentru azi. Limita zilnica atinsa. Revino maine. 🐼💤' });
  }
  globalDaily.count++;

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || 'unknown';
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Panda e obosit. Ai folosit toate cele ${LIMIT} incercari. Mai asteapta ${rl.resetIn} minute. 🐼💤`
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Gemini API error: ' + errText });
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(p => !p.thought).map(p => p.text || '').join('\n')
      || parts.map(p => p.text || '').join('\n')
      || '';

    return res.status(200).json({ text });

  } catch(e) {
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
}
