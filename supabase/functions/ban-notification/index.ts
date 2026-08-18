// Edge Function: ban-notification
// Se dispara con un Database Webhook en `profiles` (UPDATE). Envía un correo al
// usuario cuando su cuenta se BANEA (con el motivo) y otro cuando se RESTABLECE.

interface ProfileRecord {
  id: string
  username: string | null
  display_name: string | null
  is_banned: boolean
  ban_reason: string | null
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: ProfileRecord | null
  old_record: ProfileRecord | null
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
// Con dominio propio verificado en Resend, cambia esto por un secreto. Con el
// remitente de pruebas solo se puede enviar al correo dueño de la cuenta Resend.
const FROM_EMAIL = Deno.env.get('BAN_FROM_EMAIL') ?? 'librOpinion <onboarding@resend.dev>'
// A dónde llegan las respuestas del usuario (tu correo de admin).
const REPLY_TO = Deno.env.get('ADMIN_EMAIL') ?? null
// Secreto compartido con el Database Webhook. Sin él, la función es un endpoint
// abierto y cualquiera podría disparar correos de "suspensión" falsos.
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? ''

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Comparación en tiempo constante (evita fugar el secreto por timing).
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  if (ab.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i]
  return diff === 0
}

// Email del usuario (vive en auth.users, no en profiles): lo pedimos a la Admin API.
async function fetchUserEmail(id: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
  })
  if (!res.ok) return null
  const user = (await res.json()) as { email?: string }
  return user.email ?? null
}

function banEmail(r: ProfileRecord): { subject: string; html: string } {
  const reason = r.ban_reason?.trim() || 'Incumplimiento de las normas de la comunidad.'
  const name = r.display_name || (r.username ? `@${r.username}` : 'Hola')
  return {
    subject: 'Tu cuenta en librOpinion ha sido suspendida',
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
        <h2 style="margin:0 0 4px">Tu cuenta ha sido suspendida</h2>
        <p style="color:#78716c;margin:0 0 20px">${esc(name)}, tu cuenta en librOpinion ha sido suspendida.</p>
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:12px;padding:14px 16px">
          <p style="margin:0;font-size:13px;color:#b91c1c;font-weight:600">Motivo</p>
          <p style="margin:6px 0 0;white-space:pre-wrap">${esc(reason)}</p>
        </div>
        <p style="margin:20px 0 0;color:#57534e;font-size:14px">
          Si crees que se trata de un error, responde a este correo y lo revisaremos.
        </p>
        <p style="color:#a8a29e;font-size:12px;margin-top:24px">librOpinion · Moderación</p>
      </div>
    `,
  }
}

function restoreEmail(r: ProfileRecord): { subject: string; html: string } {
  const name = r.display_name || (r.username ? `@${r.username}` : 'Hola')
  return {
    subject: 'Tu cuenta en librOpinion ha sido restablecida',
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
        <h2 style="margin:0 0 4px">Tu cuenta ha sido restablecida</h2>
        <p style="color:#78716c;margin:0 0 20px">${esc(name)}, tu cuenta en librOpinion vuelve a estar activa. ¡Bienvenido de nuevo!</p>
        <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:12px;padding:14px 16px">
          <p style="margin:0;font-size:13px;color:#15803d;font-weight:600">Un recordatorio</p>
          <p style="margin:6px 0 0">
            Para mantener una comunidad sana, recuerda seguir las normas: trata a los demás con respeto,
            nada de insultos, acoso ni spam. Gracias por formar parte de librOpinion.
          </p>
        </div>
        <p style="color:#a8a29e;font-size:12px;margin-top:24px">librOpinion · Moderación</p>
      </div>
    `,
  }
}

Deno.serve(async (req) => {
  try {
    // Autenticación del webhook: solo el Database Webhook (que envía el header
    // secreto) puede invocar esta función. Falla cerrada si no hay secreto.
    const provided = req.headers.get('x-webhook-secret') ?? ''
    if (!WEBHOOK_SECRET || !timingSafeEqual(provided, WEBHOOK_SECRET)) {
      return new Response('unauthorized', { status: 401 })
    }

    const payload = (await req.json()) as WebhookPayload
    const r = payload.record
    const old = payload.old_record
    const isProfileUpdate = payload.type === 'UPDATE' && payload.table === 'profiles' && !!r

    const justBanned = isProfileUpdate && r!.is_banned === true && old?.is_banned !== true
    const justUnbanned = isProfileUpdate && r!.is_banned === false && old?.is_banned === true
    if (!justBanned && !justUnbanned) return new Response('ignored', { status: 200 })

    const email = await fetchUserEmail(r!.id)
    if (!email) {
      console.error('No se encontró el email del usuario', r!.id)
      return new Response('no email', { status: 200 })
    }

    const { subject, html } = justBanned ? banEmail(r!) : restoreEmail(r!)

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject,
        html,
        ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
      }),
    })

    if (!emailRes.ok) {
      const body = await emailRes.text()
      console.error('Resend error', emailRes.status, body)
      return new Response(`resend error: ${emailRes.status}`, { status: 500 })
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('ban-notification failed', err)
    return new Response('error', { status: 500 })
  }
})
