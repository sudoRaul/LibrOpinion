<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthShell from '../components/AuthShell.vue'
import AppTextField from '../components/AppTextField.vue'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/

async function onSubmit() {
  error.value = null
  const value = username.value.trim()

  if (!USERNAME_RE.test(value)) {
    error.value =
      'Usa entre 3 y 30 caracteres: solo letras, números y guion bajo (_).'
    return
  }

  loading.value = true
  const { error: err } = await auth.updateUsername(value)
  loading.value = false
  if (err) {
    error.value = err
    return
  }
  router.push('/app')
}

async function onSignOut() {
  await auth.signOut()
  router.push('/login')
}
</script>

<template>
  <AuthShell
    title="Elige tu nombre de usuario"
    subtitle="Así te encontrarán otros lectores. Podrás cambiarlo más adelante."
  >
    <form class="space-y-4" @submit.prevent="onSubmit">
      <p
        v-if="error"
        class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      >
        {{ error }}
      </p>

      <AppTextField
        id="username"
        v-model="username"
        label="Nombre de usuario"
        autocomplete="off"
        placeholder="miguel_lector"
        prefix="@"
        hint="Entre 3 y 30 caracteres: letras, números y guion bajo."
        :disabled="loading"
      />

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        {{ loading ? 'Guardando…' : 'Continuar' }}
      </button>
    </form>

    <template #footer>
      <button type="button" class="hover:underline" @click="onSignOut">
        Cerrar sesión
      </button>
    </template>
  </AuthShell>
</template>
