# Sprint SEO Retete — poze, date pentru Google, pagini separate

Pornit din emailul Google Search Console din 2026-10-18: 9 retete cu probleme la datele structurate (JSON-LD).

- [ ] **Poze pentru cele 9 retete originale** (Brownies Proteice, Cookies Crocante, Zabaglione, Biscuiti Nutella, Prajitura in Cana, Muffin Cups unt de arahide, Brownie No-Bake, Bagels, Muffin Cups PB & Ciocolata). Antonio le face cu Grok, cate una pe reteta, cu preparatul real (Google nu accepta o imagine generica). Dupa ce vin: in `img/`, pe card (`.cthumb.has-img`) si in fereastra (`.mrecipe-img`).
- [ ] **Completeaza JSON-LD** pentru toate retetele: `image`, `recipeIngredient`, `recipeInstructions`, `cookTime`, `nutrition`, extrase din ferestrele existente. Adauga si "Triunghiuri de Biscuiti", care lipseste din lista (sunt 21 in JSON-LD, 22 pe site).
- [~] **Imagine generata automat pentru retetele AI publicate**: branch `imagine-reteta-ai` (commit `2ca232c`), preview construit, netestat inca cu API-ul Gemini real. Cost ~0,034 $ / imagine, cere facturare activa pe cheia Gemini. Nu e in `main`.
- [ ] **Pagini separate pentru fiecare reteta** (acum toate sunt ferestre pe o singura pagina, deci Google nu poate trimite pe cineva direct la o reteta). Pasul mare de SEO; sitemap-ul trebuie actualizat cu toate adresele.
