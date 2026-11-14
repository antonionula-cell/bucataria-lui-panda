// Diagnostic temporar: de ce crapa API-urile Panda Fit. Se sterge imediat.
import admin from 'firebase-admin';
export default async function handler(req, res) {
  const out = { node: process.version, admin: typeof admin, apps: typeof admin?.apps };
  const incearca = async (nume, f) => { try { out[nume] = await f(); } catch(e) { out[nume] = 'EROARE: ' + String(e && e.stack || e).slice(0, 500); } };
  await incearca('alimente', async () => (await import('../fit/alimente.js')).ALIMENTE.length);
  await incearca('core', async () => Object.keys(await import('../fit/core.js')).length);
  await incearca('jurnal', async () => typeof (await import('./fit-jurnal.mjs')).default);
  await incearca('plan', async () => typeof (await import('./fit-plan.mjs')).default);
  res.status(200).json(out);
}
