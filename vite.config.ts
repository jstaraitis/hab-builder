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
    // No explicit hmr host: pinning it to 'localhost' while serving on all
    // interfaces breaks the HMR socket for anyone opening the LAN URL (or a
    // device running the Capacitor shell). The client then falls into Vite's
    // ping-and-reload loop and refreshes every second forever. Left unset,
    // Vite derives the socket host from the page's own origin, so localhost
    // and LAN access both work.
  },
})
