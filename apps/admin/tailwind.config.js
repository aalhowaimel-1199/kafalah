export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "var(--navy)", 700: "var(--navy-700)", 900: "var(--navy-900)" },
        cyan: { DEFAULT: "var(--cyan)", 600: "var(--cyan-600)" },
        ink: "var(--ink)",
        slate: "var(--slate)",
        surface: "var(--surface)",
        line: "var(--line)",
        soft: "var(--soft)",
      },
      fontFamily: { sans: ["Almarai", "Segoe UI", "Tahoma", "Arial", "sans-serif"] },
      borderRadius: { xl2: "1rem" },
      boxShadow: { card: "0 14px 34px -22px rgba(0, 42, 85, 0.35)" },
    },
  },
  plugins: [],
};
