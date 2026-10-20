# Sprint Tehnic — securitate, buguri, mentenanta

## Securitate (urgent)

- [ ] **Schimba cheia secreta Cloudflare Turnstile.** A fost scrisa in `PANDA_CONTEXT.md` din primul commit, iar repo-ul e public. Cloudflare → Turnstile → widget-ul "Bucataria lui Panda" → Settings → **Rotate secret key**, apoi pune noua cheie in Vercel → Settings → Environment Variables → `TURNSTILE_SECRET_KEY` si fa redeploy. Stergerea din fisier nu ajunge: cheia ramane in istoricul git.
- [ ] **Reguli Firestore prea deschise** pe colectiile `notifications` si `stats` (semnalat de sesiunea Turnstile pe 2026-10-17).

## Buguri

- [ ] **Contor "Retete propuse" = 0 pentru userii obisnuiti**: profilul numara propunerile dupa `userEmail`; de verificat ca `/api/propose` salveaza `uid` si `userEmail`.
- [ ] **"Copiaza link" din reteta nu arata nimic** daca browserul refuza accesul la clipboard (lipseste `.catch` cu varianta de rezerva).

## Continut

- [ ] **Textele legale** (Confidentialitate, Termeni) au inca diacritice; regula site-ului e fara diacritice.

## Asteptam raspuns

- [ ] **Zscaler**: cerere de reclasificare trimisa pe 2026-10-17 (Blogs; Dining/Restaurant). Cand se aproba, imaginile apar si din reteaua Aera.
