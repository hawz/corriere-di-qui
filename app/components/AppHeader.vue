<template>
  <header>
    <!-- Ticker -->
    <div class="bg-newsred text-white text-xs font-sans font-medium tracking-widest overflow-hidden">
      <div class="ticker-wrap py-1">
        <div class="ticker-content flex gap-8 whitespace-nowrap">
          <span v-for="(item, i) in page?.ticker" :key="i" class="flex items-center gap-3">
            <span class="opacity-60">■</span>
            {{ item }}
          </span>
          <!-- duplicato per loop continuo -->
          <span v-for="(item, i) in page?.ticker" :key="'b' + i" class="flex items-center gap-3">
            <span class="opacity-60">■</span>
            {{ item }}
          </span>
        </div>
      </div>
    </div>

    <!-- Masthead -->
    <div class="border-b-[3px] border-ink px-6 py-3 text-center">
      <NuxtLink to="/">
        <h1 class="font-serif text-5xl font-black tracking-tight leading-none text-ink">
          {{ page?.masthead ?? 'Il Corriere di Qui' }}
        </h1>
      </NuxtLink>
      <p class="font-body italic text-sm text-newsred mt-1">
        {{ page?.tagline }}
      </p>

      <!-- Meta row -->
      <div class="flex justify-between items-center text-xs text-muted border-t border-rule mt-2 pt-2 font-sans">
        <span>{{ today }}</span>
        <!-- Sezioni -->
        <nav class="flex gap-5">
          <NuxtLink to="/" class="uppercase tracking-widest hover:text-newsred transition-colors"
            :class="{ 'text-newsred border-b border-newsred': route.path === '/' }">
            Prima Pagina
          </NuxtLink>
          <NuxtLink v-for="section in page?.sections" :key="section.slug" :to="`/news?categoria=${section.slug}`"
            class="uppercase tracking-widest hover:text-newsred transition-colors">
            {{ section.label }}
          </NuxtLink>
          <NuxtLink to="/about" class="uppercase tracking-widest hover:text-newsred transition-colors"
            :class="{ 'text-newsred border-b border-newsred': route.path === '/about' }">
            Chi siamo
          </NuxtLink>
        </nav>
        <span>{{ page?.subtagline }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
const route = useRoute()

const page = await usePageData('pages/home')

const today = computed(() => {
  return new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<style scoped>
.ticker-wrap {
  width: 100%;
  overflow: hidden;
}

.ticker-content {
  display: inline-flex;
  animation: ticker 35s linear infinite;
}

@keyframes ticker {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}
</style>
