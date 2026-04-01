<template>
  <div class="max-w-5xl mx-auto px-6 py-8">

    <!-- LEAD: articolo principale + sidebar -->
    <div class="grid grid-cols-3 gap-8 border-b border-rule pb-8 mb-8">

      <!-- Articolo di apertura -->
      <div class="col-span-2 border-r border-rule pr-8">
        <template v-if="lead">
          <span class="text-[10px] uppercase tracking-widest font-sans font-medium"
            :class="categoryColor(lead.categoria)">
            {{ lead.categoria }}
          </span>
          <NuxtLink :to="`/news/${slug(lead)}`">
            <h2 class="font-serif text-4xl font-black leading-tight text-ink mt-1 mb-2
                       hover:text-newsred transition-colors">
              {{ lead.title }}
            </h2>
          </NuxtLink>
          <div class="flex items-center gap-2 text-xs font-sans text-muted mb-3">
            <span v-if="lead.autore">{{ lead.autore }}</span>
            <span class="w-1 h-1 bg-newsred rounded-full inline-block" />
            <span>{{ formatDate(lead.date) }}</span>
          </div>
          <div v-if="lead.image" class="aspect-[16/9] overflow-hidden bg-rule mb-4">
            <img :src="lead.image" :alt="lead.title" class="w-full h-full object-cover" />
          </div>
          <p class="font-body italic text-lg text-ink leading-relaxed mb-3">
            {{ lead.description }}
          </p>
          <NuxtLink :to="`/news/${slug(lead)}`" class="font-sans text-xs uppercase tracking-widest text-newsred
                           border-b border-newsred pb-0.5 hover:opacity-70 transition-opacity">
            Leggi l'articolo →
          </NuxtLink>
        </template>
      </div>

      <!-- Sidebar articoli secondari -->
      <aside class="flex flex-col gap-6">
        <article v-for="art in sidebar" :key="art.id" class="border-b border-rule pb-6 last:border-0 last:pb-0">
          <span class="text-[10px] uppercase tracking-widest font-sans font-medium"
            :class="categoryColor(art.categoria)">
            {{ art.categoria }}
          </span>
          <NuxtLink :to="`/news/${slug(art)}`">
            <h3 class="font-serif text-base font-bold leading-snug text-ink mt-1
                       hover:text-newsred transition-colors">
              {{ art.title }}
            </h3>
          </NuxtLink>
          <p class="font-body text-xs text-muted leading-relaxed mt-1 line-clamp-2">
            {{ art.description }}
          </p>
          <p class="text-xs font-sans text-muted mt-1">{{ formatDate(art.date) }}</p>
        </article>
      </aside>
    </div>

    <!-- BOX SATIRA -->
    <div v-if="satira" class="bg-parchment border border-newsamber rounded-sm px-6 py-4 mb-8">
      <p class="text-[10px] uppercase tracking-widest font-sans font-medium text-newsamber mb-1">
        ⚑ Satira
      </p>
      <NuxtLink :to="`/news/${slug(satira)}`">
        <h3 class="font-serif text-2xl font-bold italic text-ink hover:text-newsred transition-colors">
          {{ satira.title }}
        </h3>
      </NuxtLink>
      <p class="font-body text-sm text-muted mt-1">{{ satira.description }}</p>
    </div>

    <!-- GRIGLIA 3 COLONNE -->
    <div class="grid grid-cols-3 gap-8 border-b border-rule pb-8 mb-8">
      <BlogCard v-for="art in grid" :key="art.id" :article="art" />
    </div>

    <!-- LINK ALLA SEZIONE NEWS COMPLETA -->
    <div class="text-center py-4">
      <NuxtLink to="/news" class="font-sans text-xs uppercase tracking-widest text-ink
                       border-b border-ink pb-0.5 hover:text-newsred hover:border-newsred transition-colors">
        Tutti gli articoli →
      </NuxtLink>
    </div>

  </div>
</template>

<script setup>
const { data: articles } = await useAsyncData('home-articles', () =>
  queryCollection('news')
    .order('date', 'DESC')
    .limit(10)
    .all()
)

const lead = computed(() => articles.value?.[0] ?? null)
const sidebar = computed(() => articles.value?.slice(1, 4) ?? [])
const satira = computed(() => articles.value?.find(a => a.categoria === 'satira') ?? null)
const grid = computed(() => {
  const exclude = new Set([lead.value?.id, satira.value?.id])
  return (articles.value ?? []).filter(a => !exclude.has(a.id)).slice(0, 3)
})

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
  title: site.siteName,
  description: site.description,
  url: site.siteUrl,
})
</script>
