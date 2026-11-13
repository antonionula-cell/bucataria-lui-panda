# Sprint CeJucam — promovare incrucisata cu „Ce jucam azi?”

Sursa: brief-ul scris din proiectul CeJucam pe 2026-11-13 (`4Fun/Office Games/docs/panda-brief-pentru-bucatarie.md`). Planificat pe 2026-11-13. P4 facut pe 2026-11-13, restul inca fara cod.

Pe Panda apar jocuri de pe https://cejucamazi.ro cat se coace sau se raceste mancarea. Pe CeJucam apar retete de la Panda intre runde. Acelasi autor, deci se spune deschis: eticheta „Din aceeasi familie”. **Panda ramane Panda**: textele sunt in vocea lui, discrete, fara ton de reclama.

## Reguli comune

- Doar linkuri: niciun script, iframe sau imagine incarcata de pe cejucamazi.ro.
- Linkuri cu `target="_blank" rel="noopener"` si `?utm_source=bucatarialuipanda&utm_medium=promo&utm_campaign=<loc>`, unde `<loc>` = `coace` / `invitati` / `copii` / `footer`.
- **Un singur card CeJucam pe reteta.** Prioritate: P1 (asteptare) > P3 (copii) > P2 (invitati).
- „Ascunde” pe card → ascuns 30 de zile pe dispozitiv (`localStorage`, cheie `cejucamHiddenUntil`), citit si scris in `try/catch`.
- Click numarat in GA ca eveniment `cejucam_click` `{ loc }`, **doar cu consimtamant** (`gtag` exista doar dupa „Accept”). Nu trimitem nimic catre CeJucam.
- Stil „Eticheta de borcan”: chenar 2px `--ink`, umbra dura, eticheta mica uppercase „Din aceeasi familie”, fara emoji, fara logo.

## Datele retetelor

Timpul de asteptare, „de grup” si „cu copiii” **nu exista azi in date**. Retetele statice sunt HTML scris de mana, iar cele din Firestore (`publishedRecipes`) au doar `cuptor.timp`. Propunerea: un singur obiect in JS, pe ID-ul retetei, fara sa umblam la cele 22 de ferestre:

```js
// asteptare = cel mai lung bloc in care nu faci nimic (cuptor, frigider, dospire); limita de jos din interval
const RETETE_PROMO = {
  'nt-mousse': { asteptareMin: 120, ce: 'frigider', copii: true },
  // ...
};
```

Pentru retetele din Firestore: `asteptareMin` se ia din `cuptor.timp` (primul numar), fara grup/copii.

| ID (`#cb-...`) | Reteta | Asteptare (cel mai lung bloc) | Cuptor | Portii | Grup (8+) | Copii | Card |
|---|---|---|---|---|---|---|---|
| `brownies` | Brownies Proteice | 20 min cuptor | da | 8 | da | nu | P1 coace, 20–29 |
| `cookies` | Cookies crocante | 20 min congelator | da | ~16 | da | nu | P1 coace, 20–29 |
| `zabaglione` | Zabaglione fara alcool | — (30 min ouale afara, inainte de inceput) | nu | 4 | nu | nu | niciunul |
| `nutella` | Biscuiti cu Nutella | 15 min racire (sub prag) | da | 12–16 | da | da | P3 copii |
| `cana` | Prajitura in cana | 25 min cuptor | da | 1 | nu | da | P1 coace, 20–29 |
| `muffins` | Muffin cups (Lot 06) | 12 min cuptor | da | 8 | da | nu | P2 invitati |
| `browniefructe` | Brownie cu fructe, no-bake | 120 min congelator | nu | 6 | nu | da | P1 coace, 60+ |
| `bagels` | Bagels cu oua si bacon | — | nu | 8 | da | nu | P2 invitati |
| `pbmuffins` | Muffin cups (Lot 09) | 12 min cuptor | da | 8 | da | nu | P2 invitati |
| `nt-banichki` | Turtite cu ciocolata | 13 min cuptor | da | 9 | da | da | P3 copii |
| `nt-molnarka` | Clatite rulate | 30 min odihna aluat | nu | 12 | da | da | P1 coace, 30–59 |
| `nt-topfen` | Foitaj cu branza de vaci | 20 min cuptor | da | 8 | da | nu | P1 coace, 20–29 |
| `nt-babovka` | Pandispan Babovka | 50 min cuptor | da | 16 | da | nu | P1 coace, 30–59 |
| `nt-koulouri` | Covrigi grecesti | 60 min dospire | da | ~15 | da | nu | P1 coace, 60+ |
| `nt-rulouri` | Rulouri crocante | 30 min odihna aluat | da | 8 | da | nu | P1 coace, 30–59 |
| `nt-churros` | Churros | 10 min odihna | nu (ulei 180°C) | 10–12 | da | **nu, ulei incins** | P2 invitati |
| `nt-poffertjes` | Poffertjes | — | nu | 6 | nu | da | P3 copii |
| `nt-clatitep` | Clatite pufoase | — | nu | 4 | nu | da | P3 copii |
| `nt-nalangate` | Nalangate | 15 min odihna | nu | 20 | da | da | P3 copii |
| `nt-clatitez` | Clatite cu zmeura si mascarpone | — | nu | ? | nu | da | P3 copii |
| `nt-mousse` | Mousse cu Nutella | 120 min frigider | nu | 4 | nu | da | P1 coace, 60+ |
| `trokuti` | Triunghiuri fara coacere | 120 min frigider | nu | ~20 | da | da | P1 coace, 60+ |

„Copii” = fara ulei incins si fara cutite mari; cuptorul il porneste adultul. Antonio confirma lista inainte de cod.

## Textele finale (vocea lui Panda)

**P1 „Cat se coace, jucati ceva”** (eticheta „Din aceeasi familie · Ce jucam azi?”):

| Asteptare | Text | Link |
|---|---|---|
| 20–29 min, cuptor | „{N} minute in cuptor. Poti sa te uiti la cuptor. Sau poti juca doua runde de Cuvant interzis. Panda a ales a doua. Cuptorul nu s-a suparat.” | `/jocuri/cuvant-interzis` |
| 20–29 min, congelator | „20 de minute la congelator. Aluatul se raceste, voi va incalziti: o runda de Mima. Fara recuzita, doar demnitate pierduta.” | `/jocuri/mima` |
| 30–59 min | „{N} minute de asteptat. Destul pentru o seara de jocuri: 3–4 jocuri la rand, aceleasi echipe, punctele se aduna. Panda tine scorul. Si trisheaza.” | `/seara` |
| 60+ min, frigider | „{N} la frigider. Panda a stat 40 de minute langa usa frigiderului. Nu face ca Panda: porniti un Quiz Live pe televizor, telefoanele sunt butoanele.” | `/live` |
| 60+ min, dospire | „Aluatul creste o ora. Voi, intre timp, puteti face un Quiz Live pe TV. Panda a incercat sa mimeze «framant aluat». Toata lumea a ghicit «panda suparat».” | `/live` |

Sub fiecare card P1, un rand mic: „Doar voi doi? Trivia rapida merge si in 2.” → `/jocuri/trivia-rapida`.

**P2 „Ai invitati la masa?”**: „Ai invitati? Mancarea e partea usoara. Dupa masa vine partea grea: conversatia. Panda recomanda jocuri de grup, se aleg dupa cati sunteti.” → `/jocuri`

**P3 „Gatesti cu copiii?”** (pentru parinte): „Gatesti cu copiii? Cat se face, ei pot exersa tabla inmultirii. Fara reclame, fara cont. Panda verifica rezultatele. Panda a picat la 7×8.” → `/scoala`

**P4 subsol**: „Din aceeasi familie: **Ce jucam azi?** — jocuri de grup, Live pe TV si Scoala pentru copii.” → `https://cejucamazi.ro`

**Politica de confidentialitate**, in sectiunea 4: „Site-ul are linkuri spre cejucamazi.ro, un alt proiect al aceluiasi autor. Linkurile poarta doar numele campaniei (utm); nu trimitem date personale.”

## Sarcini (ordinea din brief: P4 → P1 → P3 → P2)

- [x] **P4** Rand „Din aceeasi familie” in subsol, langa `.ftxt`; verificat sa nu iasa din ecran pe 375px.
- [x] Propozitia in Politica de confidentialitate (sectiunea 4) + data actualizarii.
- [ ] `RETETE_PROMO` cu datele din tabel, confirmate de Antonio.
- [ ] Componenta de card (o singura functie, apelata din `_enhanceModal` la prima deschidere a retetei), dupa sectiunea de pasi; functioneaza si pentru retetele din Firestore (`cuptor.timp`).
- [ ] **P1** card dupa timpul de asteptare (praguri 20 / 30 / 60), cu Trivia rapida ca varianta pentru putini.
- [ ] **P3** rand pentru parinti, doar la `copii: true` fara P1.
- [ ] **P2** rand pentru invitati, doar la grup fara P1/P3.
- [ ] „Ascunde” 30 de zile (localStorage, `try/catch`).
- [ ] Eveniment GA `cejucam_click` `{ loc }`, doar cu consimtamant.
- [ ] `sw.js` CACHE +1, sintaxa verificata, preview pe telefon si desktop, `LATEST_CHANGES.md`.

**Gata cand:** fiecare reteta din tabel arata exact cardul din coloana „Card” (sau niciunul), linkurile deschid jocul corect cu `utm_campaign` potrivit, iar subsolul nu iese din ecran pe telefon.

## Gasite pe drum (de reparat separat)

- Timpii de pe card sunt prea mici la `nt-molnarka` („20 min”, dar aluatul sta 30 min la odihna) si `nt-topfen` („25 min”, dar ~45 cu foitajul lasat 10–15 min si 20 min cuptor).
- Doua retete aproape identice: `muffins` (Lot 06) si `pbmuffins` (Lot 09), acelasi titlu, „Muffin Cups cu Unt de Arahide & Ciocolata”.
- `cookies`: ingredientele spun „~3 cookies mari de 50g”, dar textul lui Panda vorbeste de 16, iar cantitatile (~720g aluat) ies pe la 14 bile de 50g.
- Linkurile `#cb-dyn-...` spre retetele din Firestore nu deschid reteta (hash-ul e citit inainte sa se incarce retetele). Pentru CeJucam folosim doar ID-urile statice din tabel.
