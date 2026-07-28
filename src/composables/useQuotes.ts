import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { QUOTE_COLUMNS, type FeedQuote } from './useFeed'

export function useQuotes() {
  /** Publica una cita propia. user_id sale de la sesión (RLS: auth.uid() = user_id). */
  async function createQuote(input: {
    bookId: string
    content: string
    page: number | null
    note: string | null
  }): Promise<{ quote: FeedQuote | null; error: string | null }> {
    const auth = useAuthStore()
    if (!auth.user) return { quote: null, error: 'No hay ninguna sesión activa.' }

    const { data, error } = await supabase
      .from('quotes')
      .insert({
        user_id: auth.user.id,
        book_id: input.bookId,
        content: input.content.trim(),
        page: input.page,
        note: input.note,
      })
      .select(QUOTE_COLUMNS)
      .single()

    if (error) return { quote: null, error: error.message }
    return { quote: data, error: null }
  }

  return { createQuote }
}
