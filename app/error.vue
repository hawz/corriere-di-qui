<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const title = computed(() => props.error.statusCode === 404 ? 'Pagina non trovata' : 'Qualcosa è andato storto')

const { siteName } = useSiteConfig()

useSeoMeta({
  title: () => `${title.value} — ${siteName}`,
  robots: 'noindex',
})
</script>

<template>
  <NuxtLayout>
    <div class="text-center py-24">
      <p class="font-serif text-2xl text-ink">{{ title }}.</p>
      <NuxtLink to="/news" class="font-sans text-sm text-newsred mt-4 inline-block">
        ← Torna alle News
      </NuxtLink>
    </div>
  </NuxtLayout>
</template>
