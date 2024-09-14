/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/index.html', './src/**/*.js'],
  theme: {
    extend: {
        colors: {
          "primary": {
            "base":"#F5F6F7",
            "card":"#FFFFFF",
            "base-dark":"#1C1917",
            "card-dark":"#2F2A27"
          },
          "secondary": {
            "base":"#1C1917",
            "dates":"#71717A",
            "base-dark":"#EDEBEA",
            "dates-dark":"#808080"
          },
          "delete":{
            "base":"#C41E3A",
            "base-dark":"#A92323"
          },
      }
    },
  },
  plugins: [],
  darkMode: "class",
}