import typography from "@tailwindcss/typography";

/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      colors: {
        background: "#0b0e14",
        surface: "#10131a",
        primary: "#c799ff",
        secondary: "#4af8e3",
        textMain: "#ecedf6",
        textMuted: "#a9abb3",
      },
      animation: {
        floatIn: "floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        pulseGlow: "pulseGlow 2s infinite",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: 0, transform: "translateY(24px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.8, filter: "drop-shadow(0 0 10px rgba(199,153,255,0.5))" },
          "50%": { opacity: 1, filter: "drop-shadow(0 0 20px rgba(199,153,255,0.8))" },
        }
      },
    },
  },
  plugins: [typography],
};
