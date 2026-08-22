<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  id: string
  label: string
  type?: string
  modelValue: string
  placeholder?: string
  autocomplete?: string
  hint?: string
  prefix?: string
  disabled?: boolean
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()

// Toggle mostrar/ocultar solo para campos de contraseña.
const isPassword = computed(() => props.type === 'password')
const revealed = ref(false)
const inputType = computed(() =>
  isPassword.value ? (revealed.value ? 'text' : 'password') : (props.type ?? 'text'),
)
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
      {{ label }}
    </label>
    <div class="relative">
      <span
        v-if="prefix"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400"
      >
        {{ prefix }}
      </span>
      <input
        :id="id"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :class="[
          'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-emerald-500',
          prefix ? 'pl-7' : '',
          isPassword ? 'pr-11' : '',
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />

      <!-- Toggle libro cerrado/abierto = ocultar/mostrar contraseña -->
      <button
        v-if="isPassword"
        type="button"
        :disabled="disabled"
        :aria-label="revealed ? t('auth.password.hide') : t('auth.password.show')"
        :aria-pressed="revealed"
        class="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3 text-stone-400 transition-colors hover:text-emerald-700 focus:text-emerald-700 focus:outline-none disabled:opacity-60 dark:hover:text-emerald-400 dark:focus:text-emerald-400"
        @click="revealed = !revealed"
      >
        <!-- Libro abierto (contraseña visible) -->
        <svg
          v-if="revealed"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 7v14" />
          <path
            d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
          />
        </svg>
        <!-- Libro cerrado (contraseña oculta) -->
        <svg
          v-else
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </button>
    </div>
    <p v-if="hint" class="mt-1.5 text-xs text-stone-500 dark:text-stone-400">{{ hint }}</p>
  </div>
</template>
