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
        navy: {
          50: '#f0f5fa',
          100: '#e1ebf4',
          200: '#c3d7e9',
          300: '#94b9d8',
          400: '#5f94c2',
          500: '#3c75ab',
          600: '#2b5c8e',
          700: '#234972',
          800: '#1b3858',
          900: '#0f243a',
          950: '#091523',
        },
        gold: {
          50: '#fcfaf2',
          100: '#f8f3e2',
          200: '#f0e4c1',
          300: '#e5d199',
          400: '#d7bc70',
          500: '#c5a059',
          600: '#ad8745',
          700: '#8c6837',
          800: '#735331',
          900: '#61442c',
          950: '#382516',
        },
        paper: {
          50: '#fcfbf8',
          100: '#f7f5ee',
          200: '#efece0',
          300: '#dfdac8',
          400: '#cac3ad',
          500: '#b4ac93',
          900: '#1c1b18',
        },
        primary: {
          50: '#f0f5fa',
          100: '#e1ebf4',
          200: '#c3d7e9',
          300: '#94b9d8',
          400: '#5f94c2',
          500: '#2b5c8e',
          600: '#1b3858',
          700: '#162e48',
          800: '#0f243a',
          900: '#0b1b2b',
          950: '#060f18',
        },
        accent: {
          50: '#fcfaf2',
          100: '#f8f3e2',
          200: '#f0e4c1',
          300: '#e5d199',
          400: '#d7bc70',
          500: '#c5a059',
          600: '#ad8745',
          700: '#8c6837',
          800: '#735331',
          900: '#61442c',
        },
        surface: {
          50: '#faf9f5',
          100: '#f4f2ea',
          200: '#e8e5d8',
          300: '#d4cfbd',
          400: '#a39c87',
          500: '#736d5c',
          600: '#524d3f',
          700: '#3b372c',
          800: '#26231b',
          900: '#14120e',
          950: '#0a0907',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['Cinzel', '"Playfair Display"', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
}
