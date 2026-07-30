import { reactive } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

interface LikeInfo {
  count: number
  liked: boolean
}

// Estado global keyed por quote_id: recuento y si yo le he dado like.
const state = reactive(new Map<string, LikeInfo>())

type Hydratable = { id: string; likes?: { count: number }[] | null }

/** Siembra recuentos (desde el agregado embebido) y marca cuáles he likeado. */
async function hydrate(items: Hydratable[]) {
  for (const q of items) {
    const count = q.likes?.[0]?.count ?? 0
    const existing = state.get(q.id)
    state.set(q.id, { count, liked: existing?.liked ?? false })
  }

  const auth = useAuthStore()
  if (!auth.user || !items.length) return

  const ids = items.map((i) => i.id)
  const { data } = await supabase
    .from('likes')
    .select('quote_id')
    .eq('user_id', auth.user.id)
    .in('quote_id', ids)

  const liked = new Set((data ?? []).map((r) => r.quote_id))
  for (const id of ids) {
    const info = state.get(id)
    if (info) info.liked = liked.has(id)
  }
}

async function toggle(quoteId: string) {
  const auth = useAuthStore()
  if (!auth.user) return

  if (!state.has(quoteId)) state.set(quoteId, { count: 0, liked: false })
  const info = state.get(quoteId)!

  if (info.liked) {
    info.liked = false
    info.count = Math.max(0, info.count - 1)
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', auth.user.id)
      .eq('quote_id', quoteId)
    if (error) {
      info.liked = true
      info.count += 1
    }
  } else {
    info.liked = true
    info.count += 1
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: auth.user.id, quote_id: quoteId })
    if (error) {
      info.liked = false
      info.count = Math.max(0, info.count - 1)
    }
  }
}

function get(quoteId: string): LikeInfo {
  return state.get(quoteId) ?? { count: 0, liked: false }
}

export function useLikes() {
  return { hydrate, toggle, get }
}
