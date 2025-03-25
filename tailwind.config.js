/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#f3f4f6',
        accent: '#60a5fa',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
    },
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography'),
  ],
  daisyui: {
    themes: ["light"],
  },
}
