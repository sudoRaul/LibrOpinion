// Edge Function: report-notification
// Se dispara con un Database Webhook cuando se INSERTA una fila en `reports`.
// Resuelve los usernames del reportante y del reportado y envía un correo al admin vía Resend.

interface ReportRecord {
  id: string
  reporter_id: string
  reported_id: string
  target_type: 'user' | 'quote' | 'comment'
  target_id: string | null
  reason: string
  detail: string | null
  status: string
  created_at: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: ReportRecord | null
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')!
// Remitente: para pruebas vale onboarding@resend.dev; con dominio propio cámbialo por un secreto.
const FROM_EMAIL = Deno.env.get('REPORT_FROM_EMAIL') ?? 'librOpinion <onboarding@resend.dev>'

const TARGET_LABEL: Record<string, string> = {
  user: 'Perfil de usuario',
  quote: 'Cita',
  comment: 'Comentario',
}

// Lee un perfil (username + display_name) con la service role (salta RLS).
async function fetchProfile(id: string): Promise<{ username: string | null; display_name: string | null }> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}&select=username,display_name`,
    {
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
    },
  )
  const rows = (await res.json()) as Array<{ username: string | null; display_name: string | null }>
  return rows[0] ?? { username: null, display_name: null }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload
    const r = payload.record
    if (payload.type !== 'INSERT' || payload.table !== 'reports' || !r) {
      return new Response('ignored', { status: 200 })
    }

    const [reporter, reported] = await Promise.all([
      fetchProfile(r.reporter_id),
      fetchProfile(r.reported_id),
    ])

    const reporterName = reporter.username ? `@${reporter.username}` : r.reporter_id
    const reportedName = reported.username ? `@${reported.username}` : r.reported_id
    const typeLabel = TARGET_LABEL[r.target_type] ?? r.target_type

    // Enlace útil: al perfil o al permalink de la cita (si es cita).
    const link =
      r.target_type === 'quote' && r.target_id
        ? `Cita: /q/${r.target_id}`
        : reported.username
          ? `Perfil: /u/${reported.username}`
          : `Reportado: ${r.reported_id}`

    const subject = `🚩 Nuevo reporte: ${r.reason} — ${reportedName}`

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
        <h2 style="margin:0 0 4px">Nuevo reporte en librOpinion</h2>
        <p style="color:#78716c;margin:0 0 20px">Alguien ha reportado contenido. Revísalo cuando puedas.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#78716c;width:120px">Motivo</td><td style="padding:8px 0;font-weight:600">${esc(r.reason)}</td></tr>
          <tr><td style="padding:8px 0;color:#78716c">Tipo</td><td style="padding:8px 0">${esc(typeLabel)}</td></tr>
          <tr><td style="padding:8px 0;color:#78716c">Reportado</td><td style="padding:8px 0">${esc(reportedName)}${reported.display_name ? ` (${esc(reported.display_name)})` : ''}</td></tr>
          <tr><td style="padding:8px 0;color:#78716c">Reportante</td><td style="padding:8px 0">${esc(reporterName)}</td></tr>
          <tr><td style="padding:8px 0;color:#78716c">Referencia</td><td style="padding:8px 0">${esc(link)}</td></tr>
          ${r.detail ? `<tr><td style="padding:8px 0;color:#78716c;vertical-align:top">Detalle</td><td style="padding:8px 0;white-space:pre-wrap">${esc(r.detail)}</td></tr>` : ''}
        </table>
        <p style="color:#a8a29e;font-size:12px;margin-top:24px">Reporte ${r.id} · ${r.created_at}</p>
      </div>
    `

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    })

    if (!emailRes.ok) {
      const body = await emailRes.text()
      console.error('Resend error', emailRes.status, body)
      return new Response(`resend error: ${emailRes.status}`, { status: 500 })
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('report-notification failed', err)
    return new Response('error', { status: 500 })
  }
})
