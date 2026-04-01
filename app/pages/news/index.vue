<template>
  <div class="max-w-5xl mx-auto px-6 py-8">

    <!-- Testata sezione -->
    <div class="border-b-[3px] border-ink pb-4 mb-8">
      <h2 class="font-serif text-4xl font-black text-ink">{{ page?.title }}</h2>
      <p class="font-body italic text-muted text-sm mt-1">
        {{ page?.hero?.subheading }}
      </p>
    </div>

    <!-- Filtri categoria -->
    <div class="flex gap-4 mb-8 flex-wrap">
      <button class="text-xs uppercase tracking-widest font-sans pb-0.5 transition-colors" :class="activeCategory === null
        ? 'text-ink border-b-2 border-ink'
        : 'text-muted hover:text-ink'" @click="activeCategory = null">
        Tutti
      </button>
      <button v-for="cat in categories" :key="cat.slug"
        class="text-xs uppercase tracking-widest font-sans pb-0.5 transition-colors" :class="activeCategory === cat.slug
          ? `${cat.activeClass} border-b-2 ${cat.borderClass}`
          : 'text-muted hover:text-ink'" @click="activeCategory = cat.slug">
        {{ cat.label }}
      </button>
    </div>

    <!-- Articolo in evidenza (primo della lista filtrata) -->
    <div v-if="featured" class="grid grid-cols-2 gap-8 border-b border-rule pb-8 mb-8">
      <div v-if="featured.image" class="aspect-[4/3] overflow-hidden bg-rule">
        <img :src="featured.image" :alt="featured.title"
          class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
      </div>
      <div class="flex flex-col justify-center">
        <span class="text-[10px] uppercase tracking-widest font-sans font-medium mb-2"
          :class="categoryColor(featured.categoria)">
          {{ featured.categoria }}
        </span>
        <NuxtLink :to="`/news/${slug(featured)}`">
          <h3 class="font-serif text-3xl font-black leading-tight text-ink
                     hover:text-newsred transition-colors mb-3">
            {{ featured.title }}
          </h3>
        </NuxtLink>
        <p class="font-body italic text-muted leading-relaxed text-sm mb-4">
          {{ featured.description }}
        </p>
        <div class="flex items-center gap-2 text-xs font-sans text-muted">
          <span v-if="featured.autore">{{ featured.autore }}</span>
          <span class="w-1 h-1 bg-newsred rounded-full inline-block" />
          <span>{{ formatDate(featured.date) }}</span>
        </div>
      </div>
    </div>

    <!-- Griglia articoli restanti -->
    <div class="grid grid-cols-3 gap-8">
      <BlogCard v-for="art in rest" :key="art.id" :article="art" />
    </div>

    <!-- Nessun risultato -->
    <div v-if="filtered.length === 0" class="text-center py-20 text-muted font-body italic">
      Nessun articolo trovato in questa categoria.
    </div>

  </div>
</template>

<script setup>
const route = useRoute()

const page = await usePageData('pages/news')

const { data: articles } = await useAsyncData('news-articles', () =>
  queryCollection('news').order('date', 'DESC').all()
)

const categories = [
  { slug: 'attualita', label: 'Attualità', activeClass: 'text-newsred', borderClass: 'border-newsred' },
  { slug: 'tech', label: 'Tech', activeClass: 'text-newsblue', borderClass: 'border-newsblue' },
  { slug: 'satira', label: 'Satira', activeClass: 'text-newsamber', borderClass: 'border-newsamber' },
  { slug: 'opinioni', label: 'Opinioni', activeClass: 'text-newsgreen', borderClass: 'border-newsgreen' },
]

const activeCategory = ref(route.query.categoria ?? null)

console.log('active category:', activeCategory.value)

const filtered = computed(() => {
  if (!activeCategory.value) return articles.value ?? []
  return (articles.value ?? []).filter(a => a.categoria === activeCategory.value)
})

const featured = computed(() => filtered.value[0] ?? null)
const rest = computed(() => filtered.value.slice(1))

function slug(art) {
  return art.stem?.split('/').pop() ?? ''
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function categoryColor(cat) {
  const map = {
    tech: 'text-newsblue',
    satira: 'text-newsamber',
    attualita: 'text-newsred',
    opinioni: 'text-newsgreen',
  }
  return map[cat] ?? 'text-muted'
}

const site = useSiteConfig()

usePageSeo({
  title: 'News',
  description: page.value?.hero?.subheading,
  url: `${site.siteUrl}/news`,
})
</script>
