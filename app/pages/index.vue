<script setup>
const { data: articles } = await useAsyncData('home-articles', () =>
  queryCollection('news')
    .order('date', 'DESC')
    .limit(ARTICOLI_IN_HOME)
    .all()
)

const home = computed(() => componiHome(articles.value ?? []))
const lead = computed(() => home.value.lead)
const sidebar = computed(() => home.value.sidebar)
const grid = computed(() => home.value.grid)

function slug(art) {
  return art.stem?.split('/').pop() ?? ''
}

const site = useSiteConfig()

usePageSeo({
  title: site.siteName,
  description: site.description,
  url: site.siteUrl,
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">

    <!-- LEAD: articolo principale + sidebar -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8
                border-b border-rule pb-6 md:pb-8 mb-6 md:mb-8">

      <!-- Articolo di apertura -->
      <div class="md:col-span-2 md:border-r md:border-rule md:pr-8">
        <template v-if="lead">
          <span class="text-[10px] uppercase tracking-widest font-sans font-medium"
            :class="sezioneTextClass(lead.sezione)">
            {{ sezioneLabel(lead.sezione) }}
          </span>
          <NuxtLink :to="`/news/${slug(lead)}`">
            <h2 class="font-serif text-2xl md:text-4xl font-black leading-tight
                       text-ink mt-1 mb-2 hover:text-newsred transition-colors">
              {{ lead.title }}
            </h2>
          </NuxtLink>
          <div class="flex items-center gap-2 text-xs font-sans text-muted mb-3">
            <span v-if="lead.firma">{{ lead.firma }}</span>
            <span class="w-1 h-1 bg-newsred rounded-full inline-block" />
            <span>{{ formatDate(lead.date) }}</span>
          </div>
          <div v-if="lead.image" class="aspect-[16/9] overflow-hidden bg-rule mb-4">
            <NuxtImg :src="lead.image" :alt="lead.title" sizes="sm:100vw md:60vw lg:607px"
              class="w-full h-full object-cover" />
          </div>
          <p class="font-body italic text-base md:text-lg text-ink leading-relaxed mb-3">
            {{ lead.description }}
          </p>
          <NuxtLink :to="`/news/${slug(lead)}`" class="font-sans text-xs uppercase tracking-widest text-newsred
                           border-b border-newsred pb-0.5 hover:opacity-70 transition-opacity">
            Leggi l'articolo →
          </NuxtLink>
        </template>
      </div>

      <!-- Sidebar — scorre sotto su mobile, a destra su desktop -->
      <aside class="flex flex-col gap-4 md:gap-6
                    border-t border-rule pt-4 md:border-t-0 md:pt-0">
        <article v-for="art in sidebar" :key="art.id" class="border-b border-rule pb-4 last:border-0 last:pb-0">
          <span class="text-[10px] uppercase tracking-widest font-sans font-medium"
            :class="sezioneTextClass(art.sezione)">
            {{ sezioneLabel(art.sezione) }}
          </span>
          <NuxtLink :to="`/news/${slug(art)}`">
            <h3 class="font-serif text-sm md:text-base font-bold leading-snug
                       text-ink mt-1 hover:text-newsred transition-colors">
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

    <!-- GRIGLIA 3 COLONNE → 1 su mobile, 2 su tablet, 3 su desktop -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8
                border-b border-rule pb-6 md:pb-8 mb-6 md:mb-8">
      <BlogCard v-for="art in grid" :key="art.id" :article="art" />
    </div>

    <!-- Link archivio -->
    <div class="text-center py-4">
      <NuxtLink to="/news" class="font-sans text-xs uppercase tracking-widest text-ink
                       border-b border-ink pb-0.5 hover:text-newsred
                       hover:border-newsred transition-colors">
        Tutti gli articoli →
      </NuxtLink>
    </div>

  </div>
</template>
