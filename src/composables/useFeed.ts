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

const PAGE_SIZE = 20

// Estado singleton a nivel de módulo: la vista del feed y el compositor lo comparten.
const quotes = ref<FeedQuote[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const loaded = ref(false)
// Paginación por cursor de fecha (robusta ante prepends del realtime).
const hasMore = ref(true)
const loadingMore = ref(false)
// Autores cuyo contenido entra en mi feed (yo + a quién sigo). Lo usa Realtime.
const followedAuthors = ref<Set<string>>(new Set())

// "Descubre la comunidad": citas recientes de gente a la que NO sigo (ni yo mismo).
// Sirve de fallback cuando el feed está vacío y de sugerencia cuando tiene contenido.
const communityQuotes = ref<FeedQuote[]>([])
const communityLoading = ref(false)
const communityLoaded = ref(false)

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
  followedAuthors.value = new Set(authorIds)

  const { data, error: quotesErr } = await supabase
    .from('quotes')
    .select(QUOTE_COLUMNS)
    .in('user_id', authorIds)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (quotesErr) {
    error.value = 'No se pudo cargar tu feed.'
  } else {
    quotes.value = data ?? []
    hasMore.value = (data?.length ?? 0) === PAGE_SIZE
    loaded.value = true
    useComments().hydrateCounts(quotes.value)
    await useLikes().hydrate(quotes.value)
  }
  loading.value = false
}

/** Carga la siguiente página del feed (citas anteriores a la última visible). */
async function loadMore() {
  const auth = useAuthStore()
  if (!auth.user || loadingMore.value || !hasMore.value || !quotes.value.length) return

  loadingMore.value = true
  const authorIds = [...followedAuthors.value]
  const last = quotes.value[quotes.value.length - 1]

  const { data, error: moreErr } = await supabase
    .from('quotes')
    .select(QUOTE_COLUMNS)
    .in('user_id', authorIds)
    .lt('created_at', last.created_at)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (!moreErr && data) {
    const existing = new Set(quotes.value.map((q) => q.id))
    const fresh = data.filter((q) => !existing.has(q.id))
    quotes.value = [...quotes.value, ...fresh]
    hasMore.value = data.length === PAGE_SIZE
    useComments().hydrateCounts(fresh)
    await useLikes().hydrate(fresh)
  }
  loadingMore.value = false
}

/**
 * Carga citas recientes de la comunidad para "Descubrir": excluye mis propias
 * citas y las de quien ya sigo (para que sea descubrimiento real, no duplicar el
 * feed). Se apoya en `followedAuthors`, que rellena `loadFeed`; por eso conviene
 * llamarla después de `loadFeed`.
 */
async function loadCommunity() {
  const auth = useAuthStore()
  if (!auth.user) return

  communityLoading.value = true

  // Excluir siempre a uno mismo, más a todos los autores que ya entran en mi feed.
  const exclude = new Set<string>([auth.user.id, ...followedAuthors.value])
  const excludeList = `(${[...exclude].join(',')})`

  const { data } = await supabase
    .from('quotes')
    .select(QUOTE_COLUMNS)
    .not('user_id', 'in', excludeList)
    .order('created_at', { ascending: false })
    .limit(20)

  communityQuotes.value = data ?? []
  communityLoaded.value = true
  useComments().hydrateCounts(communityQuotes.value)
  await useLikes().hydrate(communityQuotes.value)
  communityLoading.value = false
}

/** Inserta una cita recién publicada al principio del feed (sin recargar). */
function prependQuote(quote: FeedQuote) {
  quotes.value = [quote, ...quotes.value]
  useComments().hydrateCounts([quote])
  void useLikes().hydrate([quote])
}

/** ¿El autor entra en mi feed? (yo o alguien a quien sigo). */
function isFollowed(userId: string): boolean {
  return followedAuthors.value.has(userId)
}

/** Realtime: trae una cita entrante por id (con embeds) y la añade al feed. */
async function addQuoteById(quoteId: string) {
  if (quotes.value.some((q) => q.id === quoteId)) return // evita duplicados
  const { data } = await supabase.from('quotes').select(QUOTE_COLUMNS).eq('id', quoteId).single()
  if (data) prependQuote(data)
}

/** Realtime: refresca una cita ya visible (tras editarla otro usuario). */
async function refreshQuoteById(quoteId: string) {
  if (!quotes.value.some((q) => q.id === quoteId)) return
  const { data } = await supabase.from('quotes').select(QUOTE_COLUMNS).eq('id', quoteId).single()
  if (data) quotes.value = quotes.value.map((q) => (q.id === quoteId ? data : q))
}

/** Realtime: quita del feed una cita borrada. */
function removeQuoteById(quoteId: string) {
  quotes.value = quotes.value.filter((q) => q.id !== quoteId)
}

/**
 * Acabo de seguir a alguien (p. ej. desde "A quién seguir"): sus citas dejan de
 * ser "comunidad", pasan a entrar en mi feed vía Realtime, y traigo aquí y ahora
 * sus citas recientes para que el feed refleje el follow al instante.
 */
async function onFollowedAuthor(userId: string) {
  followedAuthors.value = new Set([...followedAuthors.value, userId])
  communityQuotes.value = communityQuotes.value.filter((q) => q.user_id !== userId)

  const { data } = await supabase
    .from('quotes')
    .select(QUOTE_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data?.length) return

  const existing = new Set(quotes.value.map((q) => q.id))
  const fresh = data.filter((q) => !existing.has(q.id))
  if (!fresh.length) return

  quotes.value = [...quotes.value, ...fresh].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )
  useComments().hydrateCounts(fresh)
  await useLikes().hydrate(fresh)
}

export function useFeed() {
  return {
    quotes,
    loading,
    error,
    loaded,
    hasMore,
    loadingMore,
    communityQuotes,
    communityLoading,
    communityLoaded,
    loadFeed,
    loadMore,
    loadCommunity,
    prependQuote,
    isFollowed,
    addQuoteById,
    refreshQuoteById,
    removeQuoteById,
    onFollowedAuthor,
  }
}
