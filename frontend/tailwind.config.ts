import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: "#FCFDFB",
          100: "#F3F7F3",
          200: "#E4EDE5",
          300: "#D3E1D6",
          800: "#46544A",
          900: "#28382D",
        },
        forest: {
          50: "#EFF8F1",
          100: "#DDF0E2",
          200: "#BEDFC9",
          500: "#498663",
          700: "#286342",
          800: "#1F5135",
          900: "#17432B",
          950: "#102D1D",
        },
        sage: {
          50: "#F3F8F4",
          100: "#E5F0E7",
          200: "#CEE2D2",
          500: "#70947A",
          700: "#4E7057",
        },
        sky: {
          50: "#F0F7FA",
          100: "#DDEEF4",
          200: "#BFDFEA",
          700: "#376A7A",
        },
        coral: {
          50: "#FFF6F2",
          100: "#FCE8DF",
          500: "#D66A4D",
          600: "#BD553A",
          700: "#98432F",
        },
        ink: {
          900: "#1B2921",
          800: "#34443A",
          700: "#52645A",
          500: "#74847A",
          300: "#A8B6AD",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        soft: "0 3px 12px rgba(28, 61, 41, 0.045)",
        card: "0 8px 28px -8px rgba(28, 61, 41, 0.11)",
        raised: "0 16px 42px -14px rgba(28, 61, 41, 0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
