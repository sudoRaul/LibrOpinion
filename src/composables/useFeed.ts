import { ref } from 'vue'
import type { QueryData } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useLikes } from './useLikes'
import { useComments } from './useComments'

// Columnas del feed: la cita + libro + autor + recuentos de likes/comentarios.
// Se declara como literal para que el cliente tipado infiera la forma anidada.
// `author:profiles!quotes_user_id_fkey` desambigua el embed: al tener likes y
// comments FKs a quotes y a profiles, PostgREST ve varias relaciones posibles.
export const QUOTE_COLUMNS =
  'id, content, page, note, created_at, user_id, book:books(id, title, author, cover_url), author:profiles!quotes_user_id_fkey(id, username, display_name, avatar_url), likes(count), comments(count)'

const feedQueryProbe = supabase.from('quotes').select(QUOTE_COLUMNS)
export type FeedQuote = QueryData<typeof feedQueryProbe>[number]

// Estado singleton a nivel de módulo: la vista del feed y el compositor lo comparten.
const quotes = ref<FeedQuote[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const loaded = ref(false)

async function loadFeed() {
  const auth = useAuthStore()
  if (!auth.user) return

  loading.value = true
  error.value = null

  // A quién sigo (el "feed" es un filtro de consulta, no una regla de RLS).
  const { data: follows, error: followErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', auth.user.id)

  if (followErr) {
    error.value = 'No se pudo cargar tu feed.'
    loading.value = false
    return
  }

  const authorIds = [auth.user.id, ...follows.map((f) => f.following_id)]

  const { data, error: quotesErr } = await supabase
    .from('quotes')
    .select(QUOTE_COLUMNS)
    .in('user_id', authorIds)
    .order('created_at', { ascending: false })
    .limit(50)

  if (quotesErr) {
    error.value = 'No se pudo cargar tu feed.'
  } else {
    quotes.value = data ?? []
    loaded.value = true
    useComments().hydrateCounts(quotes.value)
    await useLikes().hydrate(quotes.value)
  }
  loading.value = false
}

/** Inserta una cita recién publicada al principio del feed (sin recargar). */
function prependQuote(quote: FeedQuote) {
  quotes.value = [quote, ...quotes.value]
  useComments().hydrateCounts([quote])
  void useLikes().hydrate([quote])
}

export function useFeed() {
  return { quotes, loading, error, loaded, loadFeed, prependQuote }
}
