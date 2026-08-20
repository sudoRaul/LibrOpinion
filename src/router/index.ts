import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // Landing pública. Si ya hay sesión, el guard redirige al dashboard (/app).
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/app',
      name: 'feed',
      component: () => import('../views/FeedView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/u/:username',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      // Permalink público: accesible sin sesión (RLS solo deja ver citas de
      // cuentas públicas). Los invitados ven una versión de solo lectura.
      path: '/q/:id',
      name: 'quote',
      component: () => import('../views/QuoteView.vue'),
      meta: { public: true },
    },
    {
      path: '/solicitudes',
      name: 'requests',
      component: () => import('../views/SolicitudesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      // Páginas legales: públicas (accesibles con o sin sesión).
      path: '/privacidad',
      name: 'privacy',
      component: () => import('../views/LegalView.vue'),
      props: { doc: 'privacy' },
      meta: { public: true },
    },
    {
      path: '/terminos',
      name: 'terms',
      component: () => import('../views/LegalView.vue'),
      props: { doc: 'terms' },
      meta: { public: true },
    },
    {
      path: '/aviso-legal',
      name: 'legal-notice',
      component: () => import('../views/LegalView.vue'),
      props: { doc: 'notice' },
      meta: { public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('../views/OnboardingView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Guards. El store ya está inicializado (init() se llama antes de montar la app),
// así que aquí la sesión y el profile ya están resueltos.
router.beforeEach((to) => {
  const auth = useAuthStore()

  // Sin sesión intentando entrar a una ruta protegida → login.
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  // Con sesión intentando ver login/signup → al feed.
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'feed' }
  }

  // Panel de admin: solo para admins. (La seguridad real está en la BD; esto es UX.)
  if (to.meta.requiresAdmin && auth.profile?.is_admin !== true) {
    return { name: 'feed' }
  }

  // Con sesión pero sin username → forzar onboarding (salvo que ya esté allí, o
  // que sea una ruta pública como las legales o el permalink de una cita).
  if (auth.isAuthenticated && auth.needsOnboarding && to.name !== 'onboarding' && !to.meta.public) {
    return { name: 'onboarding' }
  }

  // Ya tiene username pero intenta ir al onboarding → al feed.
  if (auth.isAuthenticated && !auth.needsOnboarding && to.name === 'onboarding') {
    return { name: 'feed' }
  }

  return true
})

export default router
