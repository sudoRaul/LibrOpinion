import { useI18n } from 'vue-i18n'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { SUPPORTED_LOCALES, applyLocale, type Locale } from '../i18n'

// Cambia el idioma de la app y, si hay sesión, lo guarda en el perfil para que
// viaje entre dispositivos.
export function useLocale() {
  const { locale } = useI18n()

  async function setLocale(l: Locale) {
    applyLocale(l)
    const auth = useAuthStore()
    if (auth.user) {
      await supabase.from('profiles').update({ locale: l }).eq('id', auth.user.id)
      if (auth.profile) auth.profile.locale = l
    }
  }

  return { locale, setLocale, locales: SUPPORTED_LOCALES }
}
