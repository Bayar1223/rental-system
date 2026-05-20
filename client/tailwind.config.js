/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        sans: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        gold: "#C9A84C",
        ink: "#0D0D0D",
        cream: "#FAF8F3",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease both",
        "fade-in": "fadeIn 0.5s ease both",
        "float": "floatY 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};