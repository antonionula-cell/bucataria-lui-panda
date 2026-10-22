import admin from 'firebase-admin';

// Initializeaza Firebase Admin o singura data
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch(e) {
    console.error('[Delete] Firebase Admin init error:', e.message);
  }
}

const RECENT_LOGIN_SEC = 5 * 60; // ca regula Firebase "requires-recent-login"

// Sterge contul si tot ce e legat de el in Firestore (GDPR art. 17).
// Ruleaza pe server pentru ca regulile Firestore nu lasa userul sa stearga propuneri sau notificari.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { idToken } = req.body || {};
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken || '', true);
  } catch(e) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  if (Date.now() / 1000 - decoded.auth_time > RECENT_LOGIN_SEC) {
    return res.status(401).json({ error: 'requires-recent-login' });
  }

  const { uid, email } = decoded;
  const db = admin.firestore();
  try {
    const [byUid, byEmail, pending, published, publishedByEmail] = await Promise.all([
      db.collection('proposals').where('uid', '==', uid).get(),
      email ? db.collection('proposals').where('userEmail', '==', email).get() : null,
      db.collection('pendingRecipes').where('proposedByUid', '==', uid).get(),
      db.collection('publishedRecipes').where('proposedByUid', '==', uid).get(),
      email ? db.collection('publishedRecipes').where('proposedBy', '==', email).get() : null
    ]);
    const writes = [
      ...byUid.docs.map(d => d.ref.delete()),
      ...(byEmail?.docs || []).map(d => d.ref.delete()),
      ...pending.docs.map(d => d.ref.delete()),
      // Reteta publicata ramane pe site, fara cine a propus-o (retetele vechi aveau emailul)
      ...[...published.docs, ...(publishedByEmail?.docs || [])].map(d => d.ref.update({
        proposedBy: admin.firestore.FieldValue.delete(),
        proposedByUid: admin.firestore.FieldValue.delete()
      })),
      db.collection('notifications').doc(uid + '_reg').delete(),
      db.collection('users').doc(uid).delete()
    ];
    await Promise.all(writes);
    await admin.auth().deleteUser(uid);
  } catch(e) {
    console.error('[Delete] error:', e.message);
    return res.status(500).json({ error: 'Delete failed' });
  }
  return res.status(200).json({ ok: true });
}
