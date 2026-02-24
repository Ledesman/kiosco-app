import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './',
  server: {
    port: 6969,
    host: 'http://187.77.51.247:6969'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
