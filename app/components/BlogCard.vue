<script setup>
defineProps({
  article: { type: Object, required: true },
  large: { type: Boolean, default: false },
})
</script>

<template>
  <article class="flex flex-col gap-2">
    <!-- Immagine -->
    <NuxtLink :to="`/news/${article.stem?.split('/').pop()}`">
      <div class="overflow-hidden bg-gray-100 aspect-[16/9] rounded-sm">
        <NuxtImg v-if="article.image" :src="article.image" :alt="article.title" sizes="sm:100vw md:304px"
          class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        <div v-else class="w-full h-full flex items-center justify-content-center bg-rule" />
      </div>
    </NuxtLink>

    <!-- Sezione -->
    <span v-if="article.sezione" class="text-[10px] uppercase tracking-widest font-sans font-medium"
      :class="sezioneTextClass(article.sezione)">
      {{ sezioneLabel(article.sezione) }}
    </span>

    <!-- Titolo -->
    <NuxtLink :to="`/news/${article.stem?.split('/').pop()}`">
      <h3 class="font-serif font-bold leading-tight text-ink hover:text-newsred transition-colors"
        :class="large ? 'text-2xl' : 'text-base'">
        {{ article.title }}
      </h3>
    </NuxtLink>

    <!-- Descrizione -->
    <p v-if="article.description" class="font-body text-sm text-muted leading-relaxed line-clamp-3">
      {{ article.description }}
    </p>

    <!-- Byline -->
    <div class="flex items-center gap-2 text-xs font-sans text-muted">
      <span v-if="article.firma">{{ article.firma }}</span>
      <span v-if="article.firma" class="w-1 h-1 bg-newsred rounded-full inline-block" />
      <span>{{ formatDate(article.date) }}</span>
    </div>
  </article>
</template>
