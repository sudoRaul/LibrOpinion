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

export const REPORT_REASONS = [
  'Insultos o acoso',
  'Spam',
  'Contenido inapropiado',
  'Suplantación de identidad',
  'Otro',
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

async function submit(reason: string, detail: string): Promise<{ error: string | null }> {
  const auth = useAuthStore()
  if (!auth.user || !target.value) return { error: 'No se pudo enviar el reporte.' }
  const t = target.value

  const { error } = await supabase.from('reports').insert({
    reporter_id: auth.user.id,
    reported_id: t.reportedId,
    target_type: t.type,
    target_id: t.targetId ?? null,
    reason,
    detail: detail.trim() || null,
  })
  if (error) return { error: 'No se pudo enviar el reporte. Inténtalo de nuevo.' }
  return { error: null }
}

export function useReport() {
  return { open, target, report, close, submit }
}
