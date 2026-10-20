# Sprint 0 — Admin, useri si propuneri

Stare verificata in cod pe 2026-10-20 (main `de2b056`). `[?]` = exista in cod, netestat cap-coada.

## Admin si useri

- [?] **Notificare la user nou**: email instant la Antonio la fiecare inregistrare. Exista `api/notify.js` (tip `welcome_user`) si tab-ul "Notificari" in admin.
- [x] **Lista useri in admin**: tab "Useri" (email, data inregistrare, retete salvate, propuneri, rol).
- [x] **Multi-admin (roluri)**: `role: 'admin'` in Firestore `users`; in cod `isAdminUser`. Adminii pot publica si vedea propuneri, doar Antonio gestioneaza useri.

## Propuneri

- [~] **Accept / Reject + generare + publicare**: exista tab-ul "AI Propuse", preview complet generat de Gemini si publicare in `publishedRecipes`; starea `rejected` exista. De verificat ca lista principala arata doar propunerile neprocesate si ca arhiva (acceptate + respinse) e separata.
- [x] **Insigna "Comunitate"**: retetele publicate din propuneri au `source: 'community'` si insigna pe card.
- [ ] **Download JSON**: descarca doar retetele cu `status: 'accepted'`.

## Profil user

- [~] **Contor "Retete propuse" in profil**: exista, dar arata 0 pentru userii obisnuiti de cand propunerile trec prin `/api/propose` (vezi `sprint-tehnic.md`).
