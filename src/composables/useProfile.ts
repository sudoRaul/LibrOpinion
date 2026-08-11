import { computed, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import type { Database } from '../lib/database.types'
import { QUOTE_COLUMNS, type FeedQuote } from './useFeed'
import { useLikes } from './useLikes'
import { useComments } from './useComments'
import { useFollowRequests } from './useFollowRequests'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type FollowState = 'none' | 'pending' | 'accepted'

const PAGE_SIZE = 20

// Perfil actualmente en pantalla, para que Realtime pueda refrescarlo en vivo.
let activeProfileId: string | null = null
let activeReload: (() => void) | null = null

/**
 * Realtime: recarga el perfil que tengo abierto si su id coincide. Lo usan tanto
 * la aceptación de solicitud ("Solicitado" → "Siguiendo" + sus citas) como el
 * rechazo / quitar seguidor ("Solicitado"/"Siguiendo" → "Seguir"), sin recargar.
 */
export function reloadProfileIfViewing(authorId: string) {
  if (activeProfileId === authorId && activeReload) activeReload()
}

/** Al salir de la vista de perfil. */
export function clearActiveProfile() {
  activeProfileId = null
  activeReload = null
}

export function useProfile() {
  const profile = ref<Profile | null>(null)
  const quotes = ref<FeedQuote[]>([])
  const followers = ref(0)
  const following = ref(0)
  const followState = ref<FollowState>('none')
  const isSelf = ref(false)
  const loading = ref(false)
  const notFound = ref(false)
  const error = ref<string | null>(null)
  const followBusy = ref(false)
  // ¿Esta persona me ha solicitado seguirme? (para el aviso de aceptar/rechazar).
  const hasIncomingRequest = ref(false)
  const incomingBusy = ref(false)
  // Paginación de las citas del perfil (cursor por fecha).
  const quotesHasMore = ref(false)
  const quotesLoadingMore = ref(false)

  // ¿Puedo ver el contenido/listas de este perfil? (propio, público o seguidor aceptado).
  const canSeeContent = computed(() => {
    const p = profile.value
    if (!p) return false
    return isSelf.value || !p.is_private || followState.value === 'accepted'
  })
  const canSeeLists = canSeeContent

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
    // Registro este perfil como "activo" para que Realtime pueda refrescarlo.
    activeProfileId = prof.id
    activeReload = () => {
      if (prof.username) load(prof.username)
    }

    // Contadores (solo aceptados), citas (RLS las oculta si no puedo verlas), mi
    // estado de seguimiento (none/pending/accepted) y si ESTA persona me ha
    // solicitado seguirme, en paralelo.
    const [followersRes, followingRes, quotesRes, myFollowRes, incomingRes] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', prof.id).eq('status', 'accepted'),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', prof.id).eq('status', 'accepted'),
      supabase.from('quotes').select(QUOTE_COLUMNS).eq('user_id', prof.id).order('created_at', { ascending: false }).limit(PAGE_SIZE),
      auth.user && auth.user.id !== prof.id
        ? supabase.from('follows').select('status').eq('follower_id', auth.user.id).eq('following_id', prof.id).maybeSingle()
        : Promise.resolve({ data: null }),
      auth.user && auth.user.id !== prof.id
        ? supabase.from('follows').select('follower_id').eq('follower_id', prof.id).eq('following_id', auth.user.id).eq('status', 'pending').maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    followers.value = followersRes.count ?? 0
    following.value = followingRes.count ?? 0
    quotes.value = quotesRes.data ?? []
    quotesHasMore.value = (quotesRes.data?.length ?? 0) === PAGE_SIZE
    const myFollow = myFollowRes.data as { status?: string } | null
    followState.value = (myFollow?.status as FollowState) ?? 'none'
    hasIncomingRequest.value = incomingRes.data != null

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

  /** Recuenta seguidores/seguidos aceptados del perfil (tras cambios en las listas). */
  async function refreshCounts() {
    if (!profile.value) return
    const id = profile.value.id
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id).eq('status', 'accepted'),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id).eq('status', 'accepted'),
    ])
    followers.value = followersRes.count ?? 0
    following.value = followingRes.count ?? 0
  }

  /**
   * Seguir / solicitar / dejar de seguir / cancelar, según el estado actual y la
   * privacidad del perfil. Optimista con revert. La BD decide el status real (el
   * trigger pone 'pending' si el destino es privado).
   */
  async function toggleFollow() {
    const auth = useAuthStore()
    if (!auth.user || !profile.value || isSelf.value || followBusy.value) return

    followBusy.value = true
    const targetId = profile.value.id

    if (followState.value === 'accepted' || followState.value === 'pending') {
      // Dejar de seguir (accepted) o cancelar solicitud (pending).
      const prev = followState.value
      followState.value = 'none'
      if (prev === 'accepted') followers.value = Math.max(0, followers.value - 1)

      const { error: delErr } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', auth.user.id)
        .eq('following_id', targetId)
      if (delErr) {
        followState.value = prev
        if (prev === 'accepted') followers.value += 1
      }
    } else {
      // Seguir (público → accepted) o solicitar (privado → pending).
      const willBe: FollowState = profile.value.is_private ? 'pending' : 'accepted'
      followState.value = willBe
      if (willBe === 'accepted') followers.value += 1

      const { error: insErr } = await supabase
        .from('follows')
        .insert({ follower_id: auth.user.id, following_id: targetId })
      if (insErr) {
        followState.value = 'none'
        if (willBe === 'accepted') followers.value = Math.max(0, followers.value - 1)
      }
    }
    followBusy.value = false
  }

  /** Acepta la solicitud que ESTA persona me ha enviado (aviso del perfil). */
  async function acceptIncomingRequest() {
    if (!profile.value || incomingBusy.value) return
    incomingBusy.value = true
    const ok = await useFollowRequests().accept(profile.value.id)
    incomingBusy.value = false
    if (ok) {
      hasIncomingRequest.value = false
      refreshCounts() // esta persona ahora me sigue → cambia su nº de "siguiendo"
    }
  }

  /** Rechaza la solicitud que ESTA persona me ha enviado. */
  async function rejectIncomingRequest() {
    if (!profile.value || incomingBusy.value) return
    incomingBusy.value = true
    const ok = await useFollowRequests().reject(profile.value.id)
    incomingBusy.value = false
    if (ok) hasIncomingRequest.value = false
  }

  return {
    profile,
    quotes,
    followers,
    following,
    followState,
    canSeeContent,
    canSeeLists,
    isSelf,
    loading,
    notFound,
    error,
    followBusy,
    hasIncomingRequest,
    incomingBusy,
    quotesHasMore,
    quotesLoadingMore,
    load,
    loadMoreQuotes,
    toggleFollow,
    refreshCounts,
    acceptIncomingRequest,
    rejectIncomingRequest,
  }
}
