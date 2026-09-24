import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Local dev: run `python api/index.py` (port 8000) alongside `npm run dev`.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
