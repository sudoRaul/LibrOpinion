import { ref } from 'vue'
import type { QueryData } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

// Solicitudes de seguimiento que YO he recibido (follows pendientes hacia mí),
// con el perfil del solicitante embebido.
const REQUEST_COLUMNS =
  'follower_id, created_at, follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)'

const requestProbe = supabase.from('follows').select(REQUEST_COLUMNS)
export type FollowRequest = QueryData<typeof requestProbe>[number]

// Estado singleton: el badge y la vista "Solicitudes" lo comparten.
const requests = ref<FollowRequest[]>([])
const count = ref(0)
const loading = ref(false)
const loaded = ref(false)

async function load() {
  const auth = useAuthStore()
  if (!auth.user) return
  loading.value = true
  const { data } = await supabase
    .from('follows')
    .select(REQUEST_COLUMNS)
    .eq('following_id', auth.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  requests.value = data ?? []
  count.value = requests.value.length
  loaded.value = true
  loading.value = false
}

/** Solo el recuento (para el badge), sin traer la lista completa. */
async function loadCount() {
  const auth = useAuthStore()
  if (!auth.user) return
  const { count: c } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', auth.user.id)
    .eq('status', 'pending')
  count.value = c ?? 0
}

/** Acepta la solicitud de un solicitante (update status → accepted). */
async function accept(followerId: string): Promise<boolean> {
  const auth = useAuthStore()
  if (!auth.user) return false
  const { error } = await supabase
    .from('follows')
    .update({ status: 'accepted' })
    .eq('follower_id', followerId)
    .eq('following_id', auth.user.id)
  if (error) return false
  requests.value = requests.value.filter((r) => r.follower_id !== followerId)
  count.value = Math.max(0, count.value - 1)
  return true
}

/** Rechaza la solicitud (borra la fila pendiente). */
async function reject(followerId: string): Promise<boolean> {
  const auth = useAuthStore()
  if (!auth.user) return false
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', auth.user.id)
  if (error) return false
  requests.value = requests.value.filter((r) => r.follower_id !== followerId)
  count.value = Math.max(0, count.value - 1)
  return true
}

function reset() {
  requests.value = []
  count.value = 0
  loaded.value = false
}

export function useFollowRequests() {
  return { requests, count, loading, loaded, load, loadCount, accept, reject, reset }
}
