# 🐼 Bucataria lui Panda — Project Context for Claude Code

## Ce este proiectul
Site personal de retete cu umor si sarcasm, construit ca un single-file HTML deployat pe Netlify.
Tema: panda + bambus. Tot textul e in romana, fara diacritice (a/i/s/t in loc de a/i/s/t).

## URL
https://bucataria-lui-panda.netlify.app/

## Stack actual
- **Frontend**: Single-file HTML (`index.html`) — CSS + JS inline
- **Hosting**: Netlify (free tier) — deploy prin drag & drop folder
- **Database**: Firebase Firestore (pentru propuneri de retete de la vizitatori)
- **Auth**: Firebase Authentication (Email/Password) — admin login
- **AI Search**: Google Gemini 1.5 Flash API — prin Netlify Function serverless
- **Anti-spam**: Cloudflare Turnstile + honeypot field
- **Analytics**: Google Analytics 4 (G-K1S74KZPG4)
- **SEO**: Google Search Console verificat

## Structura fisiere
```
panda-site/
├── index.html          # Tot site-ul (HTML + CSS + JS inline)
├── og.png              # Open Graph image pentru social preview (1200x630)
└── netlify/
    └── functions/
        └── gemini.js   # Serverless function — apeleaza Gemini API securizat
```

## Firebase Config
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDw3LHs13FEelNbj8Dr0aBACUkgRnA-gE0",
  authDomain: "bucataria-lui-panda.firebaseapp.com",
  projectId: "bucataria-lui-panda",
  storageBucket: "bucataria-lui-panda.firebasestorage.app",
  messagingSenderId: "349643691527",
  appId: "1:349643691527:web:957d6e3ed75e1c6bbffca2"
};
```

## Firebase Service Account
- Email: firebase-adminsdk-fbsvc@bucataria-lui-panda.iam.gserviceaccount.com
- Folosit in Google Apps Script pentru email notifications

## Cloudflare Turnstile
- Site Key: 0x4AAAAAADYZeequGONwnrCy
- Secret Key: 0x4AAAAAADYZeXiFH3OgmoD3FCnOS8yIZh8
- Domain: bucataria-lui-panda.netlify.app

## Netlify Environment Variables
- `GEMINI_API_KEY` — Google Gemini API key (setat in Netlify dashboard, secret)

## Google Apps Script (Email Notifier)
- Monitorizeaza Firestore la fiecare 5 minute
- Trimite email la Antonio.nula@gmail.com cand apare propunere noua
- Fisier: panda-apps-script.js

## Design System
```css
--black: #1A1A1A
--bamboo: #7FB069
--bamboo-dark: #4E7C3F
--bamboo-pale: #EDF5E7
--panda-dark: #2B2B2B
--white: #FAFAF8
--off-white: #F5F5F0
```
- Fonturi: Fredoka One (titluri) + Nunito (body)
- Google Fonts CDN

## Reguli obligatorii de stil
1. **ZERO diacritice** in tot textul (a/i/s/t nu a/i/s/t)
2. **Ton**: umor + sarcasm in tot continutul
3. **Panda** comenteaza la fiecare pas prin clasa `.ssarc`
4. **Ingrediente**: linkuri catre Freshful.ro (primar), Carrefour/Bringo (secundar)
5. **Cuptor**: temperatura °C + convectie/sus+jos + Zanussi treapta (scala 1-8)

## Structura modala (CSS-only, fara JS pentru deschidere)
```html
<!-- Checkbox trigger -->
<input type="checkbox" id="cb-RID" class="modal-toggle"
  style="position:fixed;top:0;left:0;opacity:0;pointer-events:none;width:0;height:0">

<!-- Card -->
<label class="rcard" for="cb-RID" data-tags="dulciuri healthy">...</label>

<!-- Modal overlay -->
<div class="moverlay" id="m-RID">
  <div class="modal" style="--ma:#COLOR">
    <div class="mhead">
      <label class="mclose" for="cb-RID">✕</label>
      <span class="memoji">🍫</span>
      <div class="mcat">Categorie</div>
      <h2 class="mtitle">Titlu Reteta</h2>
      <p class="msub">Subtitlu</p>
    </div>
    <div class="mbody">
      <!-- macros, itable, obox, slist, tips, photo-zone -->
    </div>
  </div>
</div>

<!-- CSS selector pentru deschidere -->
<style>#cb-RID:checked ~ #m-RID { opacity:1; pointer-events:all; }</style>
```

## Clase CSS importante pentru modals
| Clasa | Rol |
|-------|-----|
| `.macros` | Grid macros nutritionale |
| `.mbox/.mval/.mlbl` | Macro individual |
| `.rsec/.rstitle` | Sectiune in modal |
| `.itable` | Tabel ingrediente |
| `.slink` | Link Freshful |
| `.obox/.olbl/.oval/.osub` | Setari cuptor |
| `.slist/.sitem/.snum/.stitle/.stext` | Lista pasi |
| `.ssarc` | Comentariu sarcastic panda |
| `.tips/.tip` | Sfaturi finale |
| `.photo-zone` | Zona upload poza |

## Retete existente (9 total)
1. Brownies Proteice (~130 cal) — cb-brownies
2. Cookies Crocante Arabe — cb-cookies
3. Zabaglione Fara Alcool — cb-zabaglione
4. Biscuiti Nutella & Inghetata — cb-nutella
5. Prajitura in Cana — cb-cana
6. Muffin Cups Unt Arahide — cb-muffins
7. Brownie No-Bake Fructe de Padure — cb-browniefructe
8. Bagels cu Oua & Bacon (513 cal, 40g proteina) — cb-bagels
9. Muffin Cups PB & Ciocolata (~130 cal) — cb-pbmuffins

## Tab 2 — "Hai sa gatim cu ce avem" (Gemini AI)
- Formular cu: preparat dorit, pofta (dulce/sarat), ingrediente chips + text, timp, cuptor
- Apeleaza `/.netlify/functions/gemini` (POST)
- Rate limiting: 5 cereri / 15 minute / IP (in-memory in gemini.js)
- Returneaza JSON array cu 10 retete: titlu, timp, dificultate, descriere, sarcasm, link

## Ce urmeaza de implementat
- [ ] **Premium tier** (5€/luna): cautari nelimitate + retete salvate in cont
- [ ] **Stripe** pentru plati
- [ ] **User accounts** (Firebase Auth extins sau Netlify Identity)
- [ ] **Database** pentru retete salvate per user

## Admin
- Email admin: Antonio.nula@gmail.com
- Firebase Auth user creat
- Admin panel in pagina: buton discret → login → vede propunerile vizitatorilor

## Note tehnice importante
- `overflow:hidden` pe `.modal` → `mclose` trebuie sa fie INAUNTRUL `.mhead`
- Checkboxuri modal: `position:fixed;top:0;left:0` (nu absolute — previne scroll bug)
- ESC si click outside inchid modalele (JS vanilla, nu inline onclick)
- Photo upload: compresie automata Canvas API (max 1200x1200, JPEG 70%)
- Poze stocate ca base64 in Firestore (limita 1MB/doc — compresia rezolva)
