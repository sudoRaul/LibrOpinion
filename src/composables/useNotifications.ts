import { ref } from 'vue'
import type { QueryData } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

// Notificación + actor (quién la provoca) + extracto de la cita implicada.
// `actor:profiles!notifications_actor_id_fkey` desambigua: recipient_id y actor_id
// apuntan ambos a profiles.
const NOTIFICATION_COLUMNS =
  'id, type, read, created_at, actor_id, quote_id, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url), quote:quotes(id, content)'

const notificationProbe = supabase.from('notifications').select(NOTIFICATION_COLUMNS)
export type AppNotification = QueryData<typeof notificationProbe>[number]

// Estado singleton: la campana está en varias vistas y comparte lista/contador.
const items = ref<AppNotification[]>([])
const unread = ref(0)
const loading = ref(false)
const loaded = ref(false)

async function load() {
  const auth = useAuthStore()
  if (!auth.user) return

  loading.value = true

  const [listRes, unreadRes] = await Promise.all([
    supabase
      .from('notifications')
      .select(NOTIFICATION_COLUMNS)
      .eq('recipient_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', auth.user.id)
      .eq('read', false),
  ])

  items.value = listRes.data ?? []
  unread.value = unreadRes.count ?? 0
  loaded.value = true
  loading.value = false
}

/** Marca todas como leídas (optimista con revert). */
async function markAllRead() {
  const auth = useAuthStore()
  if (!auth.user || unread.value === 0) return

  const prev = unread.value
  const snapshot = items.value
  items.value = items.value.map((n) => (n.read ? n : { ...n, read: true }))
  unread.value = 0

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('recipient_id', auth.user.id)
    .eq('read', false)

  if (error) {
    items.value = snapshot
    unread.value = prev
  }
}

/** Marca una notificación como leída (al pulsarla). Optimista con revert. */
async function markRead(id: string) {
  const auth = useAuthStore()
  if (!auth.user) return
  const item = items.value.find((n) => n.id === id)
  if (!item || item.read) return

  item.read = true
  unread.value = Math.max(0, unread.value - 1)

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('recipient_id', auth.user.id)

  if (error) {
    item.read = false
    unread.value += 1
  }
}

/** Realtime: llega una notificación nueva; la traigo con sus embeds y la encabezo. */
async function applyIncoming(id: string) {
  if (items.value.some((n) => n.id === id)) return
  const { data } = await supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (!data) return
  items.value = [data, ...items.value]
  if (!data.read) unread.value += 1
}

/** Realtime: una notificación mía se borró (unfollow/unlike). La quito y ajusto el contador. */
function applyRemoteDelete(id: string, wasUnread: boolean) {
  const existing = items.value.find((n) => n.id === id)
  items.value = items.value.filter((n) => n.id !== id)
  // Si la tengo cargada, uso su estado real; si no, me fío del dato del evento.
  const unreadRemoved = existing ? !existing.read : wasUnread
  if (unreadRemoved) unread.value = Math.max(0, unread.value - 1)
}

/** Al cerrar sesión. */
function reset() {
  items.value = []
  unread.value = 0
  loaded.value = false
}

export function useNotifications() {
  return {
    items,
    unread,
    loading,
    loaded,
    load,
    markAllRead,
    markRead,
    applyIncoming,
    applyRemoteDelete,
    reset,
  }
}
