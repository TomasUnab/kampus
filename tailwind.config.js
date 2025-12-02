/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.html",
    "./js/**/*.js",
    "!./node_modules/**"
  ],
  theme: {
    extend: {
      colors: {
        kampus: {
          primary: '#7c3aed',
          secondary: '#8b5cf6',
          accent: '#a78bfa'
        }
      }
    },
  },
  plugins: [],
}
