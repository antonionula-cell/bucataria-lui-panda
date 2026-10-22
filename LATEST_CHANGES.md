# Latest changes — Bucataria lui Panda

Jurnalul tuturor modificarilor din repo. Cea mai noua intrare sta sus. Ora e ora Romaniei (Europe/Bucharest).

Format:

```
## 2026-10-22 16:28 — Meta description pentru Google
- Cine: Claude (laptop), la cererea lui Antonio
- Branch: `meta-description`
- Ce s-a facut: pagina nu avea `<meta name="description">` (doar `og:` si `twitter:`), deci Google alegea singur textul de sub titlu. Adaugat un rand de 158 de caractere. Context: Search Console arata pagina principala "Crawled - currently not indexed" (crawl din 2026-10-17, ziua mutarii domeniului); Antonio cere indexarea manual (URL inspection → Request indexing). "Page with redirect" e `http://` / `www`, redirectionate intentionat. `sw.js` CACHE `panda-v19`, peste `panda-v17`/`panda-v18` folosite pe `legal-gdpr` (nemergeat), ca sa nu se suprapuna versiunile.
- Fisiere: `panda-site/index.html`, `panda-site/sw.js`, `LATEST_CHANGES.md`
- Stare: pe branch, asteapta acordul lui Antonio pentru `main`

## 2026-10-21 14:43 — Erorile: mesaj de-al lui Panda pentru vizitator, eroarea bruta pe mail
- Cine: Claude (laptop), la cererea lui Antonio
- Branch: `erori-prietenoase`
- Ce s-a facut: cautarea afisa eroarea bruta Gemini (402 "prepayment credits are depleted", cu JSON si linkuri de billing). Acum, in cele 7 locuri care aratau `e.message` (cautare retete, preview reteta completa, propune pentru site, salveaza la favorite, publica (admin), genereaza din propunere (admin), stergere cont), vizitatorul vede mesajul `PANDA_OOPS`, iar `reportError()` trimite eroarea bruta prin `/api/notify` (tip nou `site_error`) la `panda@bucatarialuipanda.ro`: unde, cand, utilizator, pagina, eroare. Aceeasi eroare pleaca o singura data pe pagina. Limitele de la `/api/gemini` (429, 503) sunt deja mesaje de-ale lui Panda, deci se afiseaza ca atare si nu trimit mail. Generarea din propunere verifica acum si raspunsul HTTP. Textul din emailul de eroare e scapat (HTML). Creditul Gemini a fost reincarcat de Antonio (20$, prepay), iar `/api/gemini` raspunde din nou. `sw.js` CACHE `panda-v16`.
- Fisiere: `panda-site/index.html`, `panda-site/api/notify.js`, `panda-site/sw.js`, `LATEST_CHANGES.md`
- Stare: in `main` (merge 2026-10-21 14:48, live)

## 2026-10-21 14:30 — Cautarea merge si doar cu "Ce vrei sa gatesti?"
- Cine: Claude (laptop), la cererea lui Antonio
- Branch: `cautare-un-camp`
- Ce s-a facut: "Gaseste-mi retete, Panda!" cerea macar un ingredient (chip sau "Alte ingrediente") si refuza cautarea cand era completat doar preparatul dorit. Acum ajunge oricare dintre cele 3 campuri. Fara ingrediente, prompt-ul cere variante ale preparatului cu ingrediente obisnuite, iar Panda are replici proprii pentru cazul asta (inainte ar fi zis "Doua ingrediente"). `sw.js` CACHE `panda-v15`.
- Fisiere: `panda-site/index.html`, `panda-site/sw.js`, `LATEST_CHANGES.md`
- Stare: in `main` (merge 2026-10-21 14:33, live; publicat direct la cererea lui Antonio, testat pe bucatarialuipanda.ro)

## 2026-10-21 14:31 — Scriptul vechi de notificari oprit (in afara repo-ului, consemnat acum)
- Cine: Antonio
- Ce s-a facut: sters trigger-ul `checkNewProposals` al Google Apps Script "Panda Email Notifier" (verifica Firestore la 5 minute si trimitea emailuri de pe Gmail, cu link catre vechiul netlify.app). Notificarile vin acum doar din `api/notify.js`, prin Resend, la `panda@bucatarialuipanda.ro`. Proiectul Apps Script ramane salvat, fara trigger. Tot azi: incidentul GitGuardian pentru cheia Turnstile veche marcat rezolvat (cheia e rotita).
- Stare: facut

## 2026-10-21 13:48 — Notificarile admin sosesc pe panda@bucatarialuipanda.ro
- Cine: Claude (laptop), la cererea lui Antonio
- Branch: `notify-panda`
- Ce s-a facut: emailurile "Propunere noua" si "User nou" (si adresa de rezerva) merg acum la `panda@bucatarialuipanda.ro` (alias pe contul Zoho), nu la `Antonio.nula@gmail.com`. Adresa sta intr-o singura constanta, `ADMIN_INBOX`. Neatinse: `ADMIN_EMAIL` din `index.html` (contul de login admin) si adresele de contact din textele legale.
- Fisiere: `panda-site/api/notify.js`, `LATEST_CHANGES.md`
- Stare: in `main` (merge 2026-10-21 13:55, live)

## 2026-10-21 13:43 — Emailuri de pe panda@bucatarialuipanda.ro, in main
- Cine: Claude (laptop), cu acordul lui Antonio
- Branch: `main` (merge din `notify-erori`)
- Ce s-a facut: domeniul `bucatarialuipanda.ro` verificat in Resend (regiunea EU, Irlanda; doar trimitere, primirea ramane la Zoho). In Vercel DNS: TXT `resend._domainkey`, CNAME `send` → `send.forge.rmta.net`, CNAME `rsend` → `rsend-euw1.forge.rmta.net`. MX si SPF-ul Zoho de pe domeniul principal neatinse. Notificarile si emailurile de bun venit pleaca acum de pe `panda@bucatarialuipanda.ro`.
- Fisiere: `panda-site/api/notify.js`, `LATEST_CHANGES.md`
- Stare: in `main` (live)

## 2026-10-21 11:41 — Emailurile prin Resend nu mai esueaza in tacere
- Cine: Claude (laptop), la cererea lui Antonio
- Branch: `notify-erori`
- Ce s-a facut: la propunerea de test din 2026-10-21 a sosit doar emailul scriptului vechi (Google Apps Script "Panda Email Notifier"), nu si cel trimis de site prin Resend. `api/notify.js` ignora raspunsul Resend, deci orice refuz (cheie gresita, destinatar nepermis) trecea neobservat. Acum un refuz e scris in logurile Vercel (`[Notify] Resend refuzat`) si endpoint-ul raspunde 502 cu detaliul. Site-ul apeleaza notify fara sa astepte raspunsul, deci vizitatorii nu vad nimic diferit. Cauza gasita in Resend → Logs: 403 "Testing domain restriction", adica `onboarding@resend.dev` trimite doar catre emailul contului Resend. Expeditorul implicit devine `panda@bucatarialuipanda.ro` (domeniul trebuie verificat in Resend, cu inregistrarile DNS puse in Vercel). Trigger-ul scriptului vechi ramane activ pana merg emailurile Resend.
- Fisiere: `panda-site/api/notify.js`, `LATEST_CHANGES.md`
- Stare: in `main` (merge 2026-10-21 13:43)

## 2026-10-21 11:23 — Propune reteta in fereastra separata, in main
- Cine: Claude (laptop), cu acordul lui Antonio (preview verificat)
- Branch: `main` (merge din `propune-pagina`)
- Ce s-a facut: formularul de propunere se deschide din butonul "Propune o reteta"; Turnstile se incarca doar la deschidere.
- Fisiere: `panda-site/index.html`, `panda-site/sw.js`, `LATEST_CHANGES.md`
- Stare: in `main` (live)

## 2026-10-20 16:39 — Propune reteta: formularul se deschide dintr-un buton
- Cine: Claude (laptop), la cererea lui Antonio
- Branch: `propune-pagina`
- Ce s-a facut: formularul "Propune o reteta" nu mai sta direct in pagina. In pagina ramane doar caseta "Arunci o idee la Panda?" cu butonul "Propune o reteta", care deschide formularul intr-o fereastra (acelasi mecanism ca la retete: Esc si click in afara inchid, link direct `#cb-propune`). Scriptul Cloudflare Turnstile se incarca abia la deschiderea ferestrei (render explicit), nu la fiecare vizita, asa ca tokenurile se emit doar pentru cine chiar propune si dispare avertismentul "Siteverify isn't being called". Butonul de trimitere are acum id propriu (`pf-send`), ca sa nu se confunde cu butonul de login admin. `sw.js` CACHE `panda-v14`.
- Fisiere: `panda-site/index.html`, `panda-site/sw.js`, `LATEST_CHANGES.md`
- Stare: in `main` (merge 2026-10-21 11:23)

## AAAA-LL-ZZ HH:MM — titlu scurt
- Cine: Antonio / Claude (laptop / telefon)
- Branch: nume-branch (commit abc1234)
- Ce s-a facut: ...
- Fisiere: ...
- Stare: pe branch / in main (live)
```

---

## 2026-10-20 16:08 — Jurnalul, Sprint Telefon 1 si regula 0 in main
- Cine: Claude (laptop), cu acordul lui Antonio
- Branch: `main` (merge din `latest-changes`, care include si `claude/repository-overview-1jtsju` pana la `72e3289`)
- Ce s-a facut: in `main` intra `LATEST_CHANGES.md`, `SPRINTS/sprint-telefon-1.md` si regulile 0 si 8 din `CLAUDE.md`. Regula 0 fusese scrisa in paralel si pe laptop si pe telefon; cele doua variante au fost unite intr-una singura.
- Fisiere: `CLAUDE.md`, `LATEST_CHANGES.md`, `SPRINTS/README.md`, `SPRINTS/sprint-telefon-1.md`
- Stare: in `main`

## 2026-10-20 16:06 — Regula: verifica LATEST_CHANGES inainte de orice lucru
- Cine: Claude (telefon, sesiune cloud)
- Branch: `claude/repository-overview-1jtsju` (pornit din `latest-changes`)
- Ce s-a facut: adaugat pasul 0 in "Flux de lucru" din `CLAUDE.md`: inainte de orice sarcina, `git fetch`, citit `LATEST_CHANGES.md` si branch-urile recente, ca sa nu refacem ce s-a facut deja de pe laptop. Actualizat `sprint-telefon-1.md`: cheia Turnstile e deja rotita.
- Fisiere: `CLAUDE.md`, `SPRINTS/sprint-telefon-1.md`, `LATEST_CHANGES.md`
- Stare: in `main` (merge 2026-10-20 16:08)

## 2026-10-20 16:06 — Regula: verifica intai ce s-a facut din cloud
- Cine: Claude (laptop), la cererea lui Antonio
- Branch: `latest-changes`
- Ce s-a facut: adaugat punctul 0 in "Flux de lucru" din `CLAUDE.md`: inainte de orice lucru, `git fetch`, citeste `LATEST_CHANGES.md` (pe `main` si pe branch-urile recente) si verifica branch-urile din cloud, ca nicio sesiune sa nu refaca sau sa suprascrie munca alteia. Aplicata imediat: la 2026-10-20 16:06 nu existau schimbari noi din cloud dupa `1962384` (telefon, inclus deja in acest branch).
- Fisiere: `CLAUDE.md`, `LATEST_CHANGES.md`
- Stare: in `main` (merge 2026-10-20 16:08)

## 2026-10-20 16:05 — Jurnalul completat cu modificarile de pe laptop
- Cine: Claude (laptop), la cererea lui Antonio
- Branch: `latest-changes` (pornit din `claude/repository-overview-1jtsju` + `main`)
- Ce s-a facut: adus `main` in branch-ul jurnalului (cheia Turnstile rotita, `d531afa`); adaugata intrarea pentru cheia Turnstile; corectat "Cine" la intrarile din 2026-10-20 11:40 si 2026-10-18 09:23 (facute de Claude pe laptop, cu acordul lui Antonio).
- Fisiere: `LATEST_CHANGES.md`
- Stare: in `main` (merge 2026-10-20 16:08)

## 2026-10-20 16:03 — Jurnal LATEST_CHANGES.md + regula in CLAUDE.md
- Cine: Claude (telefon, sesiune cloud)
- Branch: `claude/repository-overview-1jtsju`
- Ce s-a facut: creat acest fisier; adaugata in `CLAUDE.md` regula ca orice modificare se noteaza aici, cu data, ora si ce s-a facut, in acelasi commit cu schimbarea.
- Fisiere: `LATEST_CHANGES.md`, `CLAUDE.md`
- Stare: in `main` (merge 2026-10-20 16:08)

## 2026-10-20 11:54 — Sprint Telefon 1
- Cine: Claude (telefon, sesiune cloud)
- Branch: `claude/repository-overview-1jtsju` (commit `a63758f`)
- Ce s-a facut: fisier nou de sprint cu constatarile din analiza codului (securitate `/api/notify` si `/api/gemini`, bugul contorului de propuneri, corecturi la Sprint 0, curatenie `PANDA_CONTEXT.md` si cod Netlify). Doar documentatie, fara cod schimbat.
- Fisiere: `SPRINTS/sprint-telefon-1.md`, `SPRINTS/README.md`
- Stare: in `main` (merge 2026-10-20 16:08)

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
