import type { FeedQuote } from './useFeed'

// Genera una imagen "papel y tinta" de una cita, con la firma de librOpinion,
// y la comparte (Web Share API en móvil) o la descarga (escritorio).
// Todo en canvas: sin librerías y sin CORS (solo texto, nada de avatares/portadas).

// Lienzo cuadrado: es el formato más seguro para WhatsApp, Stories, etc.
const W = 1080
const H = 1080
const PAD = 110

interface Palette {
  paper: string
  frame: string
  ink: string
  muted: string
  accent: string
}

const LIGHT: Palette = {
  paper: '#f5efe3',
  frame: '#e4d9c4',
  ink: '#2c2620',
  muted: '#8b8173',
  accent: '#3f6b4f',
}

const DARK: Palette = {
  paper: '#1c1917',
  frame: '#3a332c',
  ink: '#f0e9db',
  muted: '#a8a094',
  accent: '#86b89a',
}

// La imagen respeta el tema activo de la app (clase `dark` en <html>).
function currentPalette(): Palette {
  return document.documentElement.classList.contains('dark') ? DARK : LIGHT
}

// Icono de libro (mismo path que la app), en viewBox 24×24.
const BOOK_PATHS = [
  'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z',
  'M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z',
]

// Precarga de fuentes: así, al pulsar, document.fonts.ready resuelve al instante
// (importante para no romper el "gesto de usuario" del compartir en iOS).
if (typeof document !== 'undefined' && document.fonts) {
  void document.fonts.load('500 58px Fraunces')
  void document.fonts.load('italic 500 34px Fraunces')
  void document.fonts.load('600 34px Fraunces')
  void document.fonts.load('400 26px Inter')
  void document.fonts.load('500 28px Inter')
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function fitOneLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
  return `${t}…`
}

function drawBookIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const s = size / 24
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.7
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (const d of BOOK_PATHS) ctx.stroke(new Path2D(d))
  ctx.restore()
}

async function buildBlob(quote: FeedQuote): Promise<Blob> {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const pal = currentPalette()

  // Fondo papel + marco sutil.
  ctx.fillStyle = pal.paper
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = pal.frame
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, W - 80, H - 80)

  const contentW = W - PAD * 2

  // Comilla decorativa grande.
  ctx.fillStyle = pal.ink
  ctx.globalAlpha = 0.1
  ctx.font = '700 220px Fraunces, serif'
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillText('“', PAD - 8, 300)
  ctx.globalAlpha = 1

  // Región donde vive el grupo cita+autor+libro.
  const regionTop = 300
  const regionBottom = 900
  const region = regionBottom - regionTop

  const author = quote.book?.author?.trim()
  const bookTitle = quote.book?.title?.trim()
  const bookLine = bookTitle
    ? `${bookTitle}${quote.page ? ` · pág. ${quote.page}` : ''}`
    : quote.page
      ? `pág. ${quote.page}`
      : ''

  const authorSize = 34
  const bookSize = 26
  const authorLineH = author ? authorSize * 1.3 : 0
  const bookLineH = bookLine ? bookSize * 1.3 : 0
  const gapQuoteAuthor = 46
  const gapAuthorBook = 14
  const belowQuote =
    (author ? authorLineH + gapQuoteAuthor : 0) +
    (bookLine ? bookLineH + (author ? gapAuthorBook : gapQuoteAuthor) : 0)
  const maxQuoteHeight = region - belowQuote

  // Ajuste tipográfico de la cita: encoge hasta que entre.
  let size = 58
  let lines: string[] = []
  let lineH = 0
  for (; size >= 30; size -= 2) {
    ctx.font = `500 ${size}px Fraunces, serif`
    lineH = size * 1.34
    lines = wrapLines(ctx, quote.content, contentW)
    if (lines.length * lineH <= maxQuoteHeight) break
  }
  // Cita muy larga: recorta a las líneas que quepan y añade puntos suspensivos.
  const maxLines = Math.max(1, Math.floor(maxQuoteHeight / lineH))
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
    lines[lines.length - 1] = fitOneLine(ctx, `${lines[lines.length - 1]}…`, contentW)
  }

  const quoteHeight = lines.length * lineH
  const groupHeight = quoteHeight + belowQuote
  let y = regionTop + (region - groupHeight) / 2

  // Cita.
  ctx.fillStyle = pal.ink
  ctx.font = `500 ${size}px Fraunces, serif`
  ctx.textBaseline = 'top'
  for (const ln of lines) {
    ctx.fillText(ln, PAD, y)
    y += lineH
  }

  // Autor del libro.
  if (author) {
    y += gapQuoteAuthor
    ctx.fillStyle = pal.ink
    ctx.font = `italic 500 ${authorSize}px Fraunces, serif`
    ctx.fillText(fitOneLine(ctx, `— ${author}`, contentW), PAD, y)
    y += authorLineH
  }

  // Título del libro (+ página).
  if (bookLine) {
    y += author ? gapAuthorBook : gapQuoteAuthor
    ctx.fillStyle = pal.muted
    ctx.font = `400 ${bookSize}px Inter, sans-serif`
    ctx.fillText(fitOneLine(ctx, bookLine, contentW), PAD, y)
  }

  // Pie: separador + firma.
  ctx.strokeStyle = pal.frame
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, 940)
  ctx.lineTo(W - PAD, 940)
  ctx.stroke()

  const footY = 972
  drawBookIcon(ctx, PAD, footY, 38, pal.accent)
  ctx.fillStyle = pal.accent
  ctx.font = '600 34px Fraunces, serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText('librOpinion', PAD + 50, footY + 19)

  const username = quote.author?.username
  if (username) {
    ctx.fillStyle = pal.muted
    ctx.font = '500 28px Inter, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`@${username}`, W - PAD, footY + 19)
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
}

export interface ShareResult {
  ok: boolean
  error?: string
}

async function shareQuote(quote: FeedQuote): Promise<ShareResult> {
  let blob: Blob
  try {
    blob = await buildBlob(quote)
  } catch {
    return { ok: false, error: 'No se pudo generar la imagen.' }
  }

  const authorSlug = (quote.book?.author ?? quote.author?.username ?? 'cita')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const filename = `libropinion-${authorSlug || 'cita'}.png`
  const file = new File([blob], filename, { type: 'image/png' })

  // Móvil: hoja de compartir del sistema.
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'librOpinion' })
      return { ok: true }
    } catch (e) {
      // El usuario canceló la hoja de compartir: no es un error.
      if (e instanceof DOMException && e.name === 'AbortError') return { ok: true }
      // Si share falla por otro motivo, caemos a la descarga.
    }
  }

  // Escritorio: descarga.
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { ok: true }
}

export function useShareImage() {
  return { shareQuote }
}
