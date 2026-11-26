<template>
  <div v-if="page" class="max-w-5xl mx-auto px-6 py-10">

    <!-- Testata -->
    <div class="border-b-[3px] border-ink pb-4 mb-10 text-center">
      <h2 class="font-serif text-5xl font-black text-ink">{{ page.hero?.heading }}</h2>
    </div>

    <!-- Hero immagine + bio -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10
            border-b border-rule pb-8 md:pb-10 mb-8 md:mb-10">
      <div v-if="page.hero?.image" class="md:col-span-1 aspect-[3/4] overflow-hidden bg-rule">
        <img :src="page.hero.image" :alt="page.hero.heading" class="w-full h-full object-cover" />
      </div>
      <div class="md:col-span-2 flex flex-col justify-center gap-4">
        <p v-for="(para, i) in page.bio?.paragraphs" :key="i" class="font-body text-lg leading-relaxed text-ink"
          :class="{ 'italic text-muted': i === 0 }">
          {{ para }}
        </p>
      </div>
    </div>

    <!-- Team -->
    <div v-if="page.team" class="border-b border-rule pb-10 mb-10">
      <h3 class="font-serif text-2xl font-bold text-ink mb-6">
        {{ page.team.heading }}
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="member in page.team.items" :key="member.name" class="border-l-2 border-newsred pl-4">
          <p class="font-serif font-bold text-ink text-lg leading-tight">
            {{ member.name }}
          </p>
          <p class="font-sans text-xs uppercase tracking-widest text-newsred mt-1 mb-2">
            {{ member.role }}
          </p>
          <p class="font-body italic text-sm text-muted leading-relaxed">
            {{ member.note }}
          </p>
        </div>
      </div>
    </div>

    <!-- Missione -->
    <div v-if="page.mission" class="text-center max-w-2xl mx-auto">
      <h3 class="font-serif text-2xl font-bold text-ink mb-4">
        {{ page.mission.heading }}
      </h3>
      <p class="font-body italic text-xl text-muted leading-relaxed">
        {{ page.mission.text }}
      </p>
    </div>

  </div>
</template>

<script setup>
const page = await usePageData('pages/about')

const site = useSiteConfig()

usePageSeo({
  title: page.value?.title ?? 'Chi siamo',
  description: page.value?.bio?.paragraphs?.[0],
  image: page.value?.hero?.image,
  url: `${site.siteUrl}/about`,
})
</script>
