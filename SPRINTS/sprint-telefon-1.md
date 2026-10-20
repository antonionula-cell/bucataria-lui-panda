# Sprint Telefon 1 — constatari din analiza de pe telefon

Analiza facuta pe 2026-10-20 dintr-o sesiune cloud (main `bf4ab53`), de verificat pe laptop. Nimic din lista asta nu e inca schimbat in cod. Fiecare punct are dovada din cod, ca sa poata fi confirmat repede.

## Securitate

- [ ] **`/api/notify` e un releu de email deschis.** Fara autentificare, CORS `*`, iar tipurile `welcome_user` si `reset_password` trimit la `data.email` primit in request, cu `data.link` arbitrar. Oricine poate trimite emailuri cu brandul site-ului (si de pe domeniul propriu, daca `RESEND_FROM` e setat) catre orice adresa, cu link de phishing. In plus, `data.*` intra neescapat in HTML-ul emailului.
  - Dovada: `panda-site/api/notify.js` (templates `welcome_user`, `reset_password`, `to: data?.email`).
  - Propunere: sterge tipul `reset_password` din `notify.js` (resetarea se face deja in `api/reset-password.js`); `welcome_user` si `new_user` sa ceara `idToken` Firebase si sa trimita doar la emailul din token; `new_proposal` sa fie trimis direct din `api/propose.js` dupa salvare, nu din browser; escape HTML pe tot ce vine din request.
- [ ] **Limita de 10 cautari AI / zi se aplica doar in browser.** `checkAndIncrementAiSearch()` ruleaza in pagina; `/api/gemini` nu verifica nici login, nici limita. Un apel direct ocoleste limita; ramane doar limita pe IP (in memorie, per instanta Vercel, se pierde la cold start).
  - Dovada: `panda-site/index.html` (`checkAndIncrementAiSearch`, `searchRecipes`), `panda-site/api/gemini.js`.
  - Propunere: `/api/gemini` cere `idToken`, verifica si incrementeaza `users/{uid}.aiSearches` cu Firebase Admin; regulile Firestore sa nu lase userul sa-si scrie singur `aiSearches`.
- [ ] **`/api/gemini` accepta orice prompt.** Clientul trimite promptul complet, deci endpoint-ul poate fi folosit ca proxy Gemini gratuit pentru orice. Propunere: serverul construieste promptul din campurile formularului (ingrediente, timp, cuptor etc.).
- [ ] **`api/reset-password.js` dezvaluie conturile Google.** Raspunsul `google_user` difera de `email_sent`, deci se poate afla ca un email are cont. Propunere: acelasi raspuns pentru toate cazurile; mesajul despre Google doar in email.
- [ ] **`AUTO_KILL_THRESHOLD` e declarat dar nefolosit** in `api/gemini.js` (kill switch-ul automat exista doar in varianta Netlify veche). Fie il implementam pe Vercel, fie il stergem.
- [ ] **Contorul de propuneri din profil citeste toata colectia `proposals` din browser.** Daca regulile permit citirea, orice user logat vede propunerile (si emailurile) tuturor; daca nu, contorul e 0. Vezi si bugul de mai jos.

## Buguri

- [ ] **Contor "Retete propuse" = 0 — cauza reala.** `/api/propose` salveaza corect `uid` si `userEmail`. Problema e in profil: `getDocs(query(collection(db, 'proposals')))` + filtrare dupa `userEmail` (`index.html`, `loadProfileData`). Pentru userii obisnuiti regulile probabil refuza citirea → `catch` gol → 0. Propunere: `query(collection(db,'proposals'), where('uid','==',user.uid))` + regula Firestore `allow read: if resource.data.uid == request.auth.uid` (sau contor in `users/{uid}` incrementat de `/api/propose`).
  - Inlocuieste punctul cu acelasi nume din `sprint-tehnic.md` (ipoteza de acolo nu se confirma).
- [ ] **"Copiaza link" fara rezerva cand clipboard-ul e refuzat.** `_shareRecipe` are `.then` fara `.catch` (`index.html`). Confirmat; propunere: `.catch` → varianta cu `textarea` + `execCommand('copy')`, sau toast cu linkul de copiat manual.

## Corecturi in celelalte sprinturi

- [ ] **Sprint 0 — Download JSON e deja gata**: `downloadProposals` exporta doar `status === 'accepted'`. De bifat `[x]` dupa o proba.
- [ ] **Sprint 0 — Accept/Reject**: lista principala arata deja doar propunerile `pending`. Ce lipseste e **arhiva** (acceptate + respinse); nu exista in cod.
- [ ] **Sprint 0 — notificare user nou**: emailul catre Antonio e tipul `new_user`, nu `welcome_user` (acela e emailul de bun venit catre user). De corectat textul.

## Curatenie

- [ ] **`PANDA_CONTEXT.md` e depasit si contrazice `CLAUDE.md`** (Netlify, 9 retete, paleta si fonturile vechi) si contine cheia secreta Turnstile. Propunere: sters sau redus la o linie "vezi CLAUDE.md". Cheia veche ramane in istoricul git, dar a fost deja rotita pe 2026-10-20 (vezi `sprint-tehnic.md`), deci nu mai e valida.
- [ ] **Cod Netlify ramas**: `panda-site/netlify/functions/gemini.js` si `panda-site/netlify.toml` nu mai sunt folosite (site-ul e pe Vercel). De sters dupa confirmare ca nu mai exista deploy Netlify activ.
- [ ] **Reguli Firestore in repo**: nu exista `firestore.rules` in repo, deci regulile nu pot fi revizuite sau versionate. Propunere: exporta regulile actuale din consola Firebase in `firestore.rules` (fara secrete, e sigur in repo public).

## Ordine propusa

1. `/api/notify` (cel mai grav, exploatabil acum).
2. Rotire cheie Turnstile + stergere `PANDA_CONTEXT.md`.
3. Reguli Firestore in repo + bugul contorului de propuneri.
4. Limita AI si prompt construit pe server in `/api/gemini`.
5. Restul (reset-password, clipboard, curatenie Netlify, corecturi Sprint 0).
