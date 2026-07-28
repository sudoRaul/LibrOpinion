<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue'

defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="relative flex min-h-screen flex-col bg-linear-to-b from-stone-50 via-amber-50/30 to-stone-100 text-stone-800 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 dark:text-stone-200">
    <!-- Manchas de color de fondo -->
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div class="lo-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10"></div>
      <div class="lo-blob absolute -right-24 top-40 h-96 w-96 rounded-full bg-amber-200/25 blur-3xl dark:bg-amber-500/10" style="animation-delay: -6s"></div>
    </div>

    <!-- Barra superior: logo + toggle -->
    <header class="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
      <RouterLink to="/" class="flex items-center gap-2">
        <svg class="h-7 w-7 text-emerald-700 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
          <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z" />
        </svg>
        <span class="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-white">librOpinion</span>
      </RouterLink>
      <ThemeToggle />
    </header>

    <!-- Tarjeta central -->
    <main class="flex flex-1 items-center justify-center px-6 pb-16">
      <div class="w-full max-w-md">
        <div class="lo-fade-up rounded-2xl border border-stone-200/80 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-stone-800 dark:bg-stone-900/70">
          <h1 class="font-display text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="mt-2 text-stone-600 dark:text-stone-400">{{ subtitle }}</p>

          <div class="mt-6">
            <slot />
          </div>
        </div>

        <div v-if="$slots.footer" class="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
          <slot name="footer" />
        </div>
      </div>
    </main>
  </div>
</template>
