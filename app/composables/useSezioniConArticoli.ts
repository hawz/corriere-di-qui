// composables/useSezioniConArticoli.ts
export async function useSezioniConArticoli() {
  const { data } = await useAsyncData('sezioni-con-articoli', () =>
    queryCollection('news').select('sezione').all()
  )
  return computed(() => sezioniConArticoli(data.value ?? []))
}
