/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Serif 4"', 'Georgia', '"Times New Roman"', 'serif'],
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif']
      },
      colors: {
        accent: 'var(--color-accent)'
      }
    }
  },
  plugins: []
}
