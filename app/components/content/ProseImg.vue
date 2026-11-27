<!-- Le immagini nel testo di un Articolo. Sostituisce il ProseImg di MDC, che usa NuxtImg ma senza `sizes`. -->
<script setup lang="ts">
const { src = '', alt = '', width = undefined, height = undefined } = defineProps<{
  src?: string
  alt?: string
  width?: string | number
  height?: string | number
}>()
</script>

<template>
  <NuxtImg :src="src" :alt="alt" :width="width" :height="height" sizes="sm:100vw md:720px" />
</template>
