# Sprint Tehnic — securitate, buguri, mentenanta

## Securitate (urgent)

- [x] **Schimba cheia secreta Cloudflare Turnstile.** Facut pe 2026-10-20: cheia rotita in Cloudflare si pusa in Vercel (`TURNSTILE_SECRET_KEY`, Production + Preview), redeploy pe main. Verificat: `/api/propose` primeste de la Cloudflare `invalid-input-response` pentru un token fals, deci cheia e valida. (Cheia veche ramane in istoricul git, dar nu mai e buna.)
- [ ] **Reguli Firestore prea deschise** pe colectiile `notifications` si `stats` (semnalat de sesiunea Turnstile pe 2026-10-17).

## Buguri

- [ ] **Contor "Retete propuse" = 0 pentru userii obisnuiti**: profilul numara propunerile dupa `userEmail`; de verificat ca `/api/propose` salveaza `uid` si `userEmail`.
- [ ] **"Copiaza link" din reteta nu arata nimic** daca browserul refuza accesul la clipboard (lipseste `.catch` cu varianta de rezerva).

## Continut

- [ ] **Textele legale** (Confidentialitate, Termeni) au inca diacritice; regula site-ului e fara diacritice.

## Asteptam raspuns

- [ ] **Zscaler**: cerere de reclasificare trimisa pe 2026-10-17 (Blogs; Dining/Restaurant). Cand se aproba, imaginile apar si din reteaua Aera.
