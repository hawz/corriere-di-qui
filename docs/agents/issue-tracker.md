# Issue tracker: GitHub

Le issue e le spec di questo repo sono issue su GitHub (`hawz/corriere-di-qui`). Per tutte le operazioni usa la CLI `gh`. Titoli, testi e commenti si scrivono in italiano.

## Convenzioni

- **Creare una issue**: `gh issue create --title "..." --body "..."`. Per i testi su più righe usa un heredoc.
- **Leggere una issue**: `gh issue view <numero> --json number,title,body,labels,comments`.
- **Elencare le issue**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`, con i filtri `--label` e `--state` che servono.
- **Rendere una issue sub-issue di un'altra**: `gh issue create --parent <padre> ...`, oppure dopo con `gh issue edit <padre> --add-sub-issue <figlia>` (`gh` 2.94+). Con `gh` più vecchio: `gh api --method POST repos/<owner>/<repo>/issues/<padre>/sub_issues -F sub_issue_id=<id-db-figlia>` (id del database, come in **Blocchi**). Senza sub-issue, scrivi `Parte di #<padre>` in cima al testo della figlia.
- **Blocchi**: usa le **dipendenze native** di GitHub, la rappresentazione ufficiale e visibile nell'interfaccia. Aggiungi un vincolo con `gh issue create --blocked-by <n>,<n> ...` o `gh issue edit <figlia> --add-blocked-by <bloccante>` (`gh` 2.94+). Con `gh` più vecchio: `gh api --method POST repos/<owner>/<repo>/issues/<figlia>/dependencies/blocked_by -F issue_id=<id-db-bloccante>`, dove `<id-db-bloccante>` è l'**id del database** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _non_ il `#numero` né il `node_id`). Se le dipendenze non sono disponibili, scrivi `Bloccata da: #<n>, #<n>` in cima al testo della figlia. Una issue è sbloccata quando tutte le bloccanti sono chiuse.
- **Contare i blocchi aperti**: `gh api repos/<owner>/<repo>/issues/<n> --jq .issue_dependencies_summary.blocked_by` (solo le bloccanti aperte; 0 significa che si può iniziare). `gh issue view <n> --json blockedBy` elenca anche quelle chiuse, quindi filtra: `--jq '[.blockedBy.nodes[] | select(.state == "OPEN")] | length'`.
- **Commentare**: `gh issue comment <numero> --body "..."`
- **Aggiungere o togliere etichette**: `gh issue edit <numero> --add-label "..."` / `--remove-label "..."`
- **Chiudere**: scrivi la motivazione con `gh issue comment <numero> --body "..."`, poi `gh issue close <numero>`. Su una issue già chiusa, `gh issue close --comment` scarta il commento ed esce comunque con 0. Per un ticket implementato segui prima **Consegna di un ticket**.

`gh` ricava il repo da `git remote -v` quando è eseguito dentro un clone.

Apri issue solo nei repo dell'utente. Non aprirne mai in `mattpocock/skills` (il repo da cui arrivano queste skill). In un fork, `gh` può puntare al repo di origine: prima del primo `gh issue create` di una sessione controlla la destinazione con `gh repo view --json nameWithOwner` e, se non è un repo dell'utente, chiedi conferma.

## Consegna di un ticket

Un ticket implementato passa da questi passi, in ordine. Decide l'utente quando aprire la PR, quando unirla e quando chiudere la issue.

1. **Branch.** Passa su `main`, fai `git pull`, e solo dopo crea il branch del ticket. Vale per ogni ticket, anche subito dopo il merge del precedente.
2. **Implementazione.** Il lavoro finisce con un commit sul branch. Push e PR aspettano la richiesta dell'utente.
3. **PR.** Il testo è in italiano, ha una lista di cose da controllare sull'anteprima e cita il ticket con `Refs #<numero>`: con `Closes` il merge chiuderebbe la issue prima delle verifiche.
4. **Anteprima.** Su richiesta, verifica `https://deploy-preview-<numero-PR>--corriere-di-qui.netlify.app` sul commit in testa alla PR: CI e deploy riusciti, e ogni voce della lista provata oppure dichiarata non verificata.
5. **Merge.** Lo fa l'utente.
6. **Dopo il merge.** Aggiorna `main` in locale, controlla che la CI sul commit di merge sia passata e confronta la produzione con l'anteprima verificata.
7. **Chiusura**, solo con l'ok dell'utente:
   - Se durante il lavoro il ticket è cambiato (per esempio ha un'estensione in più), proponi di aggiornarne il testo e fallo solo se l'utente è d'accordo.
   - Spunta i criteri di accettazione verificati: rileggi il testo attuale (`gh issue view <numero> --json body --jq .body`), modificalo e ricaricalo con `gh issue edit <numero> --body-file <file>`. Un criterio non verificato resta da spuntare, e va detto all'utente prima di chiudere.
   - Chiudi come completata con un commento in italiano: cosa è cambiato, verifiche fatte, scostamenti dal ticket e limiti noti.
   - Rileggi la issue e controlla stato e spunte.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Metti `yes` se questo repo tratta le PR esterne come richieste di funzionalità; `/triage` legge questo valore.)_

Con `yes`, le PR seguono le stesse etichette e gli stessi stati delle issue, con i comandi `gh pr` corrispondenti:

- **Leggere una PR**: `gh pr view <numero>`, poi `gh pr view <numero> --comments` (fuori da un TTY, `--comments` stampa solo i commenti) e `gh pr diff <numero>` per il diff.
- **Elencare le PR esterne da valutare**: `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Commentare, etichettare, chiudere**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub numera issue e PR nella stessa sequenza, quindi un `#42` può essere l'una o l'altra: prova con `gh pr view 42` e, se fallisce, usa `gh issue view 42`.

## Quando una skill dice "publish to the issue tracker"

Crea una issue su GitHub.

## Quando una skill dice "fetch the relevant ticket"

Leggila come in **Leggere una issue**.

## Wayfinding operations

Usate da `/wayfinder`. La **mappa** è una singola issue, con le issue **figlie** come ticket.

- **Mappa**: una issue con etichetta `wayfinder:map`, che contiene le sezioni Notes / Decisions-so-far / Fog. `gh issue create --label wayfinder:map`.
- **Ticket figlio**: una issue collegata alla mappa come sub-issue (vedi **Rendere una issue sub-issue di un'altra**). Se le sub-issue non sono attive, aggiungi il ticket a una task list nel testo della mappa e scrivi `Parte di #<mappa>` in cima al ticket. Etichette: `wayfinder:<tipo>` (`research`/`prototype`/`grilling`/`task`). Quando qualcuno prende in carico il ticket, gli viene assegnato.
- **Blocchi**: vedi **Blocchi** nelle Convenzioni.
- **Frontiera**: elenca le figlie aperte della mappa (`gh issue list --state open`, limitato alle sue sub-issue o alla task list), scarta quelle con un blocco aperto (vedi **Contare i blocchi aperti**, o una issue aperta nella riga `Bloccata da`) o già assegnate; vince la prima nell'ordine della mappa.
- **Presa in carico**: `gh issue edit <n> --add-assignee @me`, la prima scrittura della sessione.
- **Risoluzione**: `gh issue comment <n> --body "<risposta>"`, poi `gh issue close <n>`, poi aggiungi alle Decisions-so-far della mappa un rimando (sintesi e link).
