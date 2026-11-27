<!-- Le immagini nel testo di un Articolo. Sostituisce il ProseImg di MDC, che usa NuxtImg ma senza `sizes`. -->
<template>
  <NuxtImg :src="src" :alt="alt" :width="width" :height="height" sizes="sm:100vw md:720px" />
</template>

<script setup>
defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined },
})
</script>
