// Panda Fit — pagina. Calculele sunt in core.js, alimentele in alimente.js.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, updateDoc, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { necesar, totaluri, valori, tendinta, ajustareCalorii, ACTIVITATI, AFECTIUNI, LIMITE } from './core.js';
import { ALIMENTE, ALIMENTE_BY_ID } from './alimente.js';

const app = initializeApp({
  apiKey: 'AIzaSyDw3LHs13FEelNbj8Dr0aBACUkgRnA-gE0',
  authDomain: 'bucataria-lui-panda.firebaseapp.com',
  projectId: 'bucataria-lui-panda',
  storageBucket: 'bucataria-lui-panda.firebasestorage.app',
  messagingSenderId: '349643691527',
  appId: '1:349643691527:web:957d6e3ed75e1c6bbffca2'
});
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = 'antonio.nula@gmail.com';
const CONSIMTAMANT = 'v1-2026-11-14';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const azi = () => new Date().toLocaleDateString('sv-SE'); // AAAA-LL-ZZ, ora locala
const num = v => parseFloat(String(v).replace(',', '.'));

let user = null, profil = null, numeUser = null;

// ── Panda zilei: despre mancare, niciodata despre corpul tau ──
const REPLICI = [
  'Proteinele nu apar din senin. Panda a verificat in frigider. De doua ori.',
  'Un iaurt grecesc e o gustare. Doua iaurturi grecesti sunt o decizie. Panda respecta ambele.',
  'Carbo load nu inseamna o tava de clatite la 11 noaptea. Panda a intrebat. I s-a spus nu.',
  'Legumele nu se numara la desert. Panda a incercat. Regulamentul e strict.',
  'Ovazul e plictisitor doar pana pui unt de arahide. Apoi e un stil de viata.',
  'Apa nu are calorii. Panda a cautat in baza de date. Nici bambusul nu e pe lista. Inca.',
  'Mananci de post si vrei proteine? Lintea, nautul si tofu au venit la interviu.',
  'Planul e un plan, nu o sentinta. Daca azi a iesit pizza, maine e tot zi.'
];
$('panda-zilei').textContent = REPLICI[Math.floor(Date.now() / 86400000) % REPLICI.length];

// ── Grupuri de butoane (alegere unica) ──
const ales = {};
document.querySelectorAll('[data-grup]').forEach(g => {
  const grup = g.dataset.grup;
  const on = g.querySelector('.tbtn.on');
  if (on) ales[grup] = on.dataset.v;
  g.addEventListener('click', e => {
    const b = e.target.closest('.tbtn');
    if (!b) return;
    g.querySelectorAll('.tbtn').forEach(x => x.classList.toggle('on', x === b));
    ales[grup] = b.dataset.v;
    if (grup === 'mod' && !$('rez').hidden) arataRezultat();
  });
});
function seteaza(grup, v) {
  const g = document.querySelector(`[data-grup="${grup}"]`);
  g.querySelectorAll('.tbtn').forEach(x => x.classList.toggle('on', x.dataset.v === v));
  ales[grup] = v;
}

$('activitate').innerHTML = Object.entries(ACTIVITATI).map(([k, a]) => `<option value="${k}">${esc(a.nume)}</option>`).join('');
$('activitate').value = 'usor';
$('afectiuni').innerHTML = Object.entries(AFECTIUNI).map(([k, n]) => `<label class="chk"><input type="checkbox" value="${k}">${esc(n)}</label>`).join('');
$('lista-alimente').innerHTML = ALIMENTE.map(a => `<option value="${esc(a.nume)}">`).join('');
$('j-zi').value = azi();

// ── Profilul din formular ──
function citesteProfil() {
  return {
    sex: ales.sex, varsta: parseInt($('varsta').value, 10), kg: num($('kg').value), cm: parseInt($('cm').value, 10),
    activitate: $('activitate').value, obiectiv: ales.obiectiv,
    restrictii: [...$('restrictii').querySelectorAll('input:checked')].map(i => i.value),
    afectiuni: [...$('afectiuni').querySelectorAll('input:checked')].map(i => i.value)
  };
}
function completeazaFormular(p) {
  if (p.sex) seteaza('sex', p.sex);
  if (p.obiectiv) seteaza('obiectiv', p.obiectiv);
  $('varsta').value = p.varsta ?? ''; $('kg').value = p.kg ?? ''; $('cm').value = p.cm ?? '';
  if (p.activitate) $('activitate').value = p.activitate;
  $('restrictii').querySelectorAll('input').forEach(i => { i.checked = (p.restrictii || []).includes(i.value); });
  $('afectiuni').querySelectorAll('input').forEach(i => { i.checked = (p.afectiuni || []).includes(i.value); });
}

const MESAJE = {
  sex: 'Alege sexul pentru formula.', varsta: `Varsta: intre ${LIMITE.varsta[0]} si ${LIMITE.varsta[1]} de ani.`,
  kg: `Greutatea: intre ${LIMITE.kg[0]} si ${LIMITE.kg[1]} kg.`, cm: `Inaltimea: intre ${LIMITE.cm[0]} si ${LIMITE.cm[1]} cm.`,
  activitate: 'Alege cat de activ esti.', obiectiv: 'Alege obiectivul.'
};

function arataRezultat() {
  const p = citesteProfil();
  const n = necesar(p, ales.mod || 'normal');
  $('calc-err').textContent = n.eroare ? n.eroare.map(e => MESAJE[e]).join(' ') : '';
  if (n.eroare) { $('rez').hidden = true; return null; }
  $('rez').hidden = false;
  const blocat = !!n.blocat;
  $('r-kcal').textContent = blocat ? '—' : n.kcal;
  // Fara cont, macro-urile nu ajung deloc in pagina (sub blur sunt doar semne de intrebare)
  const macro = v => blocat ? '—' : user ? v : '???';
  $('r-p').textContent = macro(n.p); $('r-c').textContent = macro(n.c); $('r-g').textContent = macro(n.g);
  $('r-detalii').textContent = blocat ? '' : `Metabolism bazal ${n.bmr} kcal · cu activitatea ${n.tdee} kcal · IMC ${String(n.imc).replace('.', ',')}`;
  $('r-note').innerHTML = (n.note || []).map(t => `<li>${esc(t)}</li>`).join('');
  // Fara cont: doar caloriile; restul blurat, cu invitatie la cont
  $('r-macros').classList.toggle('blur', !user);
  $('teaser').hidden = !!user;
  $('consimtamant').hidden = !user || !!profil;
  return n;
}
$('btn-calc').addEventListener('click', () => {
  if (arataRezultat() && user && profil) salveazaProfil(false);
});

// ── Consimtamant si salvare ──
async function salveazaProfil(primaData) {
  const p = citesteProfil();
  if (necesar(p).eroare) return;
  const date = {
    ...p,
    consimtamant: primaData ? CONSIMTAMANT : profil.consimtamant,
    consimtamantLa: primaData ? new Date().toISOString() : profil.consimtamantLa,
    actualizatLa: new Date().toISOString()
  };
  await setDoc(doc(db, 'health', user.uid), date);
  profil = date;
  $('salvat').hidden = false;
  $('consimtamant').hidden = true;
  deblocheaza();
}
$('btn-salveaza').addEventListener('click', async () => {
  if (!$('acord').checked) { $('salv-err').textContent = 'Bifeaza acordul ca sa salvam.'; return; }
  try { await salveazaProfil(true); } catch(e) { $('salv-err').textContent = 'N-a mers salvarea. Mai incearca.'; }
});

function deblocheaza() {
  document.querySelectorAll('[data-lock]').forEach(x => { x.hidden = !!profil; });
  document.querySelectorAll('[data-unlock]').forEach(x => { x.hidden = !profil; });
  $('date').hidden = !profil;
  if (profil) { incarcaJurnal(); incarcaGreutate(); incarcaPlanuri(); }
}

// ── Jurnal ──
let jurnal = [];
const tinte = () => profil && necesar(profil);

async function incarcaJurnal() {
  const snap = await getDoc(doc(db, 'health', user.uid, 'jurnal', $('j-zi').value || azi()));
  jurnal = snap.exists() ? snap.data().items || [] : [];
  deseneazaJurnal();
}
$('j-zi').addEventListener('change', () => profil && incarcaJurnal());

async function salveazaJurnal() {
  await setDoc(doc(db, 'health', user.uid, 'jurnal', $('j-zi').value || azi()), { items: jurnal });
  deseneazaJurnal();
}

function bara(nume, val, plan, tinta, unit) {
  const pct = v => Math.min(100, tinta ? (v / tinta) * 100 : 0);
  return `<div class="bar"><span>${nume}</span><div class="bar-t"><div class="bar-p" style="width:${pct(val + plan)}%"></div><div class="bar-f${val > tinta * 1.1 ? ' peste' : ''}" style="width:${pct(val)}%"></div></div><span>${val}${plan ? ' (+' + plan + ')' : ''} / ${tinta} ${unit}</span></div>`;
}
function deseneazaJurnal() {
  const t = tinte();
  const m = totaluri(jurnal.filter(i => i.tip !== 'planificat')), pl = totaluri(jurnal.filter(i => i.tip === 'planificat'));
  $('j-bars').innerHTML = t && !t.blocat ? [
    bara('Calorii', m.kcal, pl.kcal, t.kcal, 'kcal'), bara('Proteine', m.p, pl.p, t.p, 'g'),
    bara('Carbohidrati', m.c, pl.c, t.c, 'g'), bara('Grasimi', m.g, pl.g, t.g, 'g')
  ].join('') + '<p class="muted">Plin = mancat · hasurat = planificat</p>' : '';
  $('j-items').innerHTML = jurnal.map((it, i) => {
    const a = ALIMENTE_BY_ID[it.id], v = valori(it.id, it.grame);
    if (!a || !v) return '';
    return `<li><span class="nm">${esc(a.nume)}</span>${it.tip === 'planificat' ? '<span class="pill plan">voi manca</span>' : ''}
      <input class="inp gr" type="number" min="1" max="3000" value="${it.grame}" data-i="${i}" aria-label="Grame"> g
      <span class="vl">${Math.round(v.kcal)} kcal · P ${Math.round(v.p)} · C ${Math.round(v.c)} · G ${Math.round(v.g)}</span>
      ${it.tip === 'planificat' ? `<button class="link" data-mancat="${i}">Am mancat</button>` : ''}
      <button class="link" data-sterge="${i}">Sterge</button></li>`;
  }).join('') || '<li class="muted">Nimic in jurnal pentru ziua asta.</li>';
}
$('j-items').addEventListener('change', e => {
  const i = e.target.dataset.i;
  if (i === undefined) return;
  const g = parseInt(e.target.value, 10);
  if (g > 0 && g <= 3000) { jurnal[i].grame = g; salveazaJurnal(); }
});
$('j-items').addEventListener('click', e => {
  if (e.target.dataset.sterge !== undefined) { jurnal.splice(+e.target.dataset.sterge, 1); salveazaJurnal(); }
  if (e.target.dataset.mancat !== undefined) { jurnal[+e.target.dataset.mancat].tip = 'mancat'; salveazaJurnal(); }
});
function adaugaInJurnal(items) {
  const la = new Date().toISOString();
  jurnal.push(...items.map(it => ({ id: it.id, grame: it.grame, tip: ales.tip || 'mancat', la })));
  return salveazaJurnal();
}
$('btn-j-add').addEventListener('click', async () => {
  const a = ALIMENTE.find(x => x.nume.toLowerCase() === $('j-aliment').value.trim().toLowerCase());
  const g = parseInt($('j-grame').value, 10);
  if (!a) { $('j-err').textContent = 'Alege un aliment din lista.'; return; }
  if (!(g > 0 && g <= 3000)) { $('j-err').textContent = 'Gramele: intre 1 si 3000.'; return; }
  $('j-err').textContent = '';
  await adaugaInJurnal([{ id: a.id, grame: g }]);
  $('j-aliment').value = ''; $('j-grame').value = '';
});
$('j-aliment').addEventListener('change', () => {
  const a = ALIMENTE.find(x => x.nume.toLowerCase() === $('j-aliment').value.trim().toLowerCase());
  if (a?.u && !$('j-grame').value) $('j-grame').value = a.u.g;
});
$('btn-j-text').addEventListener('click', async () => {
  const text = $('j-text').value.trim();
  if (!text) return;
  const btn = $('btn-j-text');
  btn.disabled = true; $('j-err').textContent = 'Panda citeste...';
  try {
    const resp = await fetch('/api/fit-jurnal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: await user.getIdToken(), text }) });
    const out = await resp.json().catch(() => ({}));
    if (resp.status === 429) throw new Error(`Ai folosit cele ${out.limita} texte de azi. Mai poti adauga din lista.`);
    if (!resp.ok) throw new Error('Panda n-a inteles acum. Mai incearca sau alege din lista.');
    if (out.items.length) await adaugaInJurnal(out.items);
    $('j-text').value = '';
    $('j-err').textContent = out.necunoscute.length ? 'Nu stiu inca: ' + out.necunoscute.join(', ') + '. Alege ceva apropiat din lista.' : '';
  } catch(e) {
    $('j-err').textContent = e.message;
  } finally { btn.disabled = false; }
});

// ── Greutate ──
let cantariri = [];
async function incarcaGreutate() {
  const snap = await getDocs(collection(db, 'health', user.uid, 'greutate'));
  cantariri = snap.docs.map(d => ({ data: d.id, kg: d.data().kg })).sort((a, b) => a.data.localeCompare(b.data));
  deseneazaGreutate();
}
$('btn-g').addEventListener('click', async () => {
  const kg = num($('g-kg').value);
  if (!(kg >= LIMITE.kg[0] && kg <= LIMITE.kg[1])) { $('g-err').textContent = `Greutatea: intre ${LIMITE.kg[0]} si ${LIMITE.kg[1]} kg.`; return; }
  $('g-err').textContent = '';
  await setDoc(doc(db, 'health', user.uid, 'greutate', azi()), { kg: Math.round(kg * 10) / 10 });
  $('g-kg').value = '';
  incarcaGreutate();
});
function deseneazaGreutate() {
  const pts = cantariri.slice(-60);
  if (pts.length < 2) {
    $('g-chart').innerHTML = pts.length ? `<p class="muted">Prima cantarire: ${pts[0].kg} kg. Graficul apare de la a doua.</p>` : '';
    $('g-trend').textContent = '';
    return;
  }
  const W = 600, H = 200, P = 30;
  const xs = pts.map(p => Date.parse(p.data)), ys = pts.map(p => p.kg);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) - 0.5, y1 = Math.max(...ys) + 0.5;
  const X = x => P + ((x - x0) / (x1 - x0 || 1)) * (W - 2 * P), Y = y => H - P - ((y - y0) / (y1 - y0)) * (H - 2 * P);
  const linie = pts.map((p, i) => (i ? 'L' : 'M') + X(xs[i]).toFixed(1) + ' ' + Y(p.kg).toFixed(1)).join(' ');
  $('g-chart').innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Greutatea in ultimele ${pts.length} cantariri">
    <path d="${linie}" fill="none" stroke="#4A5B30" stroke-width="3" stroke-linejoin="round"/>
    ${pts.map((p, i) => `<circle cx="${X(xs[i]).toFixed(1)}" cy="${Y(p.kg).toFixed(1)}" r="4" fill="#1F160E"/>`).join('')}
    <text x="${P}" y="18" font-size="12" fill="#5A4C37">${y1.toFixed(1)} kg</text>
    <text x="${P}" y="${H - 8}" font-size="12" fill="#5A4C37">${pts[0].data} → ${pts[pts.length - 1].data}</text>
  </svg>`;
  const t = tendinta(pts), aj = ajustareCalorii(pts, profil.obiectiv, profil.kg);
  let txt = t ? `Tendinta: ${t.kgPeSaptamana > 0 ? '+' : ''}${String(t.kgPeSaptamana).replace('.', ',')} kg pe saptamana (din ${t.zile} zile).` : '';
  if (!aj) txt += ' Dupa 14 zile de cantariri, Panda iti spune daca e cazul sa ajustezi caloriile.';
  else if (aj.kcal === 0) txt += ' Esti pe drumul bun. Nu schimba nimic.';
  else txt += ` Panda zice: ${aj.kcal > 0 ? 'adauga' : 'scade'} ~${Math.abs(aj.kcal)} kcal pe zi si mai verificam peste doua saptamani.`;
  $('g-trend').textContent = txt.trim();
}

// ── Planuri AI ──
const STARE = { cerut: 'Asteapta aprobarea', 'in-lucru': 'Panda gateste planul...', gata: 'Gata', respins: 'Respins', esuat: 'N-a iesit, cere din nou' };
const MOD = { normal: 'Zi normala', proteic: 'Zi proteica', carboload: 'Carbo load' };
let planuri = [];
async function incarcaPlanuri() {
  const snap = await getDocs(query(collection(db, 'fitPlans'), where('uid', '==', user.uid)));
  planuri = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.creatLa.localeCompare(a.creatLa));
  $('p-lista').innerHTML = planuri.map(p => `
    <div class="plan-st"><b>${esc(MOD[p.mod] || p.mod)}, ${p.zile} ${p.zile === 1 ? 'zi' : 'zile'}</b><span class="pill">${esc(STARE[p.status] || p.status)}</span><span class="muted">${new Date(p.creatLa).toLocaleString('ro-RO')}</span>${p.motiv && p.status === 'respins' ? `<span class="muted">Motiv: ${esc(p.motiv)}</span>` : ''}</div>
    ${p.status === 'gata' ? deseneazaPlan(p) : ''}`).join('') || '<p class="muted">Nu ai cerut inca niciun plan.</p>';
}
function deseneazaPlan(p) {
  return (p.plan || []).map((zi, i) => `<div class="plan-zi"><h4>Ziua ${i + 1} · ${zi.total.kcal} kcal · P ${zi.total.p} · C ${zi.total.c} · G ${zi.total.g}</h4>
    ${zi.mese.map(m => `<div class="masa"><b>${esc(m.nume)}</b><ul>${m.items.map(it => `<li>${esc(ALIMENTE_BY_ID[it.id]?.nume || it.id)}: ${it.grame} g</li>`).join('')}</ul></div>`).join('')}
    <div class="acts" style="margin-top:10px"><button class="btn btn-sm btn-2" data-plan="${p.id}" data-zi="${i}">Pune ziua in jurnal (voi manca)</button></div></div>`).join('');
}
$('p-lista').addEventListener('click', async e => {
  const b = e.target.closest('[data-plan]');
  if (!b) return;
  const p = planuri.find(x => x.id === b.dataset.plan);
  const items = p.plan[+b.dataset.zi].mese.flatMap(m => m.items);
  const tip = ales.tip; ales.tip = 'planificat';
  await adaugaInJurnal(items);
  ales.tip = tip;
  b.textContent = 'Pus in jurnal';
  b.disabled = true;
});
$('btn-plan').addEventListener('click', async () => {
  const btn = $('btn-plan');
  btn.disabled = true; $('p-err').textContent = '';
  try {
    const resp = await fetch('/api/fit-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: await user.getIdToken(), actiune: 'cere', mod: ales['p-mod'], zile: +ales['p-zile'] }) });
    const out = await resp.json().catch(() => ({}));
    const MES = { 'deja-cerut': 'Ai deja un plan care asteapta. Panda le face pe rand.', limita: `Ai folosit cele ${out.limita} planuri din ultimele 7 zile.`, 'profil-blocat': 'Cu afectiunile bifate, planul il face medicul, nu Panda.', 'fara-profil': 'Salveaza intai profilul.' };
    if (!resp.ok) throw new Error(MES[out.error] || 'N-a mers cererea. Mai incearca.');
    $('p-err').innerHTML = `<span class="ok">Cerere trimisa. Mai poti cere ${out.ramase} ${out.ramase === 1 ? 'plan' : 'planuri'} saptamana asta.</span>`;
    incarcaPlanuri();
  } catch(e) { $('p-err').textContent = e.message; }
  finally { btn.disabled = false; }
});

// ── Admin: aproba / respinge, limita pe user ──
async function incarcaAdmin() {
  const snap = await getDocs(query(collection(db, 'fitPlans'), where('status', 'in', ['cerut', 'in-lucru', 'esuat'])));
  const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.creatLa.localeCompare(b.creatLa));
  const limite = {};
  await Promise.all([...new Set(lista.map(p => p.uid))].map(async uid => {
    const u = await getDoc(doc(db, 'users', uid));
    limite[uid] = u.get('fitPlanuri') ?? 3;
  }));
  $('a-lista').innerHTML = lista.map(p => `<div class="plan-st">
      <b>${esc(p.nume)}</b><span>${esc(MOD[p.mod] || p.mod)}, ${p.zile} ${p.zile === 1 ? 'zi' : 'zile'}</span><span class="pill">${esc(STARE[p.status])}</span>
      <span class="muted">${new Date(p.creatLa).toLocaleString('ro-RO')}</span>
      ${p.status === 'cerut' ? `<button class="btn btn-sm" data-aproba="${p.id}">Aproba</button><button class="link" data-respinge="${p.id}">Respinge</button>` : ''}
      <label class="muted">Limita/7 zile <input class="inp gr" type="number" min="0" max="50" value="${limite[p.uid]}" data-limita="${p.uid}" style="width:70px"></label>
    </div>`).join('') || '<p class="muted">Nicio cerere in asteptare.</p>';
}
async function apelAdmin(body) {
  const resp = await fetch('/api/fit-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: await user.getIdToken(), ...body }) });
  return resp.ok;
}
$('a-lista').addEventListener('click', async e => {
  const id = e.target.dataset.aproba || e.target.dataset.respinge;
  if (!id) return;
  e.target.disabled = true;
  if (e.target.dataset.aproba) { e.target.textContent = 'Panda gateste (pana la un minut)...'; await apelAdmin({ actiune: 'aproba', id }); }
  else { await apelAdmin({ actiune: 'respinge', id, motiv: prompt('Motivul (optional, il vede userul):') || '' }); }
  incarcaAdmin();
});
$('a-lista').addEventListener('change', async e => {
  const uid = e.target.dataset.limita;
  const n = parseInt(e.target.value, 10);
  if (uid && n >= 0 && n <= 50) await updateDoc(doc(db, 'users', uid), { fitPlanuri: n });
});

// ── Datele mele: export si stergere ──
$('btn-export').addEventListener('click', async () => {
  const [j, g] = await Promise.all([getDocs(collection(db, 'health', user.uid, 'jurnal')), getDocs(collection(db, 'health', user.uid, 'greutate'))]);
  const date = { profil, jurnal: Object.fromEntries(j.docs.map(d => [d.id, d.data()])), greutate: Object.fromEntries(g.docs.map(d => [d.id, d.data()])), planuri };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(date, null, 2)], { type: 'application/json' }));
  a.download = 'panda-fit-datele-mele.json';
  a.click();
});
$('btn-sterge').addEventListener('click', async () => {
  if (!confirm('Stergem profilul, jurnalul si greutatea din Panda Fit? Nu se poate anula. Planurile cerute raman pana iti stergi contul.')) return;
  try {
    const [j, g] = await Promise.all([getDocs(collection(db, 'health', user.uid, 'jurnal')), getDocs(collection(db, 'health', user.uid, 'greutate'))]);
    await Promise.all([...j.docs, ...g.docs].map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'health', user.uid));
    location.reload();
  } catch(e) { $('d-err').textContent = 'N-a mers stergerea. Mai incearca.'; }
});

// ── Autentificare ──
onAuthStateChanged(auth, async u => {
  user = u;
  if (u) {
    const ud = await getDoc(doc(db, 'users', u.uid)).catch(() => null);
    numeUser = ud?.get('name') || u.displayName || '';
    $('cont-area').innerHTML = `<span class="cont-nume">${esc(numeUser)}</span>`;
    const h = await getDoc(doc(db, 'health', u.uid)).catch(() => null);
    profil = h?.exists() ? h.data() : null;
    if (profil) { completeazaFormular(profil); arataRezultat(); $('calc-sub').textContent = 'Profilul tau salvat. Schimba ce vrei si apasa „Calculeaza”.'; }
    else $('calc-sub').textContent = 'Completeaza si apasa „Calculeaza”. Salvam doar cu acordul tau.';
    if ((u.email || '').toLowerCase() === ADMIN_EMAIL) { $('admin').hidden = false; incarcaAdmin(); }
  } else {
    profil = null;
  }
  deblocheaza();
});
