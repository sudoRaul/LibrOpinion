import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { QUOTE_COLUMNS, type FeedQuote } from './useFeed'
import { useLikes } from './useLikes'
import { useComments } from './useComments'

// Un id que no es UUID nunca puede existir: lo tratamos como "no encontrada"
// (y además evitamos el error de PostgREST por sintaxis de UUID inválida).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Carga y estado de una sola cita (para el permalink `/q/:id`). */
export function useQuote() {
  const quote = ref<FeedQuote | null>(null)
  const loading = ref(false)
  const notFound = ref(false)
  const error = ref<string | null>(null)

  async function load(id: string) {
    loading.value = true
    notFound.value = false
    error.value = null
    quote.value = null

    if (!UUID_RE.test(id)) {
      notFound.value = true
      loading.value = false
      return
    }

    const { data, error: err } = await supabase
      .from('quotes')
      .select(QUOTE_COLUMNS)
      .eq('id', id)
      .maybeSingle()

    if (err) {
      error.value = 'No se pudo cargar la cita.'
      loading.value = false
      return
    }
    if (!data) {
      notFound.value = true
      loading.value = false
      return
    }

    quote.value = data
    useComments().hydrateCounts([data])
    await useLikes().hydrate([data])
    loading.value = false
  }

  return { quote, loading, notFound, error, load }
}
