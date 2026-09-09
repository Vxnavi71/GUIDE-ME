/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e5ece5',
          200: '#cddbcd',
          300: '#a7c1a7',
          400: '#7a9f7a',
          500: '#5a825a',
          600: '#466846',
          700: '#385338',
          800: '#2f432f',
          900: '#283828',
          950: '#151e16',
        },
        earth: {
          50: '#fbfaf8',
          100: '#f6f4ee',
          200: '#ebe6db',
          300: '#dbd3c2',
          400: '#c5b8a1',
          500: '#b1a084',
          600: '#9b896f',
          700: '#7e6f5a',
          800: '#675b4b',
          900: '#544b3f',
        },
        forest: {
          50: '#f2f6f4',
          100: '#e1ebe5',
          // 200-500 were missing, which forced components to jump straight from 100 to 600.
          200: '#c4d7cc',
          300: '#9bbcac',
          400: '#6d9a86',
          500: '#4a7864',
          600: '#2b3f35',
          700: '#1f2f27',
          800: '#17231d',
          900: '#0f1713',
          950: '#080d0a',
        },
        // Warm accent, tuned to sit beside the sage/earth ground rather than fight it.
        clay: {
          400: '#d9906a',
          500: '#c67a52',
          600: '#a86340',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      fontSize: {
        // Slightly tighter tracking on display sizes reads more considered at large weights.
        'display': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title': ['1.375rem', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '700' }],
        'eyebrow': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '700' }],
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        // Layered, low-opacity elevation. A single flat shadow is what makes UI look unfinished.
        'soft': '0 1px 2px rgba(23, 35, 29, 0.04), 0 2px 8px rgba(23, 35, 29, 0.04)',
        'card': '0 1px 2px rgba(23, 35, 29, 0.04), 0 4px 16px rgba(23, 35, 29, 0.06)',
        'lift': '0 2px 4px rgba(23, 35, 29, 0.05), 0 12px 28px rgba(23, 35, 29, 0.10)',
        'ring-sage': '0 0 0 3px rgba(90, 130, 90, 0.15)',
        'inner-soft': 'inset 0 1px 2px rgba(23, 35, 29, 0.05)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        'typing-dot': {
          '0%, 60%, 100%': { opacity: '0.25', transform: 'translateY(0)' },
          '30%': { opacity: '1', transform: 'translateY(-3px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'breathe': 'breathe 3.5s ease-in-out infinite',
        'typing-dot': 'typing-dot 1.2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
