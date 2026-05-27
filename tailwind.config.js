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
          50: '#e8f7f6',
          500: '#1ab2a6',
          600: '#169d92',
        },
      },
    },
  },
  plugins: [],
}
