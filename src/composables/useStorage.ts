import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

type UploadResult = { url: string | null; error: string | null }

function validate(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'El archivo debe ser una imagen.'
  if (file.size > MAX_BYTES) return 'La imagen no puede superar 2 MB.'
  return null
}

function extOf(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext && ext.length <= 5 ? ext : 'jpg'
}

async function uploadTo(bucket: string, prefix: string, file: File): Promise<UploadResult> {
  const auth = useAuthStore()
  if (!auth.user) return { url: null, error: 'No hay ninguna sesión activa.' }

  const invalid = validate(file)
  if (invalid) return { url: null, error: invalid }

  // La ruta empieza por <uid>/ para cumplir la policy (carpeta propia en avatars).
  const path = `${auth.user.id}/${prefix}-${Date.now()}.${extOf(file)}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: true })
  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export function useStorage() {
  const uploadAvatar = (file: File) => uploadTo('avatars', 'avatar', file)
  const uploadCover = (file: File) => uploadTo('covers', 'cover', file)
  return { uploadAvatar, uploadCover }
}
