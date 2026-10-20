# Bucataria lui Panda — instructiuni pentru Claude

Site personal de retete cu umor si sarcasm. Proprietar: Antonio. Acest fisier e sursa de adevar pentru sesiunile de pe telefon/cloud, care nu au memoria de pe laptop.

## Unde e ce

- Live: https://bucatarialuipanda.ro (www redirectioneaza 308). Vechea adresa https://bucataria-lui-panda.vercel.app merge si ea, cu `canonical` catre .ro.
- `panda-site/index.html` — tot site-ul (HTML + CSS + JS inline). Se editeaza DOAR aici.
- `panda-site/api/` — functii serverless Vercel: `gemini.js` (cautare AI, `gemini-2.5-flash`, `GEMINI_API_KEY`), `propose.js` (propuneri, valideaza Turnstile pe server cu `TURNSTILE_SECRET_KEY`), `notify.js` (emailuri), `reset-password.js`.
- `panda-site/sw.js` — service worker, cache-first si pentru `index.html`.
- `SPRINTS/` — sprinturile. "Hai la Sprint X" = citeste `SPRINTS/sprint-x.md` si lucreaza pe el.
- Firebase: Auth (email/parola + Google) si Firestore (`users`, `proposals`, `pendingRecipes`, `publishedRecipes`, `notifications`).
- DNS pe Vercel (nameservere `ns1/ns2.vercel-dns.com`, domeniu cumparat la Hostico). Email `panda@bucatarialuipanda.ro` pe Zoho Mail (UE), alias pe contul admin.

## Flux de lucru (obligatoriu)

0. **Inainte de orice lucru, verifica ce s-a facut deja din alt loc** (laptop / telefon / cloud): `git fetch origin --prune`, citeste `LATEST_CHANGES.md` de pe `origin/main` si de pe branch-urile recente (`git for-each-ref --sort=-committerdate refs/remotes/origin | head`) si `git log` pe ele. Daca sarcina e deja facuta, nu o reface: spune-i lui Antonio ce ai gasit si porneste de la starea aceea. Daca alt branch atinge aceleasi fisiere, porneste din el (sau intreaba) ca sa nu suprascrii munca altei sesiuni.
1. Branch nou din `main` pentru fiecare schimbare. Niciodata direct pe `main`.
2. Orice schimbare in `index.html` → creste versiunea `CACHE` din `sw.js` (`panda-vN` → `panda-vN+1`), altfel vizitatorii cu PWA vad versiunea veche.
3. Inainte de commit: verifica sintaxa scripturilor inline si a functiilor din `api/` (`node --check`, functiile copiate ca `.mjs`).
4. Push pe branch → Vercel face preview. URL-ul real e in check-run-ul "Vercel Preview Comments" (`gh api repos/antonionula-cell/bucataria-lui-panda/commits/<sha>/check-runs`). Preview-ul cere login Vercel.
5. **Merge in `main` doar cu acordul explicit al lui Antonio**, cu `git merge --no-ff`. Push pe `main` = deploy automat in productie.
6. Dupa deploy, verifica in productie (ex. versiunea din `/sw.js`).
7. Fara secrete in repo: repo-ul e PUBLIC. Cheile stau doar in Vercel → Environment Variables.
8. **Orice modificare se noteaza in `LATEST_CHANGES.md`** (radacina repo-ului): intrare noua sus, cu data si ora (ora Romaniei, `TZ=Europe/Bucharest date '+%Y-%m-%d %H:%M'`), cine, branch, ce s-a facut, fisiere, stare. In acelasi commit cu schimbarea. La merge in `main`, actualizeaza "Stare" la intrarea respectiva.

## Reguli de continut

1. **Zero diacritice** in tot textul de pe site (a/i/s/t, nu ă/î/ș/ț).
2. **Ton**: umor + sarcasm. Panda comenteaza prin `.ssarc` (balon cu eticheta "Panda" pusa din CSS; nu incepe textul cu emoji).
3. **Fara emoji in interfata** (butoane, etichete, titluri de sectiune). Emoji raman doar in vocea lui Panda din continutul retetelor.
4. **Ingrediente**: linkuri catre Freshful.ro (primar), Carrefour/Bringo (secundar).
5. **Cuptor**: temperatura °C + mod (convectie / sus+jos) + treapta Zanussi (1–8). Butonul Zanussi se deseneaza din `--knob` (calculat din treapta).

## Reguli tehnice (invatate pe pielea noastra)

- **Modal CSS-only**: checkbox `.modal-toggle` + `#cb-ID:checked ~ #m-ID`. Checkbox-ul are `position:fixed;top:0;left:0`. `.modal` are `overflow:hidden`, deci `.mclose` sta in `.mhead`.
- **Ferestrele inchise au `display:none`**; o reteta noua primeste `display:flex` in regula ei `:checked`. NU reveni la `opacity:0`: pe iPhone, ~24 de straturi fixe ascunse doar cu opacity inchideau pagina la scroll (fix pe 2026-10-18).
- Esc si click in afara inchid orice `.modal-toggle` bifat (handler generic; nu exista liste de ID-uri).
- `html` si `body` au `overflow-x: clip` (nu `hidden`), altfel bara de tab-uri nu ramane sticky.
- Bannerul hero: `img/banner.webp` (desktop) + `img/banner-1000.jpg` (telefon, acelasi banner micsorat). Nu se decupeaza pentru telefon.

## Design ("Eticheta de borcan", culori luate din banner)

- Tokeni: `--paper #F1E4CB`, `--cream #FBF4E4`, `--ink #1F160E`, `--red #8C2A14`, `--choc #4F3422`, `--gold #C9A46A`, `--leaf #2E3F22`, `--bam #4A5B30` (+ `--bam-dark/-light/-pale`, `--line`, `--line-soft`, neutre `--muted`, `--text-2/3/4`).
- Fonturi: Alfa Slab One (titluri, `--f-disp`) + Archivo variabil (`--f-body`; etichete cu `font-stretch` 70–85%, uppercase).
- Colturi drepte, chenare 2–3px `--ink`, doar umbre dure (`6px 6px 0 var(--ink)`).
