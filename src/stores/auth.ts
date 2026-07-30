import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    session: null,
    user: null,
    profile: null,
    loading: true,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.session !== null,
    // Con sesión pero sin username elegido → hay que pasar por el onboarding.
    // Si el profile aún no ha cargado (null) también lo tratamos como pendiente.
    needsOnboarding: (state): boolean =>
      state.session !== null &&
      (state.profile === null || state.profile.username === null),
  },

  actions: {
    /** Carga el profile del usuario actual (o lo limpia si no hay sesión). */
    async fetchProfile() {
      if (!this.user) {
        this.profile = null
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single()

      // PGRST116 = no hay fila; dejamos profile en null (el trigger debería haberla creado).
      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando el profile:', error.message)
      }
      this.profile = data ?? null
    },

    /**
     * Inicializa la sesión: lee la actual, se suscribe a los cambios de auth
     * y carga el profile. Llamar una sola vez antes de montar la app.
     */
    async init() {
      this.loading = true
      const { data } = await supabase.auth.getSession()
      this.session = data.session
      this.user = data.session?.user ?? null
      await this.fetchProfile()
      this.loading = false

      // Mantiene la sesión sincronizada (login, logout, refresh de token, OAuth).
      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user ?? null
        // No await dentro del callback: refrescamos el profile en segundo plano.
        void this.fetchProfile()
      })
    },

    async signOut() {
      await supabase.auth.signOut()
      // onAuthStateChange limpiará session/user; forzamos también aquí por claridad.
      this.session = null
      this.user = null
      this.profile = null
    },

    /** Registro con email/contraseña. needsConfirmation = hay que confirmar por email. */
    async signUp(
      email: string,
      password: string,
    ): Promise<{ error: string | null; needsConfirmation: boolean }> {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: translateAuthError(error.message), needsConfirmation: false }
      // Por seguridad NO revelamos si el email ya existe (evita enumeración de correos):
      // mostramos siempre el mismo mensaje neutro cuando no hay sesión inmediata.
      // - Email nuevo  → llega el correo de confirmación.
      // - Email usado  → no llega correo, pero el mensaje contempla "inicia sesión".
      return { error: null, needsConfirmation: data.session === null }
    },

    /** Login con email/contraseña. */
    async signInWithPassword(email: string, password: string): Promise<{ error: string | null }> {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ? translateAuthError(error.message) : null }
    },

    /** Login con Google (OAuth). Redirige fuera de la app; la sesión se detecta al volver. */
    async signInWithGoogle(): Promise<{ error: string | null }> {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      return { error: error ? translateAuthError(error.message) : null }
    },

    /** Elige el username en el onboarding (RLS permite editar el propio profile). */
    async updateUsername(username: string): Promise<{ error: string | null }> {
      if (!this.user) return { error: 'No hay ninguna sesión activa.' }
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', this.user.id)
      if (error) {
        // 23505 = violación de UNIQUE (username ya usado).
        if (error.code === '23505') return { error: 'Ese nombre de usuario ya está en uso.' }
        return { error: error.message }
      }
      await this.fetchProfile()
      return { error: null }
    },

    /** Edita el propio profile (RLS: update donde auth.uid() = id). */
    async updateProfile(fields: {
      username: string
      display_name: string | null
      bio: string | null
      avatar_url: string | null
    }): Promise<{ error: string | null }> {
      if (!this.user) return { error: 'No hay ninguna sesión activa.' }
      const { error } = await supabase
        .from('profiles')
        .update({
          username: fields.username,
          display_name: fields.display_name,
          bio: fields.bio,
          avatar_url: fields.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.user.id)
      if (error) {
        if (error.code === '23505') return { error: 'Ese nombre de usuario ya está en uso.' }
        return { error: error.message }
      }
      await this.fetchProfile()
      return { error: null }
    },
  },
})

/** Traduce los mensajes de error más comunes de Supabase Auth al español. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (m.includes('user already registered')) return 'Ese email ya está registrado.'
  if (m.includes('password should be at least'))
    return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('unable to validate email address')) return 'El email no es válido.'
  if (m.includes('email rate limit')) return 'Demasiados intentos. Prueba de nuevo en un rato.'
  return message
}
