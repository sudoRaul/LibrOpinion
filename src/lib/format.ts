import { i18n } from '../i18n'

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
]

// Cacheamos un formateador por idioma (crear uno es relativamente caro).
const formatters = new Map<string, Intl.RelativeTimeFormat>()
function rtfFor(locale: string): Intl.RelativeTimeFormat {
  let rtf = formatters.get(locale)
  if (!rtf) {
    rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    formatters.set(locale, rtf)
  }
  return rtf
}

/** "hace 2 horas" / "2 hours ago", "ayer" / "yesterday", etc. desde un ISO. */
export function timeAgo(iso: string): string {
  const rtf = rtfFor(i18n.global.locale.value)
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSeconds)
  for (const [unit, secs] of UNITS) {
    if (abs >= secs || unit === 'second') {
      return rtf.format(Math.round(diffSeconds / secs), unit)
    }
  }
  return ''
}
