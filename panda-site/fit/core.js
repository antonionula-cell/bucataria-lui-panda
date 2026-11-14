// Panda Fit — calculele. Fara DOM si fara retea: acelasi cod ruleaza in pagina, pe server si in teste.
// Regula: cifrele vin de aici si din alimente.js, niciodata din AI.
import { ALIMENTE_BY_ID } from './alimente.js';

export const ACTIVITATI = {
  sedentar: { nume: 'Sedentar (birou, putina miscare)', factor: 1.2 },
  usor:     { nume: 'Usor activ (sport 1–3 zile pe saptamana)', factor: 1.375 },
  moderat:  { nume: 'Moderat (sport 3–5 zile)', factor: 1.55 },
  activ:    { nume: 'Activ (sport 6–7 zile)', factor: 1.725 },
  foarte:   { nume: 'Foarte activ (munca fizica + sport)', factor: 1.9 }
};

export const OBIECTIVE = {
  slabire:   { nume: 'Slabire' },
  mentinere: { nume: 'Mentinere' },
  masa:      { nume: 'Masa musculara' }
};

// Afectiuni la care Panda nu face plan si trimite la medic
export const AFECTIUNI = {
  sarcina:  'Sarcina',
  alaptare: 'Alaptare',
  diabet:   'Diabet',
  rinichi:  'Boala de rinichi',
  tulburari:'Tulburari de alimentatie (acum sau in trecut)'
};

export const LIMITE = { kg: [30, 300], cm: [120, 230], varsta: [16, 100] };
// Minimul de calorii sub care nu coboram niciodata
export const MIN_KCAL = { m: 1500, f: 1200, x: 1350 };

const round = (n, step = 1) => Math.round(n / step) * step;

// Verifica profilul; intoarce lista de probleme (goala = valid)
export function validProfil(p) {
  const err = [];
  const inRange = (v, [a, b]) => Number.isFinite(v) && v >= a && v <= b;
  if (!['m', 'f', 'x'].includes(p.sex)) err.push('sex');
  if (!inRange(p.kg, LIMITE.kg)) err.push('kg');
  if (!inRange(p.cm, LIMITE.cm)) err.push('cm');
  if (!inRange(p.varsta, LIMITE.varsta)) err.push('varsta');
  if (!ACTIVITATI[p.activitate]) err.push('activitate');
  if (!OBIECTIVE[p.obiectiv]) err.push('obiectiv');
  return err;
}

export function imc(kg, cm) {
  return kg / ((cm / 100) ** 2);
}

// Mifflin-St Jeor; la „prefer sa nu spun” media celor doua formule
export function bmr({ sex, kg, cm, varsta }) {
  const baza = 10 * kg + 6.25 * cm - 5 * varsta;
  return baza + (sex === 'm' ? 5 : sex === 'f' ? -161 : -78);
}

// Greutatea folosita la proteine: la IMC peste 30, greutatea corespunzatoare IMC 25
export function kgReferinta({ kg, cm }) {
  return imc(kg, cm) > 30 ? 25 * (cm / 100) ** 2 : kg;
}

// Necesarul zilnic: calorii si macro, cu limitele de siguranta aplicate.
// Intoarce si `note` (ce s-a schimbat si de ce) si `blocat` (afectiuni: fara plan).
export function necesar(p, mod = 'normal') {
  const err = validProfil(p);
  if (err.length) return { eroare: err };

  const note = [];
  const afectiuni = (p.afectiuni || []).filter(a => AFECTIUNI[a]);
  if (afectiuni.length) {
    return { blocat: true, afectiuni, note: ['Pentru ' + afectiuni.map(a => AFECTIUNI[a].toLowerCase()).join(', ') + ' necesarul il stabileste medicul sau nutritionistul. Panda nu se baga aici.'] };
  }

  const tdee = bmr(p) * ACTIVITATI[p.activitate].factor;
  let obiectiv = p.obiectiv;
  const imcVal = imc(p.kg, p.cm);
  if (obiectiv === 'slabire' && p.varsta < 18) { obiectiv = 'mentinere'; note.push('Sub 18 ani nu facem deficit caloric. Calculul e pentru mentinere.'); }
  if (obiectiv === 'slabire' && imcVal < 18.5) { obiectiv = 'mentinere'; note.push('IMC-ul e sub 18,5, deci nu facem deficit caloric. Calculul e pentru mentinere.'); }

  let kcal = tdee;
  if (obiectiv === 'slabire') kcal = tdee - Math.min(500, tdee * 0.2);
  if (obiectiv === 'masa') kcal = tdee + Math.min(300, tdee * 0.1);

  const ref = kgReferinta(p);
  let pG, gG, cG;
  if (mod === 'carboload') {
    // 8–12 g/kg cu 36–48 h inainte de efort lung; luam 10 g/kg, grasimi putine
    cG = 10 * p.kg; pG = 1.4 * ref; gG = 0.6 * p.kg;
    kcal = pG * 4 + cG * 4 + gG * 9;
    note.push('Carbo load e pentru sportivi, cu 1–2 zile inainte de un efort lung (maraton, ciclism). Nu e o dieta de zi cu zi.');
  } else {
    const protKg = mod === 'proteic' ? 2.2 : obiectiv === 'slabire' ? 2.0 : obiectiv === 'masa' ? 1.8 : 1.6;
    pG = protKg * ref;
    gG = Math.max(0.8 * p.kg, (kcal * 0.2) / 9);
    if (mod === 'proteic') gG = Math.max(0.7 * p.kg, (kcal * 0.2) / 9);
  }

  const min = MIN_KCAL[p.sex];
  if (kcal < min) { kcal = min; note.push('Am ridicat caloriile la minimul de ' + min + ' kcal. Mai jos de atat nu coboram.'); }
  if (mod !== 'carboload') cG = Math.max(0, (kcal - pG * 4 - gG * 9) / 4);

  return {
    bmr: round(bmr(p)), tdee: round(tdee), kcal: round(kcal, 10),
    p: round(pG), c: round(cG), g: round(gG),
    imc: Math.round(imcVal * 10) / 10, obiectiv, mod, note
  };
}

// Valorile unui aliment pentru o cantitate in grame
export function valori(id, grame) {
  const a = ALIMENTE_BY_ID[id];
  if (!a || !(grame > 0)) return null;
  const f = grame / 100;
  return { kcal: a.kcal * f, p: a.p * f, c: a.c * f, g: a.g * f };
}

// Suma unei liste [{ id, grame }]; ce nu e in baza de date ajunge in `necunoscute`
export function totaluri(items) {
  const t = { kcal: 0, p: 0, c: 0, g: 0 }, necunoscute = [];
  for (const it of items || []) {
    const v = valori(it.id, it.grame);
    if (!v) { necunoscute.push(it); continue; }
    t.kcal += v.kcal; t.p += v.p; t.c += v.c; t.g += v.g;
  }
  return { kcal: round(t.kcal), p: round(t.p), c: round(t.c), g: round(t.g), necunoscute };
}

// Planul de la AI: [{ nume, items: [{ id, grame }] }]. Scalam portiile ca sa iasa caloriile,
// apoi verificam proteinele. Gramele se rotunjesc la 5. `ok` = tintele sunt atinse.
export function ajusteazaPlan(mese, tinta) {
  const curate = (mese || []).map(m => ({
    nume: String(m.nume || 'Masa').slice(0, 80),
    items: (m.items || []).filter(it => ALIMENTE_BY_ID[it.id] && it.grame > 0)
  })).filter(m => m.items.length);
  const toate = curate.flatMap(m => m.items);
  const inainte = totaluri(toate);
  if (!inainte.kcal) return { ok: false, motiv: 'gol', mese: [] };

  const factor = Math.min(1.6, Math.max(0.6, tinta.kcal / inainte.kcal));
  const scalate = curate.map(m => ({
    nume: m.nume,
    items: m.items.map(it => ({ id: it.id, grame: Math.max(5, round(it.grame * factor, 5)) })),
  })).map(m => ({ ...m, total: totaluri(m.items) }));
  const total = totaluri(scalate.flatMap(m => m.items));

  const inInterval = (v, t, tol) => Math.abs(v - t) <= t * tol;
  const ok = inInterval(total.kcal, tinta.kcal, 0.07) && total.p >= tinta.p * 0.9;
  return { ok, motiv: ok ? '' : 'tinte', mese: scalate, total };
}

// Tendinta greutatii (kg pe saptamana), regresie liniara pe ultimele zile cantarite
export function tendinta(cantariri) {
  const pts = (cantariri || []).filter(c => c.kg > 0 && c.data).map(c => ({ x: Date.parse(c.data) / 86400000, y: c.kg }))
    .sort((a, b) => a.x - b.x);
  if (pts.length < 2) return null;
  const zile = pts[pts.length - 1].x - pts[0].x;
  if (zile < 1) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length, my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0), den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  return { kgPeSaptamana: Math.round((num / den) * 7 * 100) / 100, zile: Math.round(zile) };
}

// Dupa minim 14 zile de cantariri: cu cat ajustam caloriile ca tendinta sa ajunga in tinta obiectivului.
// 7.700 kcal ≈ 1 kg; ajustarea e limitata la ±200 kcal/zi si rotunjita la 50.
export function ajustareCalorii(cantariri, obiectiv, kg) {
  const t = tendinta(cantariri);
  if (!t || t.zile < 14) return null;
  const tinta = obiectiv === 'slabire' ? -0.005 * kg : obiectiv === 'masa' ? 0.0025 * kg : 0;
  const toleranta = obiectiv === 'mentinere' ? 0.0025 * kg : 0.0015 * kg;
  const dif = t.kgPeSaptamana - tinta;
  if (Math.abs(dif) <= toleranta) return { tendinta: t, kcal: 0 };
  const kcal = Math.max(-200, Math.min(200, round((-dif * 7700) / 7, 50)));
  return { tendinta: t, kcal };
}
