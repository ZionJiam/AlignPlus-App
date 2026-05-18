export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          charcoal: '#595f6e',
          'charcoal-dark': '#424753',
          mint: '#5ecba8',
          'mint-dark': '#45b896',
          'mint-light': '#eaf8f4',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
