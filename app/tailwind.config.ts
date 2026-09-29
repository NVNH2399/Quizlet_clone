import type { Config } from "tailwindcss";

export default {
  darkMode: "class", // bắt buộc để next-themes hoạt động đúng
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4255ff",
          dark: "#2e3eb8",
          light: "#eef0ff",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
} satisfies Config;