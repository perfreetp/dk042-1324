/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#eef3fb',
          100: '#d6e1f2',
          200: '#b2c8e4',
          300: '#85a7d1',
          400: '#5682bb',
          500: '#3765a1',
          600: '#2a4f83',
          700: '#1e3a5f',
          800: '#162c47',
          900: '#0f1e30',
          950: '#091220',
        },
        indigo: {
          50: '#eef3fb',
          100: '#d6e1f2',
          200: '#b2c8e4',
          300: '#85a7d1',
          400: '#5682bb',
          500: '#3765a1',
          600: '#2a4f83',
          700: '#1e3a5f',
          800: '#162c47',
          900: '#0f1e30',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
