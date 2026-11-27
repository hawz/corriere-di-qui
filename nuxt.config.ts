// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxtjs/tailwindcss',
  ],

  // `@nuxt/image` resta alla 2.1: il vincolo è nato perché la 2.2 importa `nuxt/server`, che Nuxt 4.4 non esportava.
  // Nuxt 4.7 lo esporta, ma il passaggio alla 2.2 non è ancora stato provato.
  // Gli indirizzi delle immagini esistono solo su Netlify: una build servita in locale senza `netlify dev` non le mostra.
  image: {
    // Fisso: senza, fuori da Netlify (CI e build in locale) il modulo userebbe ipx e scriverebbe altri indirizzi.
    provider: 'netlifyImageCdn',
    // L'unico punto in cui è scritto il WebP; un altro formato lo chiede solo l'immagine per i social, in usePageSeo.
    // Senza, la CDN darebbe il PNG originale a chi chiede `Accept: */*`.
    // I tipi del modulo non prevedono `modifiers`, che però funziona: lo controllano i test sul sito generato.
    // @ts-expect-error Se i tipi si aggiornano, il controllo segnala che questa riga va tolta.
    netlifyImageCdn: { modifiers: { format: 'webp' } },
  },

  // `npm run dev` non ha la CDN di Netlify: ipx ridimensiona le immagini in locale, senza cambiarne il formato.
  $development: {
    image: { provider: 'ipx' },
  },

  runtimeConfig: {
    public: {
      // L'unico punto in cui è scritto l'indirizzo del sito. NUXT_PUBLIC_SITE_URL lo sostituisce.
      siteUrl: 'https://corriere-di-qui.netlify.app',
    },
  },

  nitro: {
    prerender: {
      // Nessuna pagina li collega, quindi il crawler della build non li troverebbe.
      routes: ['/sitemap.xml', '/robots.txt'],
    },
  },

  content: {
    renderer: {
      // I titoli restano con il loro id, ma il testo non diventa un link che prende lo stile dei link dell'Articolo.
      anchorLinks: false,
    },
    build: {
      markdown: {
        highlight: {
          theme: 'github-light',
        },
      },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'it' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@300;400;500&display=swap',
        },
      ],
    },
  },
})
