// composables/usePageData.ts
export async function usePageData(stem: string) {
  const { data } = await useAsyncData(`page-${stem}`, () =>
    queryCollection('pages').where('stem', '=', stem).first()
  )
  return computed(() => data.value?.meta ?? null)
}
