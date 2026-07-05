/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdfb',
          100: '#ccfaf5',
          300: '#6ee7dc',
          400: '#2dcfc3',
          500: '#1ab2a6',
          600: '#169d92',
          700: '#117a71',
        },
      },
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
