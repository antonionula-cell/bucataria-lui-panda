# Latest changes — Bucataria lui Panda

Jurnalul tuturor modificarilor din repo. Cea mai noua intrare sta sus. Ora e ora Romaniei (Europe/Bucharest).

Format:

```
## AAAA-LL-ZZ HH:MM — titlu scurt
- Cine: Antonio / Claude (laptop / telefon)
- Branch: nume-branch (commit abc1234)
- Ce s-a facut: ...
- Fisiere: ...
- Stare: pe branch / in main (live)
```

---

## 2026-10-20 16:06 — Regula: verifica LATEST_CHANGES inainte de orice lucru
- Cine: Claude (telefon, sesiune cloud)
- Branch: `claude/repository-overview-1jtsju` (pornit din `latest-changes`)
- Ce s-a facut: adaugat pasul 0 in "Flux de lucru" din `CLAUDE.md`: inainte de orice sarcina, `git fetch`, citit `LATEST_CHANGES.md` si branch-urile recente, ca sa nu refacem ce s-a facut deja de pe laptop. Actualizat `sprint-telefon-1.md`: cheia Turnstile e deja rotita.
- Fisiere: `CLAUDE.md`, `SPRINTS/sprint-telefon-1.md`, `LATEST_CHANGES.md`
- Stare: pe branch, nu e in `main`

## 2026-10-20 16:05 — Jurnalul completat cu modificarile de pe laptop
- Cine: Claude (laptop), la cererea lui Antonio
- Branch: `latest-changes` (pornit din `claude/repository-overview-1jtsju` + `main`)
- Ce s-a facut: adus `main` in branch-ul jurnalului (cheia Turnstile rotita, `d531afa`); adaugata intrarea pentru cheia Turnstile; corectat "Cine" la intrarile din 2026-10-20 11:40 si 2026-10-18 09:23 (facute de Claude pe laptop, cu acordul lui Antonio).
- Fisiere: `LATEST_CHANGES.md`
- Stare: pe branch, nu e in `main`

## 2026-10-20 16:03 — Jurnal LATEST_CHANGES.md + regula in CLAUDE.md
- Cine: Claude (telefon, sesiune cloud)
- Branch: `claude/repository-overview-1jtsju`
- Ce s-a facut: creat acest fisier; adaugata in `CLAUDE.md` regula ca orice modificare se noteaza aici, cu data, ora si ce s-a facut, in acelasi commit cu schimbarea.
- Fisiere: `LATEST_CHANGES.md`, `CLAUDE.md`
- Stare: pe branch, nu e in `main`

## 2026-10-20 11:54 — Sprint Telefon 1
- Cine: Claude (telefon, sesiune cloud)
- Branch: `claude/repository-overview-1jtsju` (commit `a63758f`)
- Ce s-a facut: fisier nou de sprint cu constatarile din analiza codului (securitate `/api/notify` si `/api/gemini`, bugul contorului de propuneri, corecturi la Sprint 0, curatenie `PANDA_CONTEXT.md` si cod Netlify). Doar documentatie, fara cod schimbat.
- Fisiere: `SPRINTS/sprint-telefon-1.md`, `SPRINTS/README.md`
- Stare: pe branch, nu e in `main`

## 2026-10-20 11:52 — Cheia secreta Turnstile rotita
- Cine: Antonio (Cloudflare + Vercel), Claude (laptop) a verificat si a bifat in sprint
- Branch: `main` (merge `d531afa`)
- Ce s-a facut: cheia secreta Turnstile, expusa in vechiul `PANDA_CONTEXT.md` (repo public), rotita in Cloudflare si inlocuita in Vercel (`TURNSTILE_SECRET_KEY`, Production + Preview), redeploy pe `main`. Verificat: `/api/propose` primeste `invalid-input-response` pentru un token fals, deci cheia noua e valida. Bifat in `SPRINTS/sprint-tehnic.md`.
- Fisiere: `SPRINTS/sprint-tehnic.md` (cheia propriu-zisa e doar in Vercel)
- Stare: in `main` (live)

## 2026-10-20 11:40 — Sprinturile in repo + CLAUDE.md
- Cine: Claude (laptop), cu acordul lui Antonio
- Branch: `main` (merge `bf4ab53`)
- Ce s-a facut: folderul `SPRINTS/` cu sprinturile proiectului si `CLAUDE.md` cu regulile pentru sesiunile de pe telefon/cloud.
- Fisiere: `CLAUDE.md`, `SPRINTS/*`
- Stare: in `main`

## 2026-10-18 09:23 — Banner nou, mai ingust
- Cine: Claude (laptop), cu acordul lui Antonio
- Branch: `main` (merge `de2b056`)
- Ce s-a facut: banner hero 2000x424, intreg si pe telefon.
- Fisiere: `panda-site/index.html`, `panda-site/img/banner.webp`, `panda-site/img/banner-1000.jpg`, `panda-site/sw.js`
- Stare: in `main` (live)

Istoricul mai vechi: `git log --oneline main`.
