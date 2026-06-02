// ── In-memory rate limit store ──
// { ip: { count, resetAt } }
const rateLimitStore = {};

const LIMIT = 5;                    // max requests per IP per window
const WINDOW_MS = 15 * 60 * 1000;  // 15 minute window per IP

// ── Global daily cap (cross-user, anti-cost protection) ──
const DAILY_GLOBAL_CAP = 200;       // max total requests per day pe intregul server
const AUTO_KILL_THRESHOLD = 150;    // activeaza kill switch automat la 150 req/zi
let globalDaily = { count: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 };

// ── Seteaza GEMINI_DISABLED=true via Netlify API ──
async function activateKillSwitch() {
  const token  = process.env.NETLIFY_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;
  if (!token || !siteId) return;
  try {
    await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/env`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        GEMINI_DISABLED: [{ context: 'all', value: 'true' }]
      })
    });
    console.log('[KillSwitch] GEMINI_DISABLED=true activat automat la', globalDaily.count, 'requesturi');
  } catch(e) {
    console.error('[KillSwitch] Eroare la activare:', e.message);
  }
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore[ip];

  if (!entry || now > entry.resetAt) {
    // First request sau window expirat — reset
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

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // ── Kill switch — seteaza GEMINI_DISABLED=true in Netlify env vars pentru oprire imediata ──
  if (process.env.GEMINI_DISABLED === 'true') {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'Functia AI e temporar dezactivata. Revino curand. 🐼' })
    };
  }

  // ── Global daily cap — protejeaza costurile ──
  const now = Date.now();
  if (now > globalDaily.resetAt) {
    globalDaily = { count: 0, resetAt: now + 24 * 60 * 60 * 1000 };
  }
  if (globalDaily.count >= DAILY_GLOBAL_CAP) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({
        error: 'Panda a gatit destul pentru azi. Limita zilnica de cautari a fost atinsa. Revino maine. 🐼💤'
      })
    };
  }
  globalDaily.count++;

  // Activeaza kill switch automat la prag
  if (globalDaily.count >= AUTO_KILL_THRESHOLD) {
    activateKillSwitch(); // async, fara await — nu blocam requestul curent
  }

  // ── Rate limiting by IP ──
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || event.headers['client-ip']
    || 'unknown';

  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({
        error: `Panda e obosit. Ai folosit toate cele ${LIMIT} incercari. Mai asteapta ${rl.resetIn} minute si revino. 🐼💤`
      })
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' })
    };
  }

  let prompt;
  try {
    const body = JSON.parse(event.body);
    prompt = body.prompt;
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!prompt) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing prompt' }) };
  }

  const RETRYABLE = new Set([503, 529]);
  const RETRY_DELAYS = [1000, 2000, 3000]; // ms intre incercari
  const MAX_ATTEMPTS = 4;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const geminiBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 4096,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  let lastErrText = '';
  let lastStatus  = 500;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAYS[attempt - 1]);
      console.log(`[Gemini] Retry ${attempt}/${MAX_ATTEMPTS - 1} dupa ${lastStatus}...`);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: geminiBody }
      );

      if (!response.ok) {
        lastStatus  = response.status;
        lastErrText = await response.text();
        if (RETRYABLE.has(response.status) && attempt < MAX_ATTEMPTS - 1) continue;
        return { statusCode: response.status, headers, body: JSON.stringify({ error: 'Gemini API error: ' + lastErrText }) };
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts.filter(p => !p.thought).map(p => p.text || '').join('\n')
        || parts.map(p => p.text || '').join('\n')
        || '';

      return { statusCode: 200, headers, body: JSON.stringify({ text }) };

    } catch(e) {
      lastErrText = e.message;
      if (attempt < MAX_ATTEMPTS - 1) continue;
    }
  }

  return { statusCode: lastStatus, headers, body: JSON.stringify({ error: 'Gemini API error: ' + lastErrText }) };
};
