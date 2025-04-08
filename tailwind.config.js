/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        lightgrey: '#d0d6d6',
        mint: '#86b9b0',
        turquoise: '#4c7273',
        darkteal: '#042630',
        deepblue: '#041421'
      },
    },
  },
  plugins: [],
}

