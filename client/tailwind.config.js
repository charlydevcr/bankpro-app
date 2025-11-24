/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#0f172a',
        primary: '#3b82f6',
        background: '#f1f5f9',
        card: '#ffffff',
        textMain: '#1e293b',
        textMuted: '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}