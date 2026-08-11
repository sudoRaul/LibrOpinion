import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import type { Database } from '../lib/database.types'
import { QUOTE_COLUMNS, type FeedQuote } from './useFeed'
import { useLikes } from './useLikes'
import { useComments } from './useComments'

export type Profile = Database['public']['Tables']['profiles']['Row']

const PAGE_SIZE = 20

export function useProfile() {
  const profile = ref<Profile | null>(null)
  const quotes = ref<FeedQuote[]>([])
  const followers = ref(0)
  const following = ref(0)
  const isFollowing = ref(false)
  const isSelf = ref(false)
  const loading = ref(false)
  const notFound = ref(false)
  const error = ref<string | null>(null)
  const followBusy = ref(false)
  // Paginación de las citas del perfil (cursor por fecha).
  const quotesHasMore = ref(false)
  const quotesLoadingMore = ref(false)

  async function load(username: string) {
    const auth = useAuthStore()
    loading.value = true
    notFound.value = false
    error.value = null

    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()

    if (profErr) {
      error.value = 'No se pudo cargar el perfil.'
      loading.value = false
      return
    }
    if (!prof) {
      notFound.value = true
      loading.value = false
      return
    }

    profile.value = prof
    isSelf.value = auth.user?.id === prof.id

    // Contadores, citas y estado de seguimiento en paralelo.
    const [followersRes, followingRes, quotesRes, followingMeRes] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', prof.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', prof.id),
      supabase.from('quotes').select(QUOTE_COLUMNS).eq('user_id', prof.id).order('created_at', { ascending: false }).limit(PAGE_SIZE),
      auth.user && auth.user.id !== prof.id
        ? supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', auth.user.id).eq('following_id', prof.id)
        : Promise.resolve({ count: 0 }),
    ])

    followers.value = followersRes.count ?? 0
    following.value = followingRes.count ?? 0
    quotes.value = quotesRes.data ?? []
    quotesHasMore.value = (quotesRes.data?.length ?? 0) === PAGE_SIZE
    isFollowing.value = (followingMeRes.count ?? 0) > 0

    useComments().hydrateCounts(quotes.value)
    await useLikes().hydrate(quotes.value)

    loading.value = false
  }

  /** Carga más citas del perfil (anteriores a la última visible). */
  async function loadMoreQuotes() {
    if (!profile.value || quotesLoadingMore.value || !quotesHasMore.value || !quotes.value.length) {
      return
    }
    quotesLoadingMore.value = true
    const last = quotes.value[quotes.value.length - 1]

    const { data } = await supabase
      .from('quotes')
      .select(QUOTE_COLUMNS)
      .eq('user_id', profile.value.id)
      .lt('created_at', last.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (data) {
      const existing = new Set(quotes.value.map((q) => q.id))
      const fresh = data.filter((q) => !existing.has(q.id))
      quotes.value = [...quotes.value, ...fresh]
      quotesHasMore.value = data.length === PAGE_SIZE
      useComments().hydrateCounts(fresh)
      await useLikes().hydrate(fresh)
    }
    quotesLoadingMore.value = false
  }

  /** Recuenta seguidores/seguidos del perfil (tras cambios hechos desde las listas). */
  async function refreshCounts() {
    if (!profile.value) return
    const id = profile.value.id
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
    ])
    followers.value = followersRes.count ?? 0
    following.value = followingRes.count ?? 0
  }

  async function toggleFollow() {
    const auth = useAuthStore()
    if (!auth.user || !profile.value || isSelf.value || followBusy.value) return

    followBusy.value = true
    const targetId = profile.value.id

    if (isFollowing.value) {
      // Optimista: reflejamos el cambio y revertimos si falla.
      isFollowing.value = false
      followers.value = Math.max(0, followers.value - 1)
      const { error: delErr } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', auth.user.id)
        .eq('following_id', targetId)
      if (delErr) {
        isFollowing.value = true
        followers.value += 1
      }
    } else {
      isFollowing.value = true
      followers.value += 1
      const { error: insErr } = await supabase
        .from('follows')
        .insert({ follower_id: auth.user.id, following_id: targetId })
      if (insErr) {
        isFollowing.value = false
        followers.value = Math.max(0, followers.value - 1)
      }
    }
    followBusy.value = false
  }

  return {
    profile,
    quotes,
    followers,
    following,
    isFollowing,
    isSelf,
    loading,
    notFound,
    error,
    followBusy,
    quotesHasMore,
    quotesLoadingMore,
    load,
    loadMoreQuotes,
    toggleFollow,
    refreshCounts,
  }
}
