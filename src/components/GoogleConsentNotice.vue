<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <!-- Aviso pasivo de consentimiento para login/registro con Google (estándar
       de la industria: no se puede interceptar el redirect con un checkbox). -->
  <p class="mt-3 text-center text-xs leading-relaxed text-stone-500 dark:text-stone-400">
    <i18n-t keypath="auth.googleConsent" scope="global">
      <template #terms>
        <RouterLink to="/terminos" target="_blank" class="font-medium text-emerald-700 hover:underline dark:text-emerald-400">{{ t('legal.terms.linkLabel') }}</RouterLink>
      </template>
      <template #privacy>
        <RouterLink to="/privacidad" target="_blank" class="font-medium text-emerald-700 hover:underline dark:text-emerald-400">{{ t('legal.privacy.linkLabel') }}</RouterLink>
      </template>
    </i18n-t>
  </p>
</template>
