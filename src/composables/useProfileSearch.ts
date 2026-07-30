import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import type { Database } from '../lib/database.types'

export type ProfileHit = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'username' | 'display_name' | 'avatar_url'
>

export function useProfileSearch() {
  /** Busca lectores por @usuario o nombre (excluye mi propio perfil). */
  async function searchProfiles(query: string): Promise<ProfileHit[]> {
    const q = query.trim()
    if (q.length < 2) return []
    const pattern = `%${q.replace(/[,()]/g, ' ')}%`

    let builder = supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
      .not('username', 'is', null)

    const auth = useAuthStore()
    if (auth.user) builder = builder.neq('id', auth.user.id)

    const { data, error } = await builder.limit(8)
    if (error) return []
    return data ?? []
  }

  return { searchProfiles }
}
