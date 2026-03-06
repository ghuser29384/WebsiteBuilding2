/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--color-surface)",
        bg: "var(--color-bg)",
        "text-default": "var(--color-text-default)",
        "text-surface": "var(--color-text-surface)",
        "muted-text": "var(--color-muted-text)",
        cta: "var(--color-cta)",
        "accent-2": "var(--color-accent-2)",
        muted: "var(--color-muted)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Manrope",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        emphasis: ["Garamond", "EB Garamond", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
