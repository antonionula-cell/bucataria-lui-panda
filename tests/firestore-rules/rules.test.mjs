import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-panda', // proiect demo: emulatorul nu atinge Firebase-ul real
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 }
});

const U = ['u1', 'ana@x.ro'], O = ['u2', 'bob@x.ro'], A = ['adm', 'antonio.nula@gmail.com'];
const base = { email: 'ana@x.ro', role: 'user', isPremium: false, name: 'Primul Panda Happy', createdAt: 't' };
const db = who => who ? env.authenticatedContext(who[0], { email: who[1] }).firestore() : env.unauthenticatedContext().firestore();

// [eticheta, asteptare, cine, operatie, cale, date noi, date existente, alte documente existente]
const cases = [
  ['user creeaza doc implicit', 'ALLOW', U, 'set', 'users/u1', { email: 'ana@x.ro', role: 'user', isPremium: false, createdAt: 't' }],
  ['user creeaza doc cu role admin', 'DENY', U, 'set', 'users/u1', { email: 'ana@x.ro', role: 'admin' }],
  ['user creeaza doc cu nume', 'DENY', U, 'set', 'users/u1', { email: 'ana@x.ro', name: 'Hacker' }],
  ['merge peste doc cu doar nume (inregistrare)', 'ALLOW', U, 'merge', 'users/u1', { email: 'ana@x.ro', role: 'user', isPremium: false, createdAt: 't' }, { name: 'Primul Panda Happy' }],
  ['user schimba avatarul', 'ALLOW', U, 'merge', 'users/u1', { avatarId: 'a3' }, base],
  ['user isi da role admin', 'DENY', U, 'merge', 'users/u1', { role: 'admin' }, base],
  ['user isi pune Premium', 'DENY', U, 'merge', 'users/u1', { isPremium: true }, base],
  ['user isi schimba numele direct', 'DENY', U, 'merge', 'users/u1', { name: '<b>x' }, base],
  ['user isi schimba emailul', 'DENY', U, 'merge', 'users/u1', { email: 'alt@x.ro' }, base],
  ['user isi reseteaza aiSearches (ramas permis)', 'ALLOW', U, 'merge', 'users/u1', { aiSearches: { count: 0 } }, { ...base, aiSearches: { count: 9 } }],
  ['user citeste alt user', 'DENY', O, 'get', 'users/u1', null, base],
  ['admin citeste user', 'ALLOW', A, 'get', 'users/u1', null, base],
  ['admin face pe cineva admin', 'ALLOW', A, 'merge', 'users/u1', { role: 'admin' }, base],
  ['user isi citeste propunerea', 'ALLOW', U, 'get', 'proposals/p1', null, { uid: 'u1', userEmail: 'ana@x.ro' }],
  ['user citeste propunerea altuia', 'DENY', O, 'get', 'proposals/p1', null, { uid: 'u1', userEmail: 'ana@x.ro' }],
  ['vizitator citeste propunere', 'DENY', null, 'get', 'proposals/p1', null, { uid: 'u1' }],
  ['profil: query propriile propuneri', 'ALLOW', U, 'myProposals', 'proposals/p1', null, { uid: 'u1' }],
  ['query toate propunerile (user)', 'DENY', U, 'allProposals', 'proposals/p1', null, { uid: 'u1' }],
  ['user scrie propunere direct', 'DENY', U, 'set', 'proposals/p2', { uid: 'u1', text: 'x' }],
  ['admin sterge propunere', 'ALLOW', A, 'delete', 'proposals/p1', null, { uid: 'u1' }],
  ['reteta AI propusa cu numele propriu', 'ALLOW', U, 'set', 'pendingRecipes/r1', { proposedBy: 'ana@x.ro', proposedByUid: 'u1', status: 'proposed', author: 'Primul Panda Happy', authorUid: 'u1' }, null, { 'users/u1': base }],
  ['reteta AI propusa anonim', 'ALLOW', U, 'set', 'pendingRecipes/r1', { proposedBy: 'ana@x.ro', proposedByUid: 'u1', status: 'proposed', author: null, authorUid: null }, null, { 'users/u1': base }],
  ['reteta AI cu numele altcuiva', 'DENY', U, 'set', 'pendingRecipes/r1', { proposedBy: 'ana@x.ro', proposedByUid: 'u1', status: 'proposed', author: 'Chef Celebru', authorUid: 'u1' }, null, { 'users/u1': base }],
  ['reteta AI in numele altui email', 'DENY', U, 'set', 'pendingRecipes/r1', { proposedBy: 'bob@x.ro', proposedByUid: 'u1', status: 'proposed', author: null }, null, { 'users/u1': base }],
  ['reteta AI direct acceptata', 'DENY', U, 'set', 'pendingRecipes/r1', { proposedBy: 'ana@x.ro', proposedByUid: 'u1', status: 'accepted', author: null }, null, { 'users/u1': base }],
  ['user citeste pendingRecipes', 'DENY', U, 'get', 'pendingRecipes/r1', null, { proposedByUid: 'u1' }],
  ['notificarea propriului cont nou', 'ALLOW', U, 'set', 'notifications/u1_reg', { type: 'new_user', email: 'ana@x.ro', createdAt: 't', read: false }],
  ['notificare pentru alt cont', 'DENY', U, 'set', 'notifications/u2_reg', { type: 'new_user', email: 'ana@x.ro' }],
  ['notificare de la vizitator', 'DENY', null, 'set', 'notifications/x', { type: 'new_user', email: 'x' }],
  ['notificare cu alt tip', 'DENY', U, 'set', 'notifications/u1_reg', { type: 'new_proposal', email: 'ana@x.ro' }],
  ['user citeste notificari', 'DENY', U, 'get', 'notifications/u1_reg', null, { type: 'new_user' }],
  ['admin marcheaza notificarea citita', 'ALLOW', A, 'merge', 'notifications/u1_reg', { read: true }, { type: 'new_user', read: false }],
  ['oricine citeste retetele publicate', 'ALLOW', null, 'get', 'publishedRecipes/x', null, { titlu: 'x' }],
  ['user scrie reteta publicata', 'DENY', U, 'merge', 'publishedRecipes/x', { titlu: 'y' }, { titlu: 'x' }],
  ['admin publica reteta', 'ALLOW', A, 'set', 'publishedRecipes/y', { titlu: 'y' }],
  ['PWA: prima instalare', 'ALLOW', null, 'set', 'stats/pwa', { installCount: 1 }],
  ['PWA: +1', 'ALLOW', null, 'merge', 'stats/pwa', { installCount: 8 }, { installCount: 7 }],
  ['PWA: +100', 'DENY', null, 'merge', 'stats/pwa', { installCount: 107 }, { installCount: 7 }],
  ['PWA: alt camp', 'DENY', null, 'merge', 'stats/pwa', { installCount: 8, x: 1 }, { installCount: 7 }],
  ['PWA: citire publica', 'ALLOW', null, 'get', 'stats/pwa', null, { installCount: 7 }],
  ['pandaNames: resetare din browser', 'DENY', U, 'merge', 'stats/pandaNames', { Happy: 0 }, { Happy: 5 }],
  ['pandaNames: citire din browser', 'DENY', null, 'get', 'stats/pandaNames', null, { Happy: 5 }],
];

let bad = 0;
for (const [label, expect, who, op, path, data, existing, others] of cases) {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const f = ctx.firestore();
    if (existing) await setDoc(doc(f, path), existing);
    for (const [p, d] of Object.entries(others || {})) await setDoc(doc(f, p), d);
  });
  const f = db(who), ref = doc(f, path);
  const run = {
    set: () => setDoc(ref, data),
    merge: () => setDoc(ref, data, { merge: true }),
    get: () => getDoc(ref),
    delete: () => deleteDoc(ref),
    myProposals: () => getDocs(query(collection(f, 'proposals'), where('uid', '==', who[0]))),
    allProposals: () => getDocs(collection(f, 'proposals')),
  }[op];
  try {
    await (expect === 'ALLOW' ? assertSucceeds(run()) : assertFails(run()));
    console.log('ok  ', expect.padEnd(5), label);
  } catch(e) {
    bad++;
    console.log('FAIL', expect.padEnd(5), label, '→', e.message.split('\n')[0].slice(0, 160));
  }
}
console.log(`${cases.length - bad}/${cases.length} trec`);
await env.cleanup();
process.exit(bad ? 1 : 0);
