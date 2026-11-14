import admin from 'firebase-admin';
import { ALIMENTE, ALIMENTE_BY_ID } from '../fit/alimente.js';

// Initializeaza Firebase Admin o singura data
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch(e) {
    console.error('[FitJurnal] Firebase Admin init error:', e.message);
  }
}

const PE_ZI = 30;          // texte intelese pe zi, de user
const MAX_TEXT = 300;

// Jurnalul in text liber: „2 oua, o felie de paine, un iaurt grecesc”.
// Gemini doar recunoaste alimentele si gramele; valorile le calculeaza pagina din alimente.js.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { idToken, text } = req.body || {};
  let uid;
  try {
    uid = (await admin.auth().verifyIdToken(idToken || '')).uid;
  } catch(e) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const t = String(text || '').trim().slice(0, MAX_TEXT);
  if (!t) return res.status(400).json({ error: 'gol' });

  // Limita zilnica, tinuta pe server (colectie fara acces din browser)
  const db = admin.firestore();
  const azi = new Date().toISOString().slice(0, 10);
  const ref = db.collection('fitUsage').doc(uid);
  const ok = await db.runTransaction(async tx => {
    const u = (await tx.get(ref)).data() || {};
    const n = u.zi === azi ? u.n : 0;
    if (n >= PE_ZI) return false;
    tx.set(ref, { zi: azi, n: n + 1 });
    return true;
  });
  if (!ok) return res.status(429).json({ error: 'limita', limita: PE_ZI });

  const lista = ALIMENTE.map(a => a.id + ' = ' + a.nume + (a.u ? ' (1 ' + a.u.nume + ' = ' + a.u.g + ' g)' : '')).join('\n');
  const prompt = `Transforma ce a mancat omul in alimente din lista, cu gramele estimate.
Daca e o unitate (bucata, felie, lingura), foloseste gramele din lista. Daca nu scrie cantitatea, estimeaza o portie obisnuita.
Ce nu exista in lista pune la "necunoscute", cu textul original.
Returneaza DOAR JSON: {"items":[{"id":"ou","grame":100}],"necunoscute":["sarmale"]}

TEXT: ${JSON.stringify(t)}

ALIMENTE:
${lista}`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1024, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } }
        })
      }
    );
    if (!resp.ok) throw new Error('Gemini ' + resp.status);
    const data = await resp.json();
    const raw = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    const out = JSON.parse(raw);
    const items = (out.items || [])
      .filter(it => ALIMENTE_BY_ID[it.id] && it.grame > 0 && it.grame <= 3000)
      .map(it => ({ id: it.id, grame: Math.round(it.grame) }));
    const necunoscute = (out.necunoscute || []).map(x => String(x).slice(0, 60)).slice(0, 10);
    return res.status(200).json({ items, necunoscute });
  } catch(e) {
    console.error('[FitJurnal] error:', e.message);
    return res.status(502).json({ error: 'ai' });
  }
}
