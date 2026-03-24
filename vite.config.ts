import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Capacitor requires an explicit base '/' so assets resolve correctly
  // inside the WKWebView on iOS (capacitor://localhost/)
  base: '/',
  server: {
    host: true, // Listen on all network interfaces
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
})
