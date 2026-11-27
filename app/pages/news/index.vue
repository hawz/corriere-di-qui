<script setup>
const route = useRoute()
const router = useRouter()

const page = await usePageData('pages/news')

const { data: articles } = await useAsyncData('news-articles', () =>
  queryCollection('news').order('date', 'DESC').all()
)

const sezioni = computed(() => sezioniConArticoli(articles.value ?? []))

// Legge sempre dalla URL, non da un ref locale
const activeSezione = computed(() => route.query.sezione ?? null)

// Aggiorna la URL quando si cambia Sezione
function setSezione(slug) {
  router.push({
    query: slug ? { sezione: slug } : {},
  })
}

const filtered = computed(() => {
  if (!activeSezione.value) return articles.value ?? []
  return (articles.value ?? []).filter(a => a.sezione === activeSezione.value)
})

const featured = computed(() => filtered.value[0] ?? null)
const rest = computed(() => filtered.value.slice(1))

function slug(art) {
  return art.stem?.split('/').pop() ?? ''
}

const site = useSiteConfig()

usePageSeo({
  title: 'News',
  description: page.value?.hero?.subheading,
  url: `${site.siteUrl}/news`,
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-8">

    <!-- Testata sezione -->
    <div class="border-b-[3px] border-ink pb-4 mb-8">
      <h2 class="font-serif text-4xl font-black text-ink">{{ page?.title }}</h2>
      <p class="font-body italic text-muted text-sm mt-1">
        {{ page?.hero?.subheading }}
      </p>
    </div>

    <!-- Filtri per Sezione -->
    <div class="flex gap-4 mb-8 flex-wrap">
      <button class="text-xs uppercase tracking-widest font-sans pb-0.5 transition-colors" :class="activeSezione === null
        ? 'text-ink border-b-2 border-ink'
        : 'text-muted hover:text-ink'" @click="setSezione(null)">
        Tutti
      </button>
      <button v-for="sezione in sezioni" :key="sezione.slug"
        class="text-xs uppercase tracking-widest font-sans pb-0.5 transition-colors" :class="activeSezione === sezione.slug
          ? `${sezione.textClass} border-b-2 ${sezione.borderClass}`
          : 'text-muted hover:text-ink'" @click="setSezione(sezione.slug)">
        {{ sezione.label }}
      </button>
    </div>

    <!-- Articolo in evidenza -->
    <div v-if="featured" class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8
            border-b border-rule pb-6 md:pb-8 mb-6 md:mb-8">
      <div v-if="featured.image" class="aspect-[4/3] overflow-hidden bg-rule">
        <!-- Il riquadro 4:3 taglia ai lati un'immagine orizzontale: `sizes` segue l'immagine, circa 1,4 volte il riquadro. -->
        <NuxtImg :src="featured.image" :alt="featured.title" sizes="sm:140vw md:63vw lg:649px"
          class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
      </div>
      <div class="flex flex-col justify-center">
        <span class="text-[10px] uppercase tracking-widest font-sans font-medium mb-2"
          :class="sezioneTextClass(featured.sezione)">
          {{ sezioneLabel(featured.sezione) }}
        </span>
        <NuxtLink :to="`/news/${slug(featured)}`">
          <h3 class="font-serif text-2xl md:text-3xl font-black leading-tight
                 text-ink hover:text-newsred transition-colors mb-3">
            {{ featured.title }}
          </h3>
        </NuxtLink>
        <p class="font-body italic text-muted leading-relaxed text-sm mb-4">
          {{ featured.description }}
        </p>
        <div class="flex items-center gap-2 text-xs font-sans text-muted">
          <span v-if="featured.firma">{{ featured.firma }}</span>
          <span class="w-1 h-1 bg-newsred rounded-full inline-block" />
          <span>{{ formatDate(featured.date) }}</span>
        </div>
      </div>
    </div>

    <!-- Griglia articoli -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
      <BlogCard v-for="art in rest" :key="art.id" :article="art" />
    </div>

    <!-- Nessun risultato -->
    <div v-if="filtered.length === 0" class="text-center py-20 text-muted font-body italic">
      Nessun articolo trovato in questa sezione.
    </div>

  </div>
</template>
