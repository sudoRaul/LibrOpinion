// Netlify Edge Function: inyecta meta-tags Open Graph / Twitter en /q/:id.
// Los rastreadores sociales (WhatsApp, Twitter, Discord…) no ejecutan JS, así que
// la SPA por sí sola no genera preview. Aquí interceptamos la petición, leemos la
// cita desde Supabase (RLS solo deja ver las de cuentas públicas) y devolvemos el
// index.html con las tags rellenadas. Para el usuario normal, la SPA arranca igual.

import type { Context } from 'https://edge.netlify.com'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface QuoteRow {
  content: string | null
  page: number | null
  book: { title: string | null; author: string | null } | null
  author: { username: string | null; display_name: string | null } | null
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async (request: Request, context: Context): Promise<Response> => {
  const res = await context.next()
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) return res

  let html = await res.text()

  const url = new URL(request.url)
  const id = url.pathname.split('/').pop() ?? ''
  const site = url.origin

  // Valores por defecto (genéricos de la marca).
  let title = 'Una cita en librOpinion'
  let description = 'Las frases que te marcan, en una red social para lectores.'

  const SUPA = Netlify.env.get('SUPABASE_URL') ?? Netlify.env.get('VITE_SUPABASE_URL')
  const ANON = Netlify.env.get('SUPABASE_ANON_KEY') ?? Netlify.env.get('VITE_SUPABASE_ANON_KEY')

  if (id && UUID_RE.test(id) && SUPA && ANON) {
    try {
      const q = await fetch(
        `${SUPA}/rest/v1/quotes?id=eq.${id}&select=content,page,book:books(title,author),author:profiles!quotes_user_id_fkey(username,display_name)`,
        { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
      )
      const rows = (await q.json()) as QuoteRow[]
      const row = rows?.[0]
      if (row) {
        const content = (row.content ?? '').trim()
        const excerpt = content.length > 180 ? `${content.slice(0, 180)}…` : content
        title = `“${excerpt}”`

        const meta: string[] = []
        if (row.book?.author) meta.push(`— ${row.book.author}`)
        if (row.book?.title) meta.push(row.book.title)
        const poster = row.author?.username ? `@${row.author.username}` : null
        description = [
          meta.join(' · '),
          poster ? `Compartido por ${poster} en librOpinion` : 'En librOpinion',
        ]
          .filter(Boolean)
          .join('  ·  ')
      }
    } catch {
      // Si Supabase falla, dejamos las tags genéricas.
    }
  }

  const image = `${site}/og-cover.png`
  const tags = `
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="librOpinion" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(url.href)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
  `

  html = html.replace(/<title>.*?<\/title>/i, `<title>${esc(title)}</title>`)
  // Quita el bloque OG por defecto del index para no duplicar tags en el permalink.
  html = html.replace(/<!-- OG:DEFAULT:START -->[\s\S]*?<!-- OG:DEFAULT:END -->/, '')
  html = html.replace('</head>', `${tags}</head>`)

  const headers = new Headers(res.headers)
  headers.set('content-type', 'text/html; charset=utf-8')
  headers.delete('content-length')
  return new Response(html, { status: 200, headers })
}

export const config = { path: '/q/:id' }
