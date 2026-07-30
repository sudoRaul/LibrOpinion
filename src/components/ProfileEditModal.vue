<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useStorage } from '../composables/useStorage'
import type { Profile } from '../composables/useProfile'
import AppTextField from './AppTextField.vue'

const props = defineProps<{ open: boolean; profile: Profile }>()
const emit = defineEmits<{ close: []; updated: [username: string] }>()

const auth = useAuthStore()
const { uploadAvatar } = useStorage()

const username = ref('')
const displayName = ref('')
const bio = ref('')
const avatarUrl = ref('')
const error = ref<string | null>(null)
const saving = ref(false)
const uploading = ref(false)

async function onAvatarFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // permite re-subir el mismo archivo
  if (!file) return

  error.value = null
  uploading.value = true
  const { url, error: err } = await uploadAvatar(file)
  uploading.value = false
  if (err || !url) {
    error.value = err ?? 'No se pudo subir la imagen.'
    return
  }
  avatarUrl.value = url
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/

// Rellena el formulario con los datos actuales cada vez que se abre.
watch(
  () => props.open,
  (open) => {
    if (open) {
      username.value = props.profile.username ?? ''
      displayName.value = props.profile.display_name ?? ''
      bio.value = props.profile.bio ?? ''
      avatarUrl.value = props.profile.avatar_url ?? ''
      error.value = null
    }
  },
  { immediate: true },
)

async function submit() {
  error.value = null
  const uname = username.value.trim()

  if (!USERNAME_RE.test(uname)) {
    error.value = 'El usuario debe tener 3-30 caracteres: letras, números y guion bajo.'
    return
  }

  saving.value = true
  const { error: err } = await auth.updateProfile({
    username: uname,
    display_name: displayName.value.trim() || null,
    bio: bio.value.trim() || null,
    avatar_url: avatarUrl.value.trim() || null,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  emit('updated', uname)
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-sm sm:items-center"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div
        class="my-8 w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
        role="dialog"
        aria-modal="true"
        aria-label="Editar perfil"
      >
        <div class="mb-5 flex items-center justify-between">
          <h2 class="font-display text-2xl font-semibold text-stone-900 dark:text-white">Editar perfil</h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <p
            v-if="error"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {{ error }}
          </p>

          <div class="flex items-center gap-4">
            <img
              v-if="avatarUrl.trim()"
              :src="avatarUrl.trim()"
              alt="Vista previa del avatar"
              class="h-16 w-16 rounded-full object-cover"
              referrerpolicy="no-referrer"
            />
            <div
              v-else
              class="flex h-16 w-16 items-center justify-center rounded-full bg-stone-200 text-stone-400 dark:bg-stone-700 dark:text-stone-500"
            >
              <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </div>
            <div>
              <label
                class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                :class="uploading ? 'pointer-events-none opacity-60' : ''"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                {{ uploading ? 'Subiendo…' : 'Subir imagen' }}
                <input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="onAvatarFile" />
              </label>
              <p class="mt-1 text-xs text-stone-400">JPG, PNG… máx. 2 MB.</p>
            </div>
          </div>

          <AppTextField
            id="displayName"
            v-model="displayName"
            label="Nombre"
            placeholder="Tu nombre visible"
            :disabled="saving"
          />
          <AppTextField
            id="username"
            v-model="username"
            label="Nombre de usuario"
            prefix="@"
            hint="Entre 3 y 30 caracteres. Cambiarlo modifica la URL de tu perfil."
            :disabled="saving"
          />

          <div>
            <label for="bio" class="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Bio <span class="font-normal text-stone-400">(opcional)</span>
            </label>
            <textarea
              id="bio"
              v-model="bio"
              rows="3"
              placeholder="Cuéntale al mundo qué lees…"
              class="w-full resize-y rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
            ></textarea>
          </div>

          <AppTextField
            id="avatarUrl"
            v-model="avatarUrl"
            label="URL del avatar"
            type="url"
            placeholder="https://…"
            hint="La subida de imágenes llegará con Storage. De momento, una URL."
            :disabled="saving"
          />

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
              @click="emit('close')"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {{ saving ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
