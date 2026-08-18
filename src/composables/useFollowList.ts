import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

export type FollowListMode = 'followers' | 'following'

export interface FollowListUser {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  isFollowing: boolean // ¿yo (usuario en sesión) sigo a esta persona?
  busy: boolean
}

/**
 * Lista de seguidores o seguidos de un perfil. Cada fila sabe si YO la sigo, para
 * ofrecer seguir/dejar de seguir en línea. La seguridad la impone RLS: solo puedo
 * insertar/borrar follows donde `follower_id = auth.uid()`.
 */
export function useFollowList() {
  const items = ref<FollowListUser[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(userId: string, mode: FollowListMode) {
    const auth = useAuthStore()
    loading.value = true
    error.value = null
    items.value = []

    // Listas vía RPC `follow_list`: la RLS de follows ya no expone el grafo, y el
    // RPC aplica la puerta de visibilidad (`can_view_author`) en el servidor, así
    // que las listas de cuentas privadas que no puedo ver vuelven vacías.
    const { data, error: listErr } = await supabase.rpc('follow_list', {
      p_target: userId,
      p_mode: mode,
    })

    if (listErr) {
      error.value = 'No se pudo cargar la lista.'
      loading.value = false
      return
    }

    const profiles = data ?? []

    // ¿A cuáles de estas personas sigo yo? (para el botón de cada fila).
    let followedByMe = new Set<string>()
    if (auth.user && profiles.length) {
      const ids = profiles.map((p) => p.id)
      const { data: mine } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', auth.user.id)
        .in('following_id', ids)
      followedByMe = new Set((mine ?? []).map((r) => r.following_id))
    }

    items.value = profiles.map((p) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      isFollowing: followedByMe.has(p.id),
      busy: false,
    }))
    loading.value = false
  }

  /** Sigo / dejo de seguir a una fila. Optimista con revert. Devuelve true si cambió. */
  async function toggle(item: FollowListUser): Promise<boolean> {
    const auth = useAuthStore()
    if (!auth.user || item.busy || item.id === auth.user.id) return false

    item.busy = true
    const wasFollowing = item.isFollowing
    item.isFollowing = !wasFollowing

    const { error: opErr } = wasFollowing
      ? await supabase
          .from('follows')
          .delete()
          .eq('follower_id', auth.user.id)
          .eq('following_id', item.id)
      : await supabase.from('follows').insert({ follower_id: auth.user.id, following_id: item.id })

    item.busy = false
    if (opErr) {
      item.isFollowing = wasFollowing // revert
      return false
    }
    return true
  }

  return { items, loading, error, load, toggle }
}
