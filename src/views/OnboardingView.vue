<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import AuthShell from '../components/AuthShell.vue'
import AppTextField from '../components/AppTextField.vue'

const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n()

const username = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/

async function onSubmit() {
  error.value = null
  const value = username.value.trim()

  if (!USERNAME_RE.test(value)) {
    error.value = 'auth.err.usernameFormat'
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
    :title="t('auth.onboarding.title')"
    :subtitle="t('auth.onboarding.subtitle')"
  >
    <form class="space-y-4" @submit.prevent="onSubmit">
      <p
        v-if="error"
        class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      >
        {{ t(error) }}
      </p>

      <AppTextField
        id="username"
        v-model="username"
        :label="t('auth.onboarding.usernameLabel')"
        autocomplete="off"
        :placeholder="t('auth.onboarding.usernamePlaceholder')"
        prefix="@"
        :hint="t('auth.onboarding.usernameHint')"
        :disabled="loading"
      />

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        {{ loading ? t('auth.onboarding.submitting') : t('auth.onboarding.submit') }}
      </button>
    </form>

    <template #footer>
      <button type="button" class="hover:underline" @click="onSignOut">
        {{ t('auth.onboarding.signOut') }}
      </button>
    </template>
  </AuthShell>
</template>
