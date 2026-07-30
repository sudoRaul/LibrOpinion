import { reactive } from 'vue'
import type { QueryData } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const COMMENT_COLUMNS =
  'id, content, created_at, user_id, author:profiles(id, username, display_name, avatar_url)'

const commentProbe = supabase.from('comments').select(COMMENT_COLUMNS)
export type Comment = QueryData<typeof commentProbe>[number]

const counts = reactive(new Map<string, number>())
const lists = reactive(new Map<string, Comment[]>())
const loaded = reactive(new Set<string>())

type Hydratable = { id: string; comments?: { count: number }[] | null }

/** Siembra los contadores desde el agregado embebido del feed/perfil. */
function hydrateCounts(items: Hydratable[]) {
  for (const q of items) counts.set(q.id, q.comments?.[0]?.count ?? 0)
}

/** Carga la lista de comentarios de una cita (una sola vez, al abrir el panel). */
async function load(quoteId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_COLUMNS)
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: true })
  if (!error) {
    lists.set(quoteId, data ?? [])
    counts.set(quoteId, (data ?? []).length)
    loaded.add(quoteId)
  }
}

async function add(quoteId: string, content: string): Promise<{ error: string | null }> {
  const auth = useAuthStore()
  if (!auth.user) return { error: 'No hay ninguna sesión activa.' }

  const { data, error } = await supabase
    .from('comments')
    .insert({ quote_id: quoteId, user_id: auth.user.id, content: content.trim() })
    .select(COMMENT_COLUMNS)
    .single()
  if (error || !data) return { error: error?.message ?? 'No se pudo publicar el comentario.' }

  lists.set(quoteId, [...(lists.get(quoteId) ?? []), data])
  counts.set(quoteId, (counts.get(quoteId) ?? 0) + 1)
  return { error: null }
}

async function remove(quoteId: string, commentId: string) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) return
  lists.set(
    quoteId,
    (lists.get(quoteId) ?? []).filter((c) => c.id !== commentId),
  )
  counts.set(quoteId, Math.max(0, (counts.get(quoteId) ?? 1) - 1))
}

export function useComments() {
  return {
    hydrateCounts,
    load,
    add,
    remove,
    getCount: (quoteId: string) => counts.get(quoteId) ?? 0,
    getList: (quoteId: string) => lists.get(quoteId) ?? [],
    isLoaded: (quoteId: string) => loaded.has(quoteId),
  }
}
