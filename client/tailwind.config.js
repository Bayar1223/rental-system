/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        sans: ["'DM Sans'", "sans-serif"],
        playfair: ["'Playfair Display'", "serif"],
      },
      colors: {
        obsidian: "#0A0A0A",
        carbon: "#141414",
        graphite: "#1C1C1C",
        onyx: "#242424",
        gold: {
          DEFAULT: "#C9A84C",
          bright: "#D4B85F",
          light: "#E8D49E",
          dark: "#8B6914",
        },
        platinum: "#F5F5F5",
        silver: "#B8B8B0",
        smoke: "#6B6B65",
        ash: "#4A4A45",
        ink: "#F5F5F5",     // legacy
        cream: "#0A0A0A",   // legacy
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