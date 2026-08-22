<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ password: string }>()
const { t } = useI18n()

// Nivel 0 = vacío (no se muestra nada). 1..4 = Muy débil / Débil / Aceptable / Fuerte.
// Heurística sencilla (sin dependencias): longitud + variedad de caracteres.
const level = computed<number>(() => {
  const pw = props.password
  if (!pw) return 0
  if (pw.length < 8) return 1 // por debajo del mínimo → siempre "muy débil"

  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 2) return 2
  if (score <= 3) return 3
  return 4
})

const LABELS = ['', 'auth.password.veryWeak', 'auth.password.weak', 'auth.password.fair', 'auth.password.strong']
// Colores de relleno por nivel (barra) y de texto (etiqueta).
const BAR = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500']
const TEXT = [
  '',
  'text-red-600 dark:text-red-400',
  'text-orange-600 dark:text-orange-400',
  'text-amber-600 dark:text-amber-500',
  'text-emerald-600 dark:text-emerald-400',
]
</script>

<template>
  <div v-if="level > 0" class="mt-2">
    <div class="flex gap-1.5">
      <div
        v-for="i in 4"
        :key="i"
        class="h-1.5 flex-1 rounded-full transition-colors"
        :class="i <= level ? BAR[level] : 'bg-stone-200 dark:bg-stone-700'"
      ></div>
    </div>
    <p class="mt-1 text-xs" aria-live="polite">
      <span class="text-stone-500 dark:text-stone-400">{{ t('auth.password.strengthLabel') }}:</span>
      <span class="font-medium" :class="TEXT[level]"> {{ t(LABELS[level]) }}</span>
    </p>
  </div>
</template>
