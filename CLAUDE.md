# CLAUDE.md — Il Corriere di Qui

Issue e documenti del progetto si scrivono in italiano.

## Regole di lavoro

- **Carica le skill Vue prima di toccare codice Vue** (file `.vue`, composable, pagine, layout, routing): con lo strumento Skill carica `vue-skills-bundle:vue-best-practices`, più le altre skill Vue pertinenti (router, test, debug, composable), e seguile. Vale anche per le modifiche piccole.
- **Un branch e una PR per ogni ticket o Articolo.** Non si lavora direttamente su `main`: il merge della PR pubblica il sito (vedi `docs/adr/0001-sito-statico-pubblicazione-con-il-merge.md`).
- **Prima di iniziare, verificare o chiudere un ticket** leggi «Consegna di un ticket» in `docs/agents/issue-tracker.md`.

## Comandi locali

La versione di Node è in `.nvmrc` (`nvm use`).

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Server di sviluppo |
| `npm run lint` | ESLint tramite `@nuxt/eslint` (`eslint.config.mjs`) |
| `npm run typecheck` | Controllo dei tipi di tutto il TypeScript: l'app tramite `nuxt typecheck`; test, script e le configurazioni di Vitest, Tailwind e dei contenuti tramite `tsconfig.tools.json` |
| `npm run test` | Vitest, senza build: i test sui file del repo in `tests/content/` e sulle funzioni di `app/utils/` in `tests/unit/` |
| `npm run generate` | Build statica in `.output/public` |
| `npm run test:site` | Vitest: i test sul sito generato in `tests/site/`; prima serve `npm run generate` |
| `npm run verify:deploy -- <url>` | Verifica un sito pubblicato (anteprima di Netlify o produzione) confrontandolo con la build locale in `.output/public` dello stesso commit; prima serve `npm run generate`. La resa delle immagini si guarda a occhio |

La CI (`.github/workflows/ci.yml`) esegue installazione, lint, controllo dei tipi, test, `nuxt generate` e test del sito generato su ogni PR e su ogni push su `main`.

## Agent skills

### Issue tracker

Le issue vivono su GitHub Issues (`hawz/corriere-di-qui`), gestite con la CLI `gh`. Vedi `docs/agents/issue-tracker.md`.

### Triage labels

Etichette canoniche di default (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). Vedi `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` alla radice del repo. Vedi `docs/agents/domain.md`.
