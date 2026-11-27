<script setup lang="ts">
const page = await usePageData('pages/home')
const sezioni = await useSezioniConArticoli()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t-[3px] border-ink mt-12">
    <div class="max-w-5xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 md:flex-row md:justify-between md:items-start">

      <!-- Brand -->
      <div>
        <p class="font-serif text-2xl font-black text-ink">Il Corriere di Qui</p>
        <p class="font-body italic text-sm text-newsred mt-1">
          {{ page?.tagline }}
        </p>
      </div>

      <!-- Sezioni -->
      <nav class="flex flex-col gap-1 text-sm font-sans text-muted md:shrink-0">
        <NuxtLink to="/" class="hover:text-newsred transition-colors">Prima Pagina</NuxtLink>
        <NuxtLink v-for="sezione in sezioni" :key="sezione.slug" :to="`/news?sezione=${sezione.slug}`"
          class="hover:text-newsred transition-colors">
          {{ sezione.label }}
        </NuxtLink>
        <NuxtLink to="/about" class="hover:text-newsred transition-colors">Chi siamo</NuxtLink>
      </nav>

      <!-- Info -->
      <div class="text-xs font-sans text-muted space-y-1">
        <p>{{ page?.subtagline }}</p>
        <p>Giornale satirico: fatti, nomi e firme sono inventati</p>
        <p>© {{ year }} Il Corriere di Qui</p>
      </div>

    </div>
  </footer>
</template>
