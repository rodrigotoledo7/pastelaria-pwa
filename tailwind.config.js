/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Dourado massa frita
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        brand: {
          red: '#dc2626',
          'red-dark': '#991b1b',
          amber: '#f59e0b',
          yellow: '#fbbf24',
          crisp: '#78350f',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'floating': '0 8px 30px rgba(0, 0, 0, 0.16)',
      }
    },
  },
  plugins: [],
}
