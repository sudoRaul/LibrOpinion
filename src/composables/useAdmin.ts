import { ref } from 'vue'
import type { QueryData } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Reporte + perfiles embebidos (reportante y reportado). La lectura la permite la
// política RLS reports_select_admin (solo si is_admin()).
const REPORT_COLUMNS = `
  id, reason, detail, status, target_type, target_id, created_at,
  reporter:profiles!reports_reporter_id_fkey ( id, username, display_name, avatar_url ),
  reported:profiles!reports_reported_id_fkey ( id, username, display_name, avatar_url, is_banned )
` as const

const _typeQuery = supabase.from('reports').select(REPORT_COLUMNS)
export type AdminReport = QueryData<typeof _typeQuery>[number]

export type ReportFilter = 'pending' | 'all'

// Estado singleton del panel.
const reports = ref<AdminReport[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const filter = ref<ReportFilter>('pending')

async function load() {
  loading.value = true
  error.value = null

  let query = supabase.from('reports').select(REPORT_COLUMNS).order('created_at', { ascending: false })
  if (filter.value === 'pending') query = query.eq('status', 'pending')

  const { data, error: err } = await query
  loading.value = false
  if (err) {
    error.value = 'No se pudieron cargar los reportes.'
    return
  }
  reports.value = data ?? []
}

function setFilter(f: ReportFilter) {
  if (filter.value === f) return
  filter.value = f
  void load()
}

/** Banea o desbanea al usuario reportado (RPC controlada por is_admin()). */
async function setBan(targetId: string, banned: boolean): Promise<{ error: string | null }> {
  const { error: err } = await supabase.rpc('admin_set_ban', {
    p_target: targetId,
    p_banned: banned,
  })
  if (err) return { error: 'No se pudo actualizar el baneo.' }
  // Refleja el nuevo estado en todos los reportes de ese usuario.
  for (const r of reports.value) {
    if (r.reported?.id === targetId) r.reported.is_banned = banned
  }
  return { error: null }
}

/** Marca un reporte como revisado o descartado. */
async function reviewReport(
  reportId: string,
  status: 'reviewed' | 'dismissed',
): Promise<{ error: string | null }> {
  const { error: err } = await supabase.rpc('admin_review_report', {
    p_report_id: reportId,
    p_status: status,
  })
  if (err) return { error: 'No se pudo actualizar el reporte.' }

  if (filter.value === 'pending') {
    // En la vista "pendientes" desaparece de la lista.
    reports.value = reports.value.filter((r) => r.id !== reportId)
  } else {
    const r = reports.value.find((x) => x.id === reportId)
    if (r) r.status = status
  }
  return { error: null }
}

export function useAdmin() {
  return { reports, loading, error, filter, load, setFilter, setBan, reviewReport }
}
