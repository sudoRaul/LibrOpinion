<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// title/subtitle son opcionales: si no se pasan, usamos los textos i18n por defecto.
const props = defineProps<{ title?: string; subtitle?: string }>()
const { t } = useI18n()

const displayTitle = computed(() => props.title ?? t('endOfList.title'))
const displaySubtitle = computed(() => props.subtitle ?? t('endOfList.subtitle'))
</script>

<template>
  <div class="end-of-list py-12 text-center">
    <!-- Filo ornamental: línea · símbolo · línea -->
    <div class="mx-auto flex max-w-xs items-center gap-3 text-stone-300 dark:text-stone-700">
      <span class="h-px flex-1 bg-linear-to-r from-transparent to-current"></span>
      <span class="end-of-list__mark text-emerald-500 dark:text-emerald-400">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
          <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z" />
          <path d="M12 4v16" />
        </svg>
      </span>
      <span class="h-px flex-1 bg-linear-to-l from-transparent to-current"></span>
    </div>

    <!-- Frase con magia -->
    <p class="mx-auto mt-5 max-w-sm font-display text-xl font-medium italic text-stone-700 dark:text-stone-200">
      “{{ displayTitle }}”
    </p>
    <p class="mx-auto mt-2 max-w-xs text-sm text-stone-400 dark:text-stone-500">{{ displaySubtitle }}</p>

    <!-- Chispitas -->
    <div class="mt-4 flex items-center justify-center gap-1.5 text-emerald-400/70">
      <span class="end-of-list__spark">✦</span>
      <span class="end-of-list__spark" style="animation-delay: 0.25s">✧</span>
      <span class="end-of-list__spark" style="animation-delay: 0.5s">✦</span>
    </div>
  </div>
</template>

<style scoped>
.end-of-list {
  animation: end-fade-up 0.6s ease both;
}
.end-of-list__mark {
  display: inline-flex;
  animation: end-book 0.7s ease both;
}
.end-of-list__spark {
  display: inline-block;
  animation: end-twinkle 1.8s ease-in-out infinite;
}

@keyframes end-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes end-book {
  from {
    opacity: 0;
    transform: scale(0.7) rotate(-8deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}
@keyframes end-twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .end-of-list,
  .end-of-list__mark,
  .end-of-list__spark {
    animation: none;
  }
}
</style>
