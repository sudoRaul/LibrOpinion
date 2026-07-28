import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

export type Book = Database['public']['Tables']['books']['Row']

export function useBooks() {
  /** Busca libros del catálogo colaborativo por título o autor. */
  async function searchBooks(query: string): Promise<Book[]> {
    const q = query.trim()
    if (q.length < 2) return []
    // Los caracteres ,() romperían el filtro .or() de PostgREST: los neutralizamos.
    const pattern = `%${q.replace(/[,()]/g, ' ')}%`
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(`title.ilike.${pattern},author.ilike.${pattern}`)
      .order('title')
      .limit(8)
    if (error) return []
    return data ?? []
  }

  /** Crea un libro nuevo (RLS: insert permitido a cualquier autenticado). */
  async function createBook(input: {
    title: string
    author: string
    cover_url?: string | null
  }): Promise<{ book: Book | null; error: string | null }> {
    const { data, error } = await supabase
      .from('books')
      .insert({
        title: input.title.trim(),
        author: input.author.trim(),
        cover_url: input.cover_url?.trim() || null,
      })
      .select('*')
      .single()
    if (error) return { book: null, error: error.message }
    return { book: data, error: null }
  }

  return { searchBooks, createBook }
}
