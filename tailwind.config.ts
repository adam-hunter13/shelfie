import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        parchment: {
          50:  "#fdf8f0",
          100: "#f9eedb",
          200: "#f2dbb5",
          300: "#8b6820",
          400: "#6b5438",
          500: "#8b5e18",
          600: "#a86c1e",
          700: "#875218",
          800: "#6b3f14",
          900: "#4e2e10",
        },
        ink: {
          DEFAULT: "#1c1209",
          light:   "#3d2b14",
        },
        moss:     "#4a5e3a",
        mahogany: "#7c3626",
        // Dark mode surface colors
        dark: {
          bg:      "#1a1410",
          surface: "#241c16",
          border:  "#3d2e22",
          muted:   "#bfa080",
          text:    "#e8d5be",
          subtle:  "#a08060",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body:    ["'Lora'", "Georgia", "serif"],
        sans:    ["'DM Sans'", "sans-serif"],
      },
      backgroundImage: {
        "warm-gradient": "linear-gradient(135deg, #fdf8f0 0%, #f2dbb5 50%, #8b6820 100%)",
        "dark-gradient": "linear-gradient(135deg, #1a1410 0%, #241c16 50%, #2e2018 100%)",
        "shelf-wood":    "linear-gradient(180deg, #7c5c38 0%, #5c3d1e 100%)",
      },
      boxShadow: {
        book:        "4px 4px 0px 0px rgba(92,61,30,0.35), 6px 6px 12px rgba(92,61,30,0.2)",
        "book-hover":"6px 6px 0px 0px rgba(92,61,30,0.4), 8px 8px 18px rgba(92,61,30,0.25)",
        soft:        "0 2px 20px rgba(92,61,30,0.12)",
        "soft-dark": "0 2px 20px rgba(0,0,0,0.4)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
