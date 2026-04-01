<template>
  <footer class="border-t-[3px] border-ink mt-12">
    <div class="max-w-5xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start gap-6">

      <!-- Brand -->
      <div>
        <p class="font-serif text-2xl font-black text-ink">Il Corriere di Qui</p>
        <p class="font-body italic text-sm text-newsred mt-1">
          {{ page?.tagline }}
        </p>
      </div>

      <!-- Sezioni -->
      <nav class="flex flex-col gap-1 text-sm font-sans text-muted">
        <NuxtLink to="/" class="hover:text-newsred transition-colors">Prima Pagina</NuxtLink>
        <NuxtLink v-for="section in page?.sections" :key="section.slug" :to="`/news?categoria=${section.slug}`"
          class="hover:text-newsred transition-colors">
          {{ section.label }}
        </NuxtLink>
        <NuxtLink to="/about" class="hover:text-newsred transition-colors">Chi siamo</NuxtLink>
      </nav>

      <!-- Info -->
      <div class="text-xs font-sans text-muted space-y-1">
        <p>{{ page?.subtagline }}</p>
        <p>Reg. Trib. n. 001/2024</p>
        <p>© {{ year }} Il Corriere di Qui</p>
      </div>

    </div>
  </footer>
</template>

<script setup>
const page = await usePageData('pages/home')

const year = new Date().getFullYear()
</script>
