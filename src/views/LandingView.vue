<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import ThemeToggle from '../components/ThemeToggle.vue'

// Citas de muestra para las tarjetas flotantes del hero.
const heroQuotes = [
  {
    text: 'Era el mejor de los tiempos, era el peor de los tiempos.',
    book: 'Historia de dos ciudades',
    author: 'Charles Dickens',
    rot: '-5deg',
  },
  {
    text: 'No hay amigo tan leal como un libro.',
    book: 'Sobre la lectura',
    author: 'Ernest Hemingway',
    rot: '4deg',
  },
  {
    text: 'Quien lee mucho y anda mucho, ve mucho y sabe mucho.',
    book: 'Don Quijote de la Mancha',
    author: 'Miguel de Cervantes',
    rot: '-2deg',
  },
]

// Frases para la marquesina (se duplican para el bucle infinito).
const ribbon = [
  'Un lector vive mil vidas antes de morir.',
  'Los libros son espejos: solo ves en ellos lo que ya llevas dentro.',
  'Hasta el infinito y más allá de la última página.',
  'Leer es soñar con los ojos abiertos.',
  'Cada libro leído es un peldaño más.',
  'La lectura es a la mente lo que el ejercicio al cuerpo.',
]

// Reveal al hacer scroll.
let observer: IntersectionObserver | null = null
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.15 },
  )
  document.querySelectorAll('.lo-reveal').forEach((el) => observer?.observe(el))
})
onBeforeUnmount(() => observer?.disconnect())

const features = [
  {
    title: 'Cita y comenta',
    body: 'Apunta la frase que te marcó, su página y por qué te llegó. Tu biblioteca de subrayados, ordenada.',
  },
  {
    title: 'Sigue a lectores',
    body: 'Tu feed se llena con las citas de quienes sigues. Descubre a través de los ojos de otros.',
  },
  {
    title: 'Encuentra tu próxima lectura',
    body: 'Cada cita es una puerta a un libro nuevo. Deja que las frases te guíen al siguiente.',
  },
]
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-linear-to-b from-stone-50 via-amber-50/30 to-stone-100 text-stone-800 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 dark:text-stone-200">
    <!-- Manchas de color de fondo (sutiles: dos, no tres) -->
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="lo-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10"></div>
      <div class="lo-blob absolute -right-32 top-40 h-112 w-112 rounded-full bg-amber-200/25 blur-3xl dark:bg-amber-500/10" style="animation-delay: -6s"></div>
    </div>

    <!-- Navegación -->
    <header class="lo-fade-up mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <div class="flex items-center gap-2">
        <svg class="h-7 w-7 text-emerald-700 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
          <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z" />
        </svg>
        <span class="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-white">librOpinion</span>
      </div>
      <ThemeToggle />
      <nav class="flex items-center gap-2">
        <RouterLink
          to="/login"
          class="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          Iniciar sesión
        </RouterLink>
        <RouterLink
          to="/signup"
          class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Crear cuenta
        </RouterLink>
      </nav>
    </header>

    <!-- Hero -->
    <main>
      <section class="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-2 lg:pt-20">
        <div>
          <span
            class="lo-fade-up inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
            style="animation-delay: 0.05s"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
            Una red social para lectores
          </span>

          <h1
            class="lo-fade-up mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl dark:text-white"
            style="animation-delay: 0.12s"
          >
            Las frases que te
            <span class="relative whitespace-nowrap text-emerald-700 dark:text-emerald-400">
              marcan
              <svg class="absolute -bottom-2 left-0 h-3 w-full text-amber-400" viewBox="0 0 200 12" preserveAspectRatio="none" fill="none">
                <path d="M2 9C40 3 160 3 198 9" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
              </svg>
            </span>
            merecen un lugar.
          </h1>

          <p
            class="lo-fade-up mt-6 max-w-md text-lg leading-relaxed text-stone-600 dark:text-stone-400"
            style="animation-delay: 0.2s"
          >
            Guarda las citas de los libros que lees, añade tu página y tu opinión,
            y descubre lo que subrayan las personas a las que sigues.
          </p>

          <div class="lo-fade-up mt-8 flex flex-wrap items-center gap-3" style="animation-delay: 0.28s">
            <RouterLink
              to="/signup"
              class="group inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-base font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Empieza a citar gratis
              <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </RouterLink>
            <RouterLink
              to="/login"
              class="inline-flex items-center rounded-xl border border-stone-300 bg-white/60 px-6 py-3 text-base font-medium text-stone-700 backdrop-blur transition-colors hover:bg-white dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Ya tengo cuenta
            </RouterLink>
          </div>
        </div>

        <!-- Tarjetas de cita flotantes -->
        <div class="relative h-[32rem] select-none">
          <article
            v-for="(q, i) in heroQuotes"
            :key="i"
            class="lo-fade-up absolute w-72 rounded-2xl border border-stone-200/80 bg-white/80 p-5 shadow-xl backdrop-blur dark:border-stone-700/80 dark:bg-stone-800/80"
            :class="[
              i === 0 ? 'left-2 top-0 z-30' : '',
              i === 1 ? 'right-0 top-42 z-20' : '',
              i === 2 ? 'bottom-0 left-10 z-10' : '',
            ]"
            :style="{ animationDelay: `${0.35 + i * 0.15}s` }"
          >
            <div class="lo-float-rot" :style="{ '--rot': q.rot, animationDelay: `${i * 1.1}s` }">
              <svg class="h-6 w-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.5 6C5 6 3 8 3 10.5S5 15 7.5 15c0 2-1 3-3 3.5 3 0 6-2 6-6.5V6zM19.5 6c-2.5 0-4.5 2-4.5 4.5S17 15 19.5 15c0 2-1 3-3 3.5 3 0 6-2 6-6.5V6z" />
              </svg>
              <p class="mt-3 font-quote text-lg leading-snug text-stone-800 dark:text-stone-100">{{ q.text }}</p>
              <p class="mt-4 text-sm font-medium text-stone-900 dark:text-white">{{ q.book }}</p>
              <p class="text-sm text-stone-500 dark:text-stone-400">{{ q.author }}</p>
            </div>
          </article>
        </div>
      </section>

      <!-- Marquesina de frases -->
      <div class="lo-marquee relative border-y border-stone-200/70 bg-white/40 py-4 dark:border-stone-800 dark:bg-stone-900/40">
        <div class="lo-marquee-track gap-10 whitespace-nowrap">
          <span
            v-for="(line, i) in [...ribbon, ...ribbon]"
            :key="i"
            class="flex items-center gap-10 font-quote text-lg text-stone-500 dark:text-stone-400"
          >
            {{ line }}
            <span class="text-amber-400">✦</span>
          </span>
        </div>
        <!-- Difuminado en los bordes -->
        <div class="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-stone-50 to-transparent dark:from-stone-950"></div>
        <div class="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-stone-50 to-transparent dark:from-stone-950"></div>
      </div>

      <!-- Features -->
      <section class="mx-auto max-w-6xl px-6 py-24">
        <div class="lo-reveal mx-auto max-w-2xl text-center">
          <h2 class="font-display text-4xl font-semibold tracking-tight text-stone-900 dark:text-white">
            Tu biblioteca de frases favoritas
          </h2>
          <p class="mt-4 text-lg text-stone-600 dark:text-stone-400">
            Todo lo que subrayas, en un mismo lugar, y compartido con quien quieras.
          </p>
        </div>

        <div class="mt-14 grid gap-6 md:grid-cols-3">
          <div
            v-for="(f, i) in features"
            :key="f.title"
            class="lo-reveal group rounded-2xl border border-stone-200 bg-white/70 p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-stone-800 dark:bg-stone-900/60"
            :style="{ transitionDelay: `${i * 90}ms` }"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-700 group-hover:text-white dark:bg-emerald-950/50 dark:text-emerald-400 dark:group-hover:bg-emerald-600 dark:group-hover:text-white">
              <svg v-if="i === 0" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 7v13M12 7a4 4 0 0 0-4-4H3v13h5a4 4 0 0 1 4 4M12 7a4 4 0 0 1 4-4h5v13h-5a4 4 0 0 0-4 4" />
              </svg>
              <svg v-else-if="i === 1" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
              </svg>
              <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <h3 class="mt-5 font-display text-xl font-semibold text-stone-900 dark:text-white">{{ f.title }}</h3>
            <p class="mt-2 leading-relaxed text-stone-600 dark:text-stone-400">{{ f.body }}</p>
          </div>
        </div>
      </section>

      <!-- CTA final -->
      <section class="mx-auto max-w-5xl px-6 pb-28">
        <div class="lo-reveal relative overflow-hidden rounded-3xl bg-stone-900 px-8 py-16 text-center shadow-2xl dark:border dark:border-stone-800 dark:bg-stone-900/80">
          <div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-600/30 blur-3xl"></div>
          <div class="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl"></div>
          <h2 class="relative font-display text-4xl font-semibold text-white sm:text-5xl">
            Empieza tu colección de citas
          </h2>
          <p class="relative mx-auto mt-4 max-w-lg text-lg text-stone-300">
            Únete gratis y guarda la primera frase que te quite el aliento.
          </p>
          <RouterLink
            to="/signup"
            class="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-base font-medium text-stone-900 transition-transform hover:-translate-y-0.5"
          >
            Crear mi cuenta
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </RouterLink>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-stone-200/70 py-8 dark:border-stone-800">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-stone-500 sm:flex-row dark:text-stone-400">
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-emerald-700 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
            <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z" />
          </svg>
          <span class="font-display font-semibold text-stone-700 dark:text-stone-200">librOpinion</span>
        </div>
        <p>Hecho para quienes subrayan.</p>
      </div>
    </footer>
  </div>
</template>
