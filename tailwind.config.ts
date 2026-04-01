export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        newsred: '#C0392B',
        newsblue: '#2980B9',
        newsgreen: '#27AE60',
        newsamber: '#B7770D',
        parchment: '#fef9f0',
        rule: '#dddddd',
        muted: '#666666',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
