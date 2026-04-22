/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy primary scale (kept for backward compat with planner flow)
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // New dark-first design system tokens
        surface: '#0F1117',          // App/page background
        card: '#1A1D24',             // Default card background
        'card-elevated': '#21252E',  // Slightly raised cards / modals
        divider: '#2A2D35',          // Borders and separators
        accent: '#22C55E',           // Primary green action color
        'accent-dim': '#16A34A',     // Darker green for hover/pressed
        muted: '#8B909A',            // Secondary / placeholder text
        'on-accent': '#FFFFFF',      // Text on green accent backgrounds
      },
      animation: {
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-up': 'scale-up 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'sheet-up': 'sheet-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-down': 'sheet-down 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-up': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'sheet-down': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [
    function({ addVariant }) {
      // Use these prefixes to target native app platforms:
      //   ios:    → only when running as the Capacitor iOS app
      //   android: → only when running as the Capacitor Android app
      //   native:  → any Capacitor native app (ios or android)
      addVariant('ios', '.ios-app &');
      addVariant('android', '.android-app &');
      addVariant('native', '.native-app &');
    },
  ],
}
