import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useFeed } from './useFeed'
import { useLikes } from './useLikes'
import { useComments } from './useComments'
import { useNotifications } from './useNotifications'
import { useFollowRequests } from './useFollowRequests'
import { reloadProfileIfViewing } from './useProfile'

let channel: RealtimeChannel | null = null

/** Arranca la escucha en vivo de citas, likes y comentarios. Idempotente. */
function start() {
  const auth = useAuthStore()
  if (!auth.user || channel) return

  const myId = auth.user.id
  const feed = useFeed()
  const likes = useLikes()
  const comments = useComments()
  const notifications = useNotifications()

  channel = supabase
    .channel('libropinion-realtime')
    // Citas nuevas: si es de alguien a quien sigo, la traigo al feed.
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'quotes' },
      (payload) => {
        const row = payload.new as { id: string; user_id: string }
        if (row.user_id === myId) return // ya la añado yo al publicar (optimista)
        if (feed.isFollowed(row.user_id)) void feed.addQuoteById(row.id)
      },
    )
    // Likes de otros: ajusto el recuento.
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'likes' },
      (payload) => {
        const row = payload.new as { user_id: string; quote_id: string }
        if (row.user_id !== myId) likes.bump(row.quote_id, +1)
      },
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'likes' },
      (payload) => {
        const row = payload.old as { user_id?: string; quote_id?: string }
        if (row.quote_id && row.user_id !== myId) likes.bump(row.quote_id, -1)
      },
    )
    // Comentarios de otros: subo el contador (y recargo la lista si está abierta).
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments' },
      (payload) => {
        const row = payload.new as { user_id: string; quote_id: string }
        if (row.user_id !== myId) comments.applyRemoteInsert(row.quote_id)
      },
    )
    // Cita editada por otro: refresco la que ya tengo en el feed.
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'quotes' },
      (payload) => {
        const row = payload.new as { id: string; user_id: string }
        if (row.user_id !== myId) void feed.refreshQuoteById(row.id)
      },
    )
    // Cita borrada: la quito del feed (mis borrados ya se reflejan localmente).
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'quotes' },
      (payload) => {
        const row = payload.old as { id?: string }
        if (row.id) feed.removeQuoteById(row.id)
      },
    )
    // Notificación nueva para mí: la traigo con sus datos y subo el contador.
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${myId}`,
      },
      (payload) => {
        const row = payload.new as { id: string }
        void notifications.applyIncoming(row.id).then((n) => {
          if (!n) return
          // Me aceptaron: si estoy en el perfil del que acepta, pasa a "Siguiendo".
          if (n.type === 'follow_accepted') reloadProfileIfViewing(n.actor_id)
          // Nueva solicitud: mantengo vivo el recuento de "Solicitudes".
          if (n.type === 'follow_request') void useFollowRequests().loadCount()
        })
      },
    )
    // Un follow MÍO se borró (me rechazaron la solicitud o me quitaron como
    // seguidor): si estoy en el perfil de esa persona, su botón vuelve a "Seguir".
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'follows',
        filter: `follower_id=eq.${myId}`,
      },
      (payload) => {
        const row = payload.old as { following_id?: string }
        if (row.following_id) reloadProfileIfViewing(row.following_id)
      },
    )
    // Notificación mía borrada (unfollow/unlike): la quito de la campana en vivo.
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${myId}`,
      },
      (payload) => {
        const row = payload.old as { id?: string; read?: boolean }
        if (row.id) notifications.applyRemoteDelete(row.id, row.read === false)
      },
    )
    .subscribe()
}

/** Detiene la escucha (p. ej. al cerrar sesión). */
function stop() {
  if (channel) {
    void supabase.removeChannel(channel)
    channel = null
  }
}

export function useRealtime() {
  return { start, stop }
}
