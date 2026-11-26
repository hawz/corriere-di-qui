# Sito statico, pubblicazione con il merge

Il sito è generato staticamente con `nuxt generate` e servito da Netlify senza server: niente rendering a ogni visita. Gli **Articoli** si pubblicano unendo una PR su `main` e non esistono pubblicazioni programmate, quindi il contenuto cambia solo con una build e un server non aggiungerebbe nulla. In cambio il sito è più veloce e più semplice, e un Articolo inesistente risponde con un vero 404.

## Consequences

- La `date` di un Articolo è il giorno del merge: una data futura non lo nasconde.
- Sitemap, pagina 404 e ogni altra route del server vanno prerenderizzate durante la build.
- Una funzione che richieda un server (pubblicazione programmata, commenti, ricerca lato server) obbliga a rivedere questa decisione.
