/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          accent:  'var(--brand-accent)',
          soft:    'var(--brand-soft)',
          lavender:'var(--brand-lavender)',
        },
        surface: {
          pageHeader: 'var(--surface-page-header)',
          cardHeader: 'var(--surface-card-header)',
        },
        border: {
          card: 'var(--border-card)',
        },
        text: {
          DEFAULT: 'var(--text-default)',
        },
      },
    },
  },
  plugins: [],
}
