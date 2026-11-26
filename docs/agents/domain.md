# Documentazione di dominio

Come le skill di ingegneria usano la documentazione di dominio quando esplorano il codice.

## Prima di esplorare, leggi

- **`GLOSSARY.md`** alla radice del repo.
- **`docs/adr/`**: le ADR che riguardano l'area su cui stai per lavorare.

Se questi file non esistono, **prosegui senza segnalarlo** e senza proporre di crearli in anticipo. La skill `/domain-modeling` (usata da `/grill-with-docs` e `/improve-codebase-architecture`) li crea quando un termine o una decisione vengono davvero definiti.

## Struttura (single-context)

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-titolo-della-decisione.md
│   └── 0002-altra-decisione.md
└── app/
```

## Usa il vocabolario del glossario

Quando nomini un concetto di dominio (nel titolo di una issue, in una proposta di refactoring, in un'ipotesi, nel nome di un test), usa il termine definito in `GLOSSARY.md`. Non usare i sinonimi che il glossario esclude.

Se il concetto non è nel glossario, o stai inventando un linguaggio che il progetto non usa (ripensaci), o c'è una lacuna reale (annotala per `/domain-modeling`).

## Segnala i conflitti con le ADR

Se quello che proponi contraddice una ADR, dillo esplicitamente invece di ignorarla:

> _Contraddice la ADR-0007 (titolo), ma vale la pena riaprirla perché…_
