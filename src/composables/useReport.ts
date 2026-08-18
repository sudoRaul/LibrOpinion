import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

export type ReportTargetType = 'user' | 'quote' | 'comment'

export interface ReportTarget {
  type: ReportTargetType
  reportedId: string // autor reportado (perfil)
  targetId?: string | null // id de la cita/comentario (null si es el usuario)
  label?: string // texto de contexto para el modal (@usuario, extracto…)
}

// Códigos canónicos (se guardan en la BD). La etiqueta visible se traduce en la
// UI con `report.reasons.<code>`, así el admin puede mostrarlos en su idioma.
export const REPORT_REASONS = [
  'harassment',
  'spam',
  'inappropriate',
  'impersonation',
  'other',
] as const

// Estado singleton: un único modal de reporte para toda la app.
const open = ref(false)
const target = ref<ReportTarget | null>(null)

function report(t: ReportTarget) {
  target.value = t
  open.value = true
}
function close() {
  open.value = false
}

// Devuelve una clave i18n en `error` (la UI la traduce con t()).
async function submit(reason: string, detail: string): Promise<{ error: string | null }> {
  const auth = useAuthStore()
  if (!auth.user || !target.value) return { error: 'report.errSend' }
  const t = target.value

  const { error } = await supabase.from('reports').insert({
    reporter_id: auth.user.id,
    reported_id: t.reportedId,
    target_type: t.type,
    target_id: t.targetId ?? null,
    reason,
    detail: detail.trim() || null,
  })
  if (error) {
    // Tokens del trigger de rate-limit (fix M-4).
    if (error.message.includes('report_duplicate')) return { error: 'report.errDuplicate' }
    if (error.message.includes('report_rate_limit')) return { error: 'report.errRateLimit' }
    return { error: 'report.errSend' }
  }
  return { error: null }
}

export function useReport() {
  return { open, target, report, close, submit }
}
