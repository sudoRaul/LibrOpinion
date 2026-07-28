<script setup lang="ts">
defineProps<{
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
        :type="type ?? 'text'"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :class="[
          'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-emerald-500',
          prefix ? 'pl-7' : '',
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <p v-if="hint" class="mt-1.5 text-xs text-stone-500 dark:text-stone-400">{{ hint }}</p>
  </div>
</template>
