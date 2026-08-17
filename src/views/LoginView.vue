<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import AuthShell from '../components/AuthShell.vue'
import AppTextField from '../components/AppTextField.vue'
import GoogleButton from '../components/GoogleButton.vue'

const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const googleLoading = ref(false)

async function onSubmit() {
  error.value = null
  loading.value = true
  const { error: err } = await auth.signInWithPassword(email.value.trim(), password.value)
  loading.value = false
  if (err) {
    error.value = err
    return
  }
  // El guard redirige a onboarding si aún no hay username.
  router.push('/app')
}

async function onGoogle() {
  error.value = null
  googleLoading.value = true
  const { error: err } = await auth.signInWithGoogle()
  if (err) {
    error.value = err
    googleLoading.value = false
  }
  // Si va bien, el navegador redirige a Google (no hace falta apagar el loading).
}
</script>

<template>
  <AuthShell :title="t('auth.login.title')" :subtitle="t('auth.login.subtitle')">
    <form class="space-y-4" @submit.prevent="onSubmit">
      <p
        v-if="error"
        class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      >
        {{ t(error) }}
      </p>

      <AppTextField
        id="email"
        v-model="email"
        :label="t('auth.fields.emailLabel')"
        type="email"
        autocomplete="email"
        :placeholder="t('auth.fields.emailPlaceholder')"
        :disabled="loading"
      />
      <AppTextField
        id="password"
        v-model="password"
        :label="t('auth.fields.passwordLabel')"
        type="password"
        autocomplete="current-password"
        :placeholder="t('auth.fields.passwordPlaceholder')"
        :disabled="loading"
      />

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        {{ loading ? t('auth.login.submitting') : t('auth.login.submit') }}
      </button>
    </form>

    <div class="my-6 flex items-center gap-3 text-xs text-stone-400">
      <span class="h-px flex-1 bg-stone-200 dark:bg-stone-700"></span>
      {{ t('common.or') }}
      <span class="h-px flex-1 bg-stone-200 dark:bg-stone-700"></span>
    </div>

    <GoogleButton :loading="googleLoading" :label="t('auth.google')" @click="onGoogle" />

    <template #footer>
      {{ t('auth.login.noAccount') }}
      <RouterLink to="/signup" class="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
        {{ t('auth.login.createAccount') }}
      </RouterLink>
    </template>
  </AuthShell>
</template>
