/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e3a5f",
          50: "#e8f0fa",
          100: "#c5d7ee",
          200: "#9bbde2",
          300: "#6fa3d5",
          400: "#4d8ecb",
          500: "#2d79c1",
          600: "#2568ae",
          700: "#1e3a5f",
          800: "#17314f",
          900: "#0f273f",
          950: "#0a1d30",
        },
        sidebar: {
          bg: "#0f273f",
          hover: "#17314f",
          active: "#1e3a5f",
          border: "#25415f",
        },
        topbar: {
          bg: "#ffffff",
          border: "#e5e7eb",
        },
      },
    },
  },
  plugins: [],
};
