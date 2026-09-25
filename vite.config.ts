import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Valores falsos: nos testes o Supabase é sempre mockado (o CI não tem .env).
    env: { VITE_SUPABASE_URL: 'http://supabase.test', VITE_SUPABASE_ANON_KEY: 'chave-de-teste' },
  },
})
