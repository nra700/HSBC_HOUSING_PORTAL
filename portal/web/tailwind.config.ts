import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef2ff", 100: "#e0e7ff", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3" },
      },
      keyframes: {
        pageIn: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { "page-in": "pageIn 220ms ease-out both" },
    },
  },
  plugins: [],
};
export default config;
