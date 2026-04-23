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
        // Jade color scale (replaces legacy green/emerald)
        jade: {
          50: '#f0fdf9',
          100: '#d4f7f1',
          200: '#a8e8de',
          300: '#7cdccf',
          400: '#50cfc0',
          500: '#2fb5ad',
          600: '#259f9a',
          700: '#1a8983',
          800: '#14736c',
          900: '#0f5d55',
        },
        // Legacy primary scale (kept for backward compat - now jade)
        primary: {
          50: '#f0fdf9',
          100: '#d4f7f1',
          200: '#a8e8de',
          300: '#7cdccf',
          400: '#50cfc0',
          500: '#2fb5ad',
          600: '#259f9a',
          700: '#1a8983',
          800: '#14736c',
          900: '#0f5d55',
        },
        // New dark-first design system tokens
        surface: '#0F1117',          // App/page background
        card: '#1A1D24',             // Default card background
        'card-elevated': '#21252E',  // Slightly raised cards / modals
        divider: '#2A2D35',          // Borders and separators
        accent: '#2D9B8F',           // Primary jade action color
        'accent-dim': '#1F6B5E',     // Darker jade for hover/pressed
        muted: '#8B909A',            // Secondary / placeholder text
        'on-accent': '#FFFFFF',      // Text on jade accent backgrounds
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
