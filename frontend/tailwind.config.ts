import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./frontend/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      fontFamily: {
        sans: ["Aptos", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 18px 70px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;
