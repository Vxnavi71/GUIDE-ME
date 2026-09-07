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
          600: '#2b3f35',
          700: '#1f2f27',
          800: '#17231d',
          900: '#0f1713',
          950: '#080d0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
