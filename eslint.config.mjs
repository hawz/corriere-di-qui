// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Solo stile: senza un formatter, la correzione automatica lascia i template mal indentati.
    'vue/first-attribute-linebreak': 'off',
    'vue/html-self-closing': 'off',
  },
})
