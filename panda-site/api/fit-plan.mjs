import admin from 'firebase-admin';
import { necesar, ajusteazaPlan } from '../fit/core.js';
import { ALIMENTE } from '../fit/alimente.js';

// Initializeaza Firebase Admin o singura data
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch(e) {
    console.error('[FitPlan] Firebase Admin init error:', e.message);
  }
}

export const config = { maxDuration: 60 };

const ADMIN = 'antonio.nula@gmail.com';
const PLANURI_IMPLICIT = 3;            // planuri pe 7 zile, daca adminul n-a stabilit altceva
const SAPTAMANA = 7 * 24 * 3600 * 1000;
const MODURI = ['normal', 'proteic', 'carboload'];
const RESTRICTII = { vegetarian: 'fara carne si peste', post: 'de post: fara carne, peste, lactate si oua', 'fara-lactoza': 'fara lactate', 'fara-gluten': 'fara gluten (fara faina de grau, paste, paine, bulgur, cuscus, biscuiti)' };

// Planul alimentar Panda Fit: userul il cere, adminul il aproba, abia atunci se cheama Gemini.
// actiune: 'cere' (user) | 'aproba' / 'respinge' (admin)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { idToken, actiune } = req.body || {};
  let user;
  try {
    user = await admin.auth().verifyIdToken(idToken || '');
  } catch(e) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const db = admin.firestore();
  const esteAdmin = (user.email || '').toLowerCase() === ADMIN;

  try {
    if (actiune === 'cere') return await cere(req, res, db, user);
    if (!esteAdmin) return res.status(403).json({ error: 'Doar adminul' });
    if (actiune === 'aproba') return await aproba(req, res, db);
    if (actiune === 'respinge') {
      const ref = db.collection('fitPlans').doc(String(req.body.id || ''));
      await ref.update({ status: 'respins', motiv: String(req.body.motiv || '').slice(0, 200), gataLa: new Date().toISOString() });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Actiune necunoscuta' });
  } catch(e) {
    console.error('[FitPlan] error:', e.message);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function cere(req, res, db, user) {
  const mod = MODURI.includes(req.body.mod) ? req.body.mod : 'normal';
  const zile = req.body.zile === 3 ? 3 : 1;
  const profil = await db.collection('health').doc(user.uid).get();
  if (!profil.exists) return res.status(400).json({ error: 'fara-profil' });
  const n = necesar(profil.data(), mod);
  if (n.eroare || n.blocat) return res.status(400).json({ error: 'profil-blocat' });

  const planuri = await db.collection('fitPlans').where('uid', '==', user.uid).get();
  const recente = planuri.docs.map(d => d.data()).filter(p => Date.now() - Date.parse(p.creatLa) < SAPTAMANA && p.status !== 'respins');
  if (recente.some(p => p.status === 'cerut' || p.status === 'in-lucru')) return res.status(409).json({ error: 'deja-cerut' });
  const userDoc = await db.collection('users').doc(user.uid).get();
  const limita = Number.isInteger(userDoc.get('fitPlanuri')) ? userDoc.get('fitPlanuri') : PLANURI_IMPLICIT;
  if (recente.length >= limita) return res.status(429).json({ error: 'limita', limita });

  const ref = await db.collection('fitPlans').add({
    uid: user.uid, nume: userDoc.get('name') || 'fara nume', mod, zile,
    status: 'cerut', creatLa: new Date().toISOString()
  });
  return res.status(200).json({ id: ref.id, ramase: limita - recente.length - 1 });
}

async function aproba(req, res, db) {
  const ref = db.collection('fitPlans').doc(String(req.body.id || ''));
  const plan = await ref.get();
  if (!plan.exists || plan.get('status') !== 'cerut') return res.status(409).json({ error: 'nu-e-cerut' });
  await ref.update({ status: 'in-lucru' });

  const { uid, mod, zile } = plan.data();
  const profil = (await db.collection('health').doc(uid).get()).data();
  const tinta = profil && necesar(profil, mod);
  if (!tinta || tinta.eroare || tinta.blocat) {
    await ref.update({ status: 'esuat', motiv: 'profil' });
    return res.status(400).json({ error: 'profil' });
  }

  // Prompt fara identitate: doar tintele, modul si restrictiile
  const restrictii = (profil.restrictii || []).filter(r => RESTRICTII[r]).map(r => RESTRICTII[r]);
  let rezultat = null, feedback = '';
  for (let incercare = 0; incercare < 2 && !rezultat; incercare++) {
    const ai = await gemini(prompt(tinta, zile, restrictii, feedback));
    const zileAjustate = (ai?.zile || []).slice(0, zile).map(z => ajusteazaPlan(z.mese, tinta));
    if (zileAjustate.length === zile && zileAjustate.every(z => z.ok)) {
      rezultat = zileAjustate.map(z => ({ mese: z.mese, total: z.total }));
    } else {
      feedback = 'Incercarea anterioara nu a atins tintele (proteine prea putine sau calorii departe de tinta). Pune mai multe alimente bogate in proteine.';
    }
  }

  if (!rezultat) {
    await ref.update({ status: 'esuat', motiv: 'tinte', gataLa: new Date().toISOString() });
    return res.status(502).json({ error: 'tinte' });
  }
  await ref.update({
    status: 'gata', gataLa: new Date().toISOString(),
    tinta: { kcal: tinta.kcal, p: tinta.p, c: tinta.c, g: tinta.g },
    plan: rezultat
  });
  return res.status(200).json({ ok: true });
}

function prompt(t, zile, restrictii, feedback) {
  const lista = ALIMENTE.map(a => a.id + ' = ' + a.nume).join('\n');
  return `Esti nutritionist. Fa un plan alimentar pentru ${zile} ${zile === 1 ? 'zi' : 'zile'}, cu 3-4 mese pe zi, mancare romaneasca obisnuita, usor de gatit.
Tinta pe zi: ${t.kcal} kcal, ${t.p} g proteine, ${t.c} g carbohidrati, ${t.g} g grasimi.
${restrictii.length ? 'Restrictii: ' + restrictii.join('; ') + '.' : ''}
${feedback}
Foloseste DOAR alimente din lista de mai jos, cu ID-ul exact, si cantitatea in grame (crud sau gatit, cum scrie in nume).
Returneaza DOAR JSON: {"zile":[{"mese":[{"nume":"Mic dejun: ...","items":[{"id":"ou","grame":100}]}]}]}
Numele mesei: scurt, fara diacritice.

ALIMENTE:
${lista}`;
}

async function gemini(text) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } }
      })
    }
  );
  if (!resp.ok) throw new Error('Gemini ' + resp.status);
  const data = await resp.json();
  const raw = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
  try { return JSON.parse(raw); } catch(e) { return null; }
}
