/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      colors: {
        paper: "#f5f1e8",
        ink: "#1a1d1f",
        ember: "#e75a2f",
        teal: "#0f766e",
      },
      boxShadow: {
        card: "0 16px 40px rgba(13, 30, 43, 0.15)",
      },
      animation: {
        floatIn: "floatIn 0.7s ease-out both",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: 0, transform: "translateY(16px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
