import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import es from '../locales/es.json'

export const SUPPORTED_LOCALES = ['en', 'es'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

// Fallback de vue-i18n para claves ausentes (los catálogos están completos, así
// que rara vez aplica). El idioma que ve el usuario lo decide detectLocale().
const FALLBACK: Locale = 'en'

export function isSupportedLocale(l: string | null | undefined): l is Locale {
  return !!l && (SUPPORTED_LOCALES as readonly string[]).includes(l)
}

/**
 * Idioma inicial:
 * 1. Preferencia guardada (localStorage) si es válida.
 * 2. Si el navegador está en español → español.
 * 3. En cualquier otro caso → inglés.
 */
function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem('locale')
    if (isSupportedLocale(stored)) return stored
  } catch {
    // localStorage no disponible: seguimos con la detección del navegador.
  }
  const nav = navigator.language?.slice(0, 2).toLowerCase()
  return nav === 'es' ? 'es' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: FALLBACK,
  messages: { en, es },
})

/** Aplica un idioma a la app: i18n + localStorage + atributo <html lang>. */
export function applyLocale(locale: string) {
  if (!isSupportedLocale(locale)) return
  i18n.global.locale.value = locale
  try {
    localStorage.setItem('locale', locale)
  } catch {
    // Ignoramos si no se puede persistir.
  }
  document.documentElement.lang = locale
}

// Fija el lang del documento con el idioma resuelto al arrancar.
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.global.locale.value
}
