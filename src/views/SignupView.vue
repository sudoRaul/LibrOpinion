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
const confirmationSent = ref(false)
const accepted = ref(false)

async function onSubmit() {
  error.value = null
  if (!accepted.value) {
    error.value = 'auth.err.consentRequired'
    return
  }
  if (password.value.length < 6) {
    error.value = 'auth.err.passwordShort'
    return
  }
  loading.value = true
  const { error: err, needsConfirmation } = await auth.signUp(email.value.trim(), password.value)
  loading.value = false
  if (err) {
    error.value = err
    return
  }
  if (needsConfirmation) {
    confirmationSent.value = true
    return
  }
  // Sesión creada al instante ⇒ el guard nos lleva al onboarding.
  router.push('/app')
}

async function onGoogle() {
  error.value = null
  if (!accepted.value) {
    error.value = 'auth.err.consentRequired'
    return
  }
  googleLoading.value = true
  const { error: err } = await auth.signInWithGoogle()
  if (err) {
    error.value = err
    googleLoading.value = false
  }
}
</script>

<template>
  <AuthShell :title="t('auth.signup.title')" :subtitle="t('auth.signup.subtitle')">
    <!-- Estado: email de confirmación enviado -->
    <div v-if="confirmationSent" class="text-center">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16v16H4zM4 7l8 6 8-6" />
        </svg>
      </div>
      <i18n-t keypath="auth.signup.confirmBody" tag="p" class="mt-4 text-stone-700 dark:text-stone-300" scope="global">
        <template #email>
          <span class="font-medium text-stone-900 dark:text-white">{{ email }}</span>
        </template>
      </i18n-t>
      <RouterLink
        to="/login"
        class="mt-6 inline-block rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        {{ t('auth.signup.goLogin') }}
      </RouterLink>
    </div>

    <!-- Formulario de registro -->
    <template v-else>
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
          autocomplete="new-password"
          :placeholder="t('auth.fields.passwordPlaceholder')"
          :hint="t('auth.fields.passwordHint')"
          :disabled="loading"
        />

        <label class="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-400">
          <input
            v-model="accepted"
            type="checkbox"
            class="mt-0.5 h-4 w-4 flex-none accent-emerald-600"
            :disabled="loading"
          />
          <span>
            <i18n-t keypath="auth.signup.consent" scope="global">
              <template #terms>
                <RouterLink to="/terminos" target="_blank" class="font-medium text-emerald-700 hover:underline dark:text-emerald-400">{{ t('legal.terms.linkLabel') }}</RouterLink>
              </template>
              <template #privacy>
                <RouterLink to="/privacidad" target="_blank" class="font-medium text-emerald-700 hover:underline dark:text-emerald-400">{{ t('legal.privacy.linkLabel') }}</RouterLink>
              </template>
            </i18n-t>
          </span>
        </label>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {{ loading ? t('auth.signup.submitting') : t('auth.signup.submit') }}
        </button>
      </form>

      <div class="my-6 flex items-center gap-3 text-xs text-stone-400">
        <span class="h-px flex-1 bg-stone-200 dark:bg-stone-700"></span>
        {{ t('common.or') }}
        <span class="h-px flex-1 bg-stone-200 dark:bg-stone-700"></span>
      </div>

      <GoogleButton :loading="googleLoading" :label="t('auth.google')" @click="onGoogle" />
    </template>

    <template #footer>
      {{ t('auth.signup.haveAccount') }}
      <RouterLink to="/login" class="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
        {{ t('auth.signup.login') }}
      </RouterLink>
    </template>
  </AuthShell>
</template>
