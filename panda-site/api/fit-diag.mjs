// Diagnostic temporar: de ce crapa API-urile Panda Fit. Se sterge imediat.
export default async function handler(req, res) {
  const out = { node: process.version };
  for (const m of ['firebase-admin', '../fit/alimente.js', '../fit/core.js', './fit-plan.mjs', './fit-jurnal.mjs']) {
    try { const x = await import(m); out[m] = 'ok ' + Object.keys(x).join(','); }
    catch(e) { out[m] = 'EROARE: ' + String(e && e.stack || e).slice(0, 400); }
  }
  res.status(200).json(out);
}
