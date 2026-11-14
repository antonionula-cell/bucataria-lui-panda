# Sprint Nutritie — „Panda Fit” (nume de lucru), modul cu plata

Analiza si plan din 2026-11-14. **Doar planificare, fara cod.** Nimic nu se implementeaza pana nu sunt luate deciziile din Faza 0.

Ideea: userul isi pune greutatea, inaltimea, varsta si obiectivul, iar Panda ii calculeaza necesarul, ii face un plan alimentar si il ajuta sa tina socoteala proteinelor si a carbohidratilor. Cu zile speciale („azi vreau proteic”, carbo load) si cu vocea lui Panda.

## Principii

- **Cifrele vin din formule si din baza de date, nu din AI.** AI-ul (Gemini) alege mese si intelege textul scris de user; calculele, totalurile si verificarile sunt in cod.
- **Wellness, nu medicina.** Fara diagnostice, fara promisiuni („detox”, „arde grasimi”), cu limite puse in cod (vezi „Siguranta”).
- **Panda ironizeaza mancarea si pe el, niciodata corpul sau cifrele userului.**
- **Datele de sanatate se trateaza separat** (GDPR art. 9): consimtamant explicit, minim de date, niciodata in GA, in emailurile de eroare sau langa email in prompturi.

## Functiile cerute

| Functie | Cum | Calcul / AI |
|---|---|---|
| Profil: greutate, inaltime, varsta, sex, activitate, obiectiv (slabit / mentinut / masa) | Necesar caloric cu Mifflin-St Jeor × factorul de activitate; proteine 1,6–2,2 g/kg, grasimi 0,8–1 g/kg, restul carbohidrati; deficit/surplus moderat dupa obiectiv | calcul |
| Plan alimentar (zi / saptamana) | Gemini alege mesele (intai din retetele lui Panda), codul verifica totalurile si cere alt plan daca nu ies | AI + verificare in cod |
| „Azi vreau sa mananc proteic” | Zi cu tinta speciala (ex. 2 g proteine/kg), mese alese pentru ea; se poate porni din cautarea „ce am in frigider” | AI + calcul |
| Cat am mancat / cat voi manca | Jurnal: „2 oua, o felie de paine, un iaurt grecesc” → AI-ul extrage alimentele si cantitatile, valorile vin din baza de date; „planificat” si „mancat” | AI doar la inteles textul |
| Carbo load / protein load | Moduri gata facute; carbo load = 8–12 g carbohidrati/kg cu 36–48 h inainte de efort lung, marcat „pentru sportivi”, cu avertismente | calcul |

## Idei in plus

1. **Valori nutritionale pe toate retetele lui Panda** + „Adauga in jurnal”; butonul de portii (1x/2x/4x) recalculeaza si valorile. Acum doar unele carduri au calorii.
2. **Mod post** (post ortodox): proteine din leguminoase, tofu, ciuperci. Specific romanesc.
3. **Plan pe buget**: „am 600 de lei pe luna”, cu preturi aproximative Freshful (legat de afilierea din `sprint-promo-2.md`).
4. **Lista de cumparaturi** pe saptamana, cu linkuri Freshful / Carrefour.
5. **Gatit in avans duminica**: 5 caserole pentru saptamana, cantitati calculate.
6. **Inlocuiri**: „vreau ciocolata” → varianta proteica (brownies proteice, muffin cups exista deja).
7. **Zi de antrenament fata de zi de pauza** (mai multi carbohidrati cand faci sport).
8. **Restrictii**: alergii, vegetarian, fara lactoza, fara gluten.
9. **Graficul greutatii** + tinta ajustata automat dupa 2–3 saptamani, din evolutia reala.
10. **Panda antrenor**: un mesaj sarcastic pe zi (cu regula de mai sus).

## Siguranta (in cod, nu doar in text)

- Niciun plan sub un minim de calorii (de stabilit, ex. 1.500 kcal barbati / 1.200 femei).
- Fara deficit caloric sub 18 ani sau la IMC sub 18,5.
- Sarcina, alaptare, diabet, boli de rinichi → mesaj „intreaba medicul”, fara plan.
- Slabire maxim ~0,5–1% din greutate pe saptamana.
- Disclaimer clar: nu e sfat medical; pozitionare de wellness, ca sa nu intre sub regulile pentru dispozitive medicale.

## Juridic si date

- **GDPR art. 9** (greutate, obiectiv, alergii, post = date de sanatate / convingeri religioase):
  - consimtamant separat si explicit la intrarea in modul, retras oricand;
  - colectie Firestore separata (ex. `health/{uid}`), reguli noi + teste in `tests/firestore-rules/`;
  - fara aceste date in GA, in `reportError`, in emailuri sau in prompturi impreuna cu emailul;
  - export (JSON) si stergere; `api/delete-account.js` sterge si colectia noua;
  - Politica de confidentialitate: sectiune noua (ce date, de ce, cat timp, consimtamant).
- **Gemini pe plan platit**: pe varianta gratuita a API-ului, Google poate folosi datele trimise; cu date de sanatate trebuie planul platit. De verificat ce plan e activ acum.
- **Baza de date cu alimente**: USDA FoodData Central (domeniu public, in engleza) + traducerea a ~300 de alimente romanesti uzuale. Alternativ Open Food Facts (produse de raft, licenta ODbL: atribuire). Recomandare: USDA + lista proprie tradusa.

## Plata

- **Forma juridica**: abonamentele cer PFA sau SRL (facturi, e-Factura, contabilitate, TVA peste prag). Ca persoana fizica nu se poate vinde regulat.
- **Consumatori**: Termeni noi (pret, reinnoire, anulare), informatii ANPC, drept de retragere 14 zile (la continut digital se poate renunta cu acordul expres la cumparare).
- **Procesator**: Netopia (planificat deja ca „Sprint Plata Netopia”) sau Stripe.
- **In cod exista deja** `users.isPremium`, blocat in browser de `firestore.rules`: Premium se activeaza doar de server, din confirmarea platii (webhook).
- **Texte de schimbat**: Termenii („nu exista abonament”), sectiunea Ko-fi („nu da acces in plus”).

## Gratuit fata de Premium (propunere)

- **Gratuit**: calculatorul de necesar, valorile nutritionale pe retetele lui Panda, jurnal cu 3 intrari pe zi.
- **Premium** (ex. 19–29 lei/luna, reducere anuala, 7 zile proba): plan alimentar AI, moduri (proteic, carbo load, post, buget), jurnal nelimitat, lista de cumparaturi, grafic + ajustare automata, gatit in avans.

## Faze

### Faza 0 — Decizii si juridic
- [ ] PFA sau SRL (de asta depinde tot ce tine de plata)
- [ ] Procesatorul de plati: Netopia sau Stripe
- [ ] Pretul si ce ramane gratuit
- [ ] Planul Gemini (gratuit / platit) verificat si, la nevoie, schimbat
- [ ] Textul consimtamantului pentru date de sanatate
- [ ] Termeni + Politica de confidentialitate pentru modul si abonament (de preferat verificate de un jurist)

### Faza 1 — Gratuit: profil, calculator, valori pe retete
- [ ] Colectia `health/{uid}` + reguli Firestore + teste
- [ ] Ecran de consimtamant + profil (greutate, inaltime, varsta, sex, activitate, obiectiv)
- [ ] Calculator: necesar caloric si macro (formula in cod, cu teste)
- [ ] Limitele de siguranta in cod
- [ ] Valori nutritionale pe toate cele 22 de retete statice + recalcul la portii
- [ ] Stergerea contului si exportul includ datele noi

### Faza 2 — Jurnal
- [ ] Baza de date cu alimente (USDA + ~300 alimente romanesti traduse)
- [ ] Jurnal „mancat / planificat”, cu totaluri pe zi fata de tinta
- [ ] Intrare in text liber (AI extrage alimentele, valorile din baza de date)
- [ ] „Adauga in jurnal” din retete

### Faza 3 — Premium
- [ ] Plata (sprint separat: Netopia/Stripe, webhook care pune `isPremium`, facturi)
- [ ] Plan alimentar AI cu verificarea totalurilor in cod
- [ ] Moduri: proteic, carbo load, post, buget
- [ ] Lista de cumparaturi cu linkuri Freshful / Carrefour
- [ ] Gatit in avans

### Faza 4 — Progres
- [ ] Graficul greutatii
- [ ] Ajustarea automata a tintei
- [ ] Mesajul zilnic al lui Panda

## Intrebari deschise

- Pret: abonament lunar, anual sau si plata unica?
- Gratuit fara cont (calculatorul) sau totul doar cu cont?
- Sex: doar masculin/feminin pentru formula, sau si „prefer sa nu spun” (cu media celor doua)?
- Unitati: doar kg/cm sau si alte unitati?
- Modulul intra in site-ul actual (tab nou) sau pe o pagina separata?
