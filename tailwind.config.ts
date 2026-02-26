import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        advercase: ['Advercase', 'sans-serif'],
        din: ['DIN OT', 'Arial', 'Helvetica', 'sans-serif'],
        'ibm-mono': ['var(--font-ibm-plex-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
