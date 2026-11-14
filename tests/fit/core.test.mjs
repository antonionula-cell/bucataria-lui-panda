// Testele calculelor Panda Fit. Rulare: node --test tests/fit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bmr, necesar, totaluri, ajusteazaPlan, tendinta, ajustareCalorii, validProfil, MIN_KCAL } from '../../panda-site/fit/core.js';
import { ALIMENTE } from '../../panda-site/fit/alimente.js';

const om = { sex: 'm', kg: 80, cm: 180, varsta: 30, activitate: 'moderat', obiectiv: 'mentinere' };

test('BMR Mifflin-St Jeor pentru M, F si „prefer sa nu spun” (media)', () => {
  assert.equal(bmr(om), 1780);
  assert.equal(bmr({ ...om, sex: 'f' }), 1614);
  assert.equal(bmr({ ...om, sex: 'x' }), 1697);
});

test('mentinere: calorii = BMR × activitate, proteine 1,6 g/kg, restul carbohidrati', () => {
  const n = necesar(om);
  assert.equal(n.tdee, 2759);
  assert.equal(n.kcal, 2760);
  assert.equal(n.p, 128);
  assert.equal(n.g, 64);
  assert.equal(n.c, 418);
});

test('slabire: deficit de cel mult 500 kcal si proteine 2 g/kg', () => {
  const n = necesar({ ...om, obiectiv: 'slabire' });
  assert.equal(n.kcal, 2260);
  assert.equal(n.p, 160);
});

test('masa: surplus de 10%, dar cel mult 300 kcal', () => {
  assert.equal(necesar({ ...om, obiectiv: 'masa' }).kcal, 3030);
  assert.equal(necesar({ ...om, kg: 110, obiectiv: 'masa', activitate: 'foarte' }).kcal - necesar({ ...om, kg: 110, activitate: 'foarte' }).kcal, 300);
});

test('sub 18 ani nu facem deficit', () => {
  const n = necesar({ ...om, varsta: 17, obiectiv: 'slabire' });
  assert.equal(n.obiectiv, 'mentinere');
  assert.ok(n.note.some(t => t.includes('18 ani')));
});

test('la IMC sub 18,5 nu facem deficit', () => {
  const n = necesar({ ...om, kg: 55, cm: 180, obiectiv: 'slabire' });
  assert.equal(n.obiectiv, 'mentinere');
});

test('caloriile nu coboara sub minim', () => {
  const n = necesar({ sex: 'f', kg: 45, cm: 150, varsta: 60, activitate: 'sedentar', obiectiv: 'slabire' });
  assert.equal(n.kcal, MIN_KCAL.f);
  assert.ok(n.note.some(t => t.includes('minimul')));
});

test('afectiunile blocheaza calculul si trimit la medic', () => {
  const n = necesar({ ...om, afectiuni: ['sarcina'] });
  assert.equal(n.blocat, true);
  assert.equal(n.kcal, undefined);
});

test('profil invalid: valorile in afara limitelor sunt refuzate', () => {
  assert.deepEqual(validProfil({ ...om, kg: 20, varsta: 12 }), ['kg', 'varsta']);
  assert.ok(necesar({ ...om, cm: 300 }).eroare);
});

test('ziua proteica: 2,2 g/kg', () => {
  assert.equal(necesar(om, 'proteic').p, 176);
});

test('carbo load: 10 g carbohidrati pe kg, cu avertisment', () => {
  const n = necesar(om, 'carboload');
  assert.equal(n.c, 800);
  assert.ok(n.note.some(t => t.includes('sportivi')));
});

test('la IMC peste 30 proteinele se calculeaza din greutatea de referinta', () => {
  assert.equal(necesar({ ...om, kg: 120, cm: 175 }).p, 123);
});

test('totaluri din baza de alimente; ce nu exista ajunge separat', () => {
  const t = totaluri([{ id: 'ou', grame: 100 }, { id: 'nu-exista', grame: 50 }]);
  assert.equal(t.kcal, 143);
  assert.equal(t.p, 13);
  assert.deepEqual(t.necunoscute, [{ id: 'nu-exista', grame: 50 }]);
});

test('planul AI e scalat la calorii, iar proteinele prea mici il resping', () => {
  const tinta = { kcal: 2000, p: 150 };
  const bun = ajusteazaPlan([{ nume: 'Pranz', items: [{ id: 'piept-pui', grame: 600 }, { id: 'orez-crud', grame: 250 }] }], tinta);
  assert.equal(bun.ok, true);
  assert.ok(Math.abs(bun.total.kcal - 2000) <= 140);
  assert.ok(bun.mese[0].items.every(it => it.grame % 5 === 0));

  const slab = ajusteazaPlan([{ nume: 'Desert', items: [{ id: 'zahar', grame: 400 }] }], tinta);
  assert.equal(slab.ok, false);
});

test('planul ignora alimentele inventate de AI', () => {
  const r = ajusteazaPlan([{ nume: 'X', items: [{ id: 'aliment-inventat', grame: 100 }] }], { kcal: 2000, p: 100 });
  assert.equal(r.ok, false);
  assert.equal(r.motiv, 'gol');
});

const zile = (n, kgStart, kgPeZi) => Array.from({ length: n }, (_, i) => ({
  data: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10), kg: kgStart + kgPeZi * i
}));

test('tendinta greutatii in kg pe saptamana', () => {
  assert.equal(tendinta(zile(15, 80, -0.1)).kgPeSaptamana, -0.7);
  assert.equal(tendinta([{ data: '2026-01-01', kg: 80 }]), null);
});

test('ajustarea caloriilor: abia dupa 14 zile, limitata la ±200 kcal', () => {
  assert.equal(ajustareCalorii(zile(10, 80, 0), 'slabire', 80), null);
  assert.equal(ajustareCalorii(zile(21, 80, 0), 'slabire', 80).kcal, -200);
  assert.equal(ajustareCalorii(zile(21, 80, 0), 'mentinere', 80).kcal, 0);
  assert.equal(ajustareCalorii(zile(21, 80, -0.2), 'mentinere', 80).kcal, 200);
});

test('baza de alimente: ID-uri unice, valori plauzibile (kcal ≈ 4p + 4c + 9g)', () => {
  const ids = ALIMENTE.map(a => a.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const a of ALIMENTE) {
    if (['bere', 'vin'].includes(a.id)) continue; // alcoolul are calorii proprii
    if (a.id === 'cacao') continue; // carbohidratii sunt mai mult fibre (USDA), care nu dau calorii
    const calc = 4 * a.p + 4 * a.c + 9 * a.g;
    assert.ok(Math.abs(calc - a.kcal) <= Math.max(25, a.kcal * 0.2), `${a.id}: ${a.kcal} kcal, din macro ${Math.round(calc)}`);
  }
});
