import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

export type ProfileHit = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'username' | 'display_name' | 'avatar_url'
>

export function useProfileSearch() {
  /** Busca lectores por @usuario o nombre. */
  async function searchProfiles(query: string): Promise<ProfileHit[]> {
    const q = query.trim()
    if (q.length < 2) return []
    const pattern = `%${q.replace(/[,()]/g, ' ')}%`
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
      .not('username', 'is', null)
      .limit(8)
    if (error) return []
    return data ?? []
  }

  return { searchProfiles }
}
