import { ref } from 'vue'
import type { QueryData } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useFeed } from './useFeed'

const SUGGESTION_COLUMNS = 'id, username, display_name, avatar_url, bio, is_private'

const suggestionProbe = supabase.from('profiles').select(SUGGESTION_COLUMNS)
export type Suggestion = QueryData<typeof suggestionProbe>[number]

// Estado singleton: el bloque "A quién seguir" del feed lo comparte toda la app.
const suggestions = ref<Suggestion[]>([])
const loading = ref(false)
const loaded = ref(false)
// Ids con follow en curso, para deshabilitar el botón sin bloquear a los demás.
const busy = ref<Set<string>>(new Set())

/**
 * Carga sugerencias de perfiles: con `username` (onboarding hecho), que no sea
 * yo y que no siga ya. Recientes primero. El "no seguir a estos" es un filtro
 * de consulta; la seguridad la impone RLS al insertar en `follows`.
 */
async function load() {
  const auth = useAuthStore()
  if (!auth.user) return

  loading.value = true

  // A quién sigo ya, para no sugerírmelo.
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', auth.user.id)

  const exclude = new Set<string>([auth.user.id, ...(follows ?? []).map((f) => f.following_id)])
  const excludeList = `(${[...exclude].join(',')})`

  const { data } = await supabase
    .from('profiles')
    .select(SUGGESTION_COLUMNS)
    .not('username', 'is', null)
    .not('id', 'in', excludeList)
    .order('created_at', { ascending: false })
    .limit(7)

  suggestions.value = data ?? []
  loaded.value = true
  loading.value = false
}

/** Sigue a un perfil sugerido: optimista (lo quita de la lista) y con revert. */
async function follow(profile: Suggestion) {
  const auth = useAuthStore()
  if (!auth.user || busy.value.has(profile.id)) return

  busy.value = new Set(busy.value).add(profile.id)

  // Optimista: fuera de la lista ya.
  const index = suggestions.value.findIndex((s) => s.id === profile.id)
  suggestions.value = suggestions.value.filter((s) => s.id !== profile.id)

  // La BD decide el status (pending si el destino es privado). Lo pedimos de vuelta.
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: auth.user.id, following_id: profile.id })
    .select('status')
    .single()

  const next = new Set(busy.value)
  next.delete(profile.id)
  busy.value = next

  if (error) {
    // Revert: lo devuelvo a su sitio.
    const restored = [...suggestions.value]
    restored.splice(index < 0 ? restored.length : index, 0, profile)
    suggestions.value = restored
    return
  }

  // Si fue aceptado (cuenta pública), sus citas entran a mi feed y salen de la
  // comunidad. Si quedó 'pending' (privada), es una solicitud: no hay nada que traer.
  if (data?.status === 'accepted') {
    await useFeed().onFollowedAuthor(profile.id)
  }
}

function isBusy(id: string): boolean {
  return busy.value.has(id)
}

export function useSuggestions() {
  return { suggestions, loading, loaded, load, follow, isBusy }
}
