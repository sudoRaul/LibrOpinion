import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    // Escucha en todas las interfaces y puerto fijo: así el túnel siempre
    // encuentra el dev server (evita el 502 por puerto cambiado a 5174).
    host: true,
    port: 5173,
    strictPort: true,
    // Permite servir el dev a través de túneles (Cloudflare, localtunnel, ngrok)
    // para probar en el móvil. Vite bloquea hosts desconocidos por seguridad.
    allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok-free.app'],
  },
})
