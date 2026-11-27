<script setup>
const route = useRoute()

const { data: article } = await useAsyncData(`article-${route.params.slug}`, () =>
  queryCollection('news').where('stem', '=', `news/${route.params.slug}`).first()
)

// Un Articolo inesistente è un vero 404: la pagina la mostra app/error.vue.
if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato', fatal: true })
}

const { data: allArticles } = await useAsyncData('all-articles-nav', () =>
  queryCollection('news').order('date', 'DESC').all()
)

const currentIndex = computed(() =>
  (allArticles.value ?? []).findIndex(a => slug(a) === route.params.slug)
)
const prev = computed(() => allArticles.value?.[currentIndex.value + 1] ?? null)
const next = computed(() => allArticles.value?.[currentIndex.value - 1] ?? null)

function slug(art) {
  return art.stem?.split('/').pop() ?? ''
}

const site = useSiteConfig()

usePageSeo({
  title: article.value.title,
  description: article.value.description,
  image: article.value.image,
  url: `${site.siteUrl}/news/${route.params.slug}`,
  type: 'article',
  publishedAt: article.value.date,
  firma: article.value.firma,
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10">

    <!-- Sezione + data -->
    <div class="flex items-center gap-3 mb-4">
      <span class="text-[10px] uppercase tracking-widest font-sans font-medium"
        :class="sezioneTextClass(article.sezione)">
        {{ sezioneLabel(article.sezione) }}
      </span>
      <span class="w-1 h-1 bg-rule rounded-full inline-block" />
      <span class="text-xs font-sans text-muted">{{ formatDate(article.date) }}</span>
    </div>

    <!-- Titolo -->
    <h1 class="font-serif text-3xl md:text-5xl font-black leading-tight text-ink mb-4">
      {{ article.title }}
    </h1>

    <!-- Sottotitolo / descrizione -->
    <p class="font-body italic text-lg md:text-xl text-muted leading-relaxed mb-6">
      {{ article.description }}
    </p>

    <!-- Byline -->
    <div class="flex items-center gap-2 text-sm font-sans text-muted border-t border-b border-rule py-3 mb-8">
      <span v-if="article.firma" class="font-medium text-ink">{{ article.firma }}</span>
      <span v-if="article.firma" class="w-1 h-1 bg-newsred rounded-full inline-block" />
      <span>{{ formatDate(article.date) }}</span>
      <span v-if="article.tags?.length" class="ml-auto flex gap-2">
        <span v-for="tag in article.tags" :key="tag"
          class="text-[10px] uppercase tracking-wider bg-rule px-2 py-0.5 rounded-sm">
          {{ tag }}
        </span>
      </span>
    </div>

    <!-- Immagine hero -->
    <div v-if="article.image" class="aspect-[16/9] overflow-hidden bg-rule mb-8">
      <NuxtImg :src="article.image" :alt="article.title" sizes="sm:100vw md:720px"
        class="w-full h-full object-cover" />
    </div>

    <!-- Corpo articolo -->
    <div class="prose-article">
      <ContentRenderer :value="article" />
    </div>

    <!-- Navigazione articoli -->
    <div class="grid grid-cols-2 gap-6 border-t border-rule mt-12 pt-8">
      <NuxtLink v-if="prev" :to="`/news/${slug(prev)}`" class="group flex flex-col gap-1">
        <span class="text-xs font-sans uppercase tracking-widest text-muted">← Precedente</span>
        <span class="font-serif font-bold text-ink group-hover:text-newsred transition-colors leading-snug">
          {{ prev.title }}
        </span>
      </NuxtLink>
      <NuxtLink v-if="next" :to="`/news/${slug(next)}`" class="group flex flex-col gap-1 text-right ml-auto">
        <span class="text-xs font-sans uppercase tracking-widest text-muted">Successivo →</span>
        <span class="font-serif font-bold text-ink group-hover:text-newsred transition-colors leading-snug">
          {{ next.title }}
        </span>
      </NuxtLink>
    </div>

  </div>
</template>

<style>
.prose-article {
  font-family: 'Source Serif 4', Georgia, serif;
  font-size: 1.05rem;
  line-height: 1.85;
  color: #222;
}

.prose-article h2 {
  font-family: 'Playfair Display', serif;
  font-size: 1.6rem;
  font-weight: 700;
  margin: 2.5rem 0 1rem;
  color: #111;
}

.prose-article h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 2rem 0 0.75rem;
  color: #111;
}

.prose-article p {
  margin-bottom: 1.5rem;
}

.prose-article strong {
  font-weight: 600;
  color: #111;
}

.prose-article em {
  font-style: italic;
  color: #444;
}

.prose-article blockquote {
  border-left: 3px solid #C0392B;
  padding-left: 1.25rem;
  margin: 2rem 0;
  font-style: italic;
  color: #555;
}

.prose-article a {
  color: #C0392B;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.prose-article ul,
.prose-article ol {
  padding-left: 1.5rem;
  margin-bottom: 1.5rem;
}

.prose-article li {
  margin-bottom: 0.4rem;
}

.prose-article img {
  width: 100%;
  margin: 2rem 0;
}

.prose-article code {
  font-family: 'Fira Code', monospace;
  font-size: 0.85em;
  background: #f4f4f4;
  padding: 0.15em 0.4em;
  border-radius: 3px;
}

.prose-article pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1.25rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 2rem 0;
  font-size: 0.875rem;
}
</style>
