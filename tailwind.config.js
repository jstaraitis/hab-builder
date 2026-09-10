/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /**
       * Type scale.
       *
       * 76% of the app's text is `text-sm` or `text-xs`, which is normal for a
       * data-dense tool but was rendering cramped at Tailwind's default
       * leading. Rather than migrate ~1,600 class usages, the scale itself is
       * retuned — every existing class gets better rhythm for free.
       *
       * Two opposite moves, which is what separates considered typography from
       * default typography:
       *
       *   - SMALL TEXT gets MORE leading. Dense UI copy at 1.33 line-height is
       *     a wall; at 1.5 it reads. This is the single biggest readability win
       *     available without touching markup.
       *   - DISPLAY TEXT gets LESS leading and negative tracking. Large type at
       *     body-text leading looks loose and unset, which is exactly the
       *     "assembled from defaults" impression we are trying to shake.
       */
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.125rem' }],   // 12/18 — was 12/16
        sm: ['0.875rem', { lineHeight: '1.375rem' }],  // 14/22 — was 14/20
        base: ['1rem', { lineHeight: '1.5625rem' }],   // 16/25 — was 16/24
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.6875rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.9375rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.022em' }],
        '5xl': ['3rem', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
      },
      fontFamily: {
        // Matches the :root stack in index.css so `font-sans` and inherited
        // text resolve to the same font rather than diverging.
        sans: [
          'Inter Variable',
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
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
        // The `primary` scale lived here as a byte-identical duplicate of
        // `jade`. Two names for one colour is how a palette drifts, so its 39
        // usages were renamed to jade and the duplicate removed.
        // Dark-first design system tokens
        surface: '#0F1117',          // App/page background
        card: '#1A1D24',             // Default card background
        'card-elevated': '#21252E',  // Slightly raised cards / modals
        divider: '#2A2D35',          // Borders and separators
        // Body copy: brighter than `muted`, softer than pure white. The legacy
        // palette drew a real distinction between dark:text-gray-300 (body) and
        // dark:text-gray-400 (labels); without a token in between, migrating
        // both to `muted` would flatten three levels of hierarchy into two.
        // 9.8:1 on `card`, so it clears AA comfortably for body text.
        secondary: '#C6CBD4',
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
