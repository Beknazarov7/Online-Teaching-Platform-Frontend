import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server runs on :5173. The Django API runs on :8000.
// We could call the API absolutely, but proxying /api -> :8000 keeps cookies
// and CORS rules simple, and means the React code never has to know what
// host the API lives on.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
