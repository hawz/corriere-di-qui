<script setup>
const route = useRoute()
const menuOpen = ref(false)

// Chiude il menu al cambio di rotta
watch(() => route.path, () => { menuOpen.value = false })

const page = await usePageData('pages/home')
const sezioni = await useSezioniConArticoli()

const today = computed(() => formatDate(new Date(), { weekday: 'long' }))
</script>

<template>
  <header>
    <!-- Ticker -->
    <div class="bg-newsred text-white text-xs font-sans font-medium tracking-widest overflow-hidden">
      <div class="ticker-wrap py-1">
        <div class="ticker-content flex gap-8 whitespace-nowrap">
          <span v-for="(item, i) in page?.ticker" :key="i" class="flex items-center gap-3">
            <span class="opacity-60">■</span>{{ item }}
          </span>
          <span v-for="(item, i) in page?.ticker" :key="'b' + i" class="flex items-center gap-3">
            <span class="opacity-60">■</span>{{ item }}
          </span>
        </div>
      </div>
    </div>

    <!-- Masthead -->
    <div class="border-b-[3px] border-ink px-4 md:px-6 py-3 text-center">
      <NuxtLink to="/">
        <h1 class="font-serif text-3xl md:text-5xl font-black tracking-tight leading-none text-ink">
          {{ page?.masthead ?? 'Il Corriere di Qui' }}
        </h1>
      </NuxtLink>
      <p class="font-body italic text-xs md:text-sm text-newsred mt-1">
        {{ page?.tagline }}
      </p>

      <!-- Meta row desktop -->
      <div class="hidden md:flex justify-between items-center text-xs text-muted
                  border-t border-rule mt-2 pt-2 font-sans">
        <span>{{ today }}</span>
        <nav class="flex gap-5">
          <NuxtLink to="/" class="uppercase tracking-widest hover:text-newsred transition-colors"
            :class="{ 'text-newsred border-b border-newsred': route.path === '/' }">
            Prima Pagina
          </NuxtLink>
          <NuxtLink v-for="sezione in sezioni" :key="sezione.slug" :to="`/news?sezione=${sezione.slug}`"
            class="uppercase tracking-widest hover:text-newsred transition-colors"
            :class="{ 'text-newsred border-b border-newsred': route.query.sezione === sezione.slug }">
            {{ sezione.label }}
          </NuxtLink>
          <NuxtLink to="/about" class="uppercase tracking-widest hover:text-newsred transition-colors"
            :class="{ 'text-newsred border-b border-newsred': route.path === '/about' }">
            Chi siamo
          </NuxtLink>
        </nav>
        <span>{{ page?.subtagline }}</span>
      </div>

      <!-- Meta row mobile: data + hamburger -->
      <div class="flex md:hidden justify-between items-center border-t border-rule mt-2 pt-2">
        <span class="text-xs text-muted font-sans">{{ today }}</span>
        <button class="text-ink p-1" :aria-expanded="menuOpen" aria-label="Apri menu" @click="menuOpen = !menuOpen">
          <!-- Hamburger icon -->
          <svg v-if="!menuOpen" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <!-- Close icon -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Menu mobile dropdown -->
    <nav v-if="menuOpen" class="md:hidden border-b border-rule bg-white">
      <NuxtLink to="/" class="block px-4 py-3 text-xs uppercase tracking-widest font-sans
               border-b border-rule text-ink hover:text-newsred hover:bg-gray-50 transition-colors"
        :class="{ 'text-newsred': route.path === '/' }" @click="menuOpen = false">
        Prima Pagina
      </NuxtLink>
      <NuxtLink v-for="sezione in sezioni" :key="sezione.slug" :to="`/news?sezione=${sezione.slug}`" class="block px-4 py-3 text-xs uppercase tracking-widest font-sans
               border-b border-rule text-ink hover:text-newsred hover:bg-gray-50 transition-colors"
        :class="{ 'text-newsred': route.query.sezione === sezione.slug }" @click="menuOpen = false">
        {{ sezione.label }}
      </NuxtLink>
      <NuxtLink to="/about" class="block px-4 py-3 text-xs uppercase tracking-widest font-sans
               text-ink hover:text-newsred hover:bg-gray-50 transition-colors"
        :class="{ 'text-newsred': route.path === '/about' }" @click="menuOpen = false">
        Chi siamo
      </NuxtLink>
    </nav>
  </header>
</template>

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
