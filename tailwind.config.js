/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fredoka", "sans-serif"],
        body: ["Nunito", "sans-serif"],
      },
      colors: {
        blossom: {
          50: "#fff5f8",
          100: "#ffe4ee",
          200: "#ffc9dd",
          300: "#ffa3c4",
          400: "#fb7aa8",
          500: "#f0568c",
        },
        lavender: {
          50: "#f7f5ff",
          100: "#ece6ff",
          200: "#dccdff",
          300: "#c4aaff",
          400: "#a67dff",
        },
        skycream: {
          50: "#fffdf7",
          100: "#fef8ea",
          200: "#e7f3ff",
        },
        mint: {
          100: "#e3f9ee",
          300: "#a6e9c8",
          500: "#4fbf8f",
        },
        peach: {
          100: "#ffe9d9",
          300: "#ffc199",
        },
      },
      boxShadow: {
        soft: "0 8px 24px -8px rgba(240, 86, 140, 0.25)",
        card: "0 4px 14px -4px rgba(166, 125, 255, 0.2)",
      },
      borderRadius: {
        cute: "1.5rem",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        sparkle: {
          "0%,100%": { opacity: 0.3, transform: "scale(0.8)" },
          "50%": { opacity: 1, transform: "scale(1.1)" },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        pop: "pop 0.25s ease-out",
        sparkle: "sparkle 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
