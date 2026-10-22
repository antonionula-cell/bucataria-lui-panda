import admin from 'firebase-admin';

// Initializeaza Firebase Admin o singura data
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch(e) {
    console.error('[PandaName] Firebase Admin init error:', e.message);
  }
}

// 200 de atribute pentru "Sunt lenes": "Al cincisprezecelea Panda Morocanos"
export const ATTRS = `
Happy Morocanos Somnoros Flamand Pofticios Chiaun Zapacit Fericit Bosumflat Mofturos
Lenes Grabit Agitat Zen Filosof Smecher Timid Curajos Galagios Tacut
Visator Pufos Rotofei Dolofan Mustacios Barbos Elegant Sifonat Ciufulit Glumet
Serios Sarcastic Ironic Dramatic Teatral Melancolic Nostalgic Romantic Poetic Muzical
Dansator Sportiv Obosit Matinal Nocturn Insomniac Cafegiu Gurmand Mancacios Lacom
Infometat Dulce Picant Iute Acrisor Crocant Caramelizat Prajit Afumat Rumen
Ciocolatiu Piperat Filfizon Mucalit Hazliu Poznas Strengar Neastamparat Obraznic Rasfatat
Pretentios Fudul Mandru Increzut Rusinos Sfios Fricos Viteaz Neinfricat Aventurier
Explorator Hoinar Vagabond Boem Artist Bucatar Cofetar Brutar Patiser Gospodar
Harnic Tocilar Savant Profesor Detectiv Ninja Samurai Pirat Cowboy Haiduc
Voievod Boier Imparat Capitan Amiral Astronaut Vrajitor Magician Ametit Buimac
Zgribulit Bronzat Auriu Buclat Pletos Zambaret Vesel Ursuz Bombanitor Carcotas
Barfitor Vorbaret Guraliv Misterios Enigmatic Discret Spion Optimist Pesimist Realist
Cinic Stoic Calm Relaxat Stresat Nervos Exploziv Vulcanic Energic Hiperactiv
Dinamic Rapid Fulger Intarziat Uituc Distrat Meticulos Haotic Mititel Sarmalist
Ciorbagiu Placintar Covrigar Gogosar Mamaligar Clatitar Fitos Bengos Barosan Insorit
Ploios Furtunos Adormit Toropit Mahmur Legendar Epic Mitic Faimos Celebru
Anonim Incognito Bizar Ciudat Excentric Original Genial Istet Siret Naiv
Sceptic Curios Bagacios Nerabdator Incapatanat Rebel Politicos Galant Cavaler Fermecator
Cochet Generos Zgarcit Risipitor Rontaitor Sforaitor Ingandurat Zvelt Sofisticat Bambusar
`.split(/\s+/).filter(Boolean);

const U     = ['', 'unu', 'doi', 'trei', 'patru', 'cinci', 'sase', 'sapte', 'opt', 'noua'];
const TEEN  = ['zece', 'unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece', 'saisprezece', 'saptesprezece', 'optsprezece', 'nouasprezece'];
const TENS  = ['', '', 'douazeci', 'treizeci', 'patruzeci', 'cincizeci', 'saizeci', 'saptezeci', 'optzeci', 'nouazeci'];
const HUND  = ['', 'o suta', 'doua sute', 'trei sute', 'patru sute', 'cinci sute', 'sase sute', 'sapte sute', 'opt sute', 'noua sute'];

// Numeral cardinal masculin, 1..999
function cardinal(n) {
  const h = Math.floor(n / 100), r = n % 100, parts = [];
  if (h) parts.push(HUND[h]);
  if (r >= 20) parts.push(TENS[Math.floor(r / 10)] + (r % 10 ? ' si ' + U[r % 10] : ''));
  else if (r >= 10) parts.push(TEEN[r - 10]);
  else if (r) parts.push(U[r]);
  return parts.join(' ');
}

// 1 → "Primul Panda Happy", 15 → "Al cincisprezecelea Panda Happy"; peste 999 → "Panda Happy nr. 1000"
export function pandaName(attr, n) {
  if (n > 999) return `Panda ${attr} nr. ${n}`;
  if (n === 1) return `Primul Panda ${attr}`;
  const c = cardinal(n);
  return `Al ${c}${c.endsWith('t') ? 'ulea' : 'lea'} Panda ${attr}`;
}

const MAX_NAME = 40;
const counters = () => admin.firestore().collection('stats').doc('pandaNames');

// Fara idToken: propune un nume (nu rezerva numarul).
// Cu idToken: salveaza numele ales ({ name }) sau unul automat ({ attr }), cu numarul de ordine definitiv.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { idToken, name, attr } = req.body || {};

  if (!idToken) {
    const pick = ATTRS[Math.floor(Math.random() * ATTRS.length)];
    try {
      const snap = await counters().get();
      return res.status(200).json({ attr: pick, name: pandaName(pick, (snap.get(pick) || 0) + 1) });
    } catch(e) {
      console.error('[PandaName] preview error:', e.message);
      return res.status(500).json({ error: 'Preview failed' });
    }
  }

  let uid;
  try {
    uid = (await admin.auth().verifyIdToken(idToken)).uid;
  } catch(e) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  try {
    let finalName;
    if (typeof name === 'string' && name.trim()) {
      finalName = name.trim().replace(/\s+/g, ' ');
      // Fara HTML si fara adrese de email: numele apare public pe retete
      if (finalName.length < 2 || finalName.length > MAX_NAME || /[<>@]/.test(finalName)) {
        return res.status(400).json({ error: 'invalid-name' });
      }
    } else {
      const pick = ATTRS.includes(attr) ? attr : ATTRS[Math.floor(Math.random() * ATTRS.length)];
      finalName = await admin.firestore().runTransaction(async t => {
        const snap = await t.get(counters());
        const n = (snap.get(pick) || 0) + 1;
        t.set(counters(), { [pick]: n }, { merge: true });
        return pandaName(pick, n);
      });
    }
    await admin.firestore().collection('users').doc(uid).set({ name: finalName }, { merge: true });
    return res.status(200).json({ name: finalName });
  } catch(e) {
    console.error('[PandaName] save error:', e.message);
    return res.status(500).json({ error: 'Save failed' });
  }
}
