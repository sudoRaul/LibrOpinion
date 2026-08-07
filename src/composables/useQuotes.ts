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

  /**
   * Edita una cita propia. La seguridad la impone RLS (`quotes_update_own`):
   * si el id no es del usuario, no se actualiza ninguna fila y `.single()` falla.
   */
  async function updateQuote(
    id: string,
    input: { content: string; page: number | null; note: string | null },
  ): Promise<{ quote: FeedQuote | null; error: string | null }> {
    const { data, error } = await supabase
      .from('quotes')
      .update({
        content: input.content.trim(),
        page: input.page,
        note: input.note,
      })
      .eq('id', id)
      .select(QUOTE_COLUMNS)
      .single()

    if (error) {
      // PGRST116 = ninguna fila afectada ⇒ no era tuya (RLS) o no existe.
      if (error.code === 'PGRST116') return { quote: null, error: 'No puedes editar esta cita.' }
      return { quote: null, error: error.message }
    }
    return { quote: data, error: null }
  }

  /** Borra una cita propia. RLS (`quotes_delete_own`) garantiza que solo la tuya. */
  async function deleteQuote(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    return { error: error ? error.message : null }
  }

  return { createQuote, updateQuote, deleteQuote }
}
