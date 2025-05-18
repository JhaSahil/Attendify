/** @type {import('tailwindcss').Config} */
import tailwindcss from '@tailwindcss/vite'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js"

  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')

  ],
}