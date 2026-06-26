import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070A13",
        foreground: "#F1F5F9",
        card: {
          DEFAULT: "#0F1424",
          foreground: "#F1F5F9",
        },
        accent: {
          DEFAULT: "#3B82F6",
          muted: "#3B82F633",
        },
        success: {
          DEFAULT: "#10B981",
          muted: "#10B98133",
        },
        warning: {
          DEFAULT: "#F59E0B",
          muted: "#F59E0B33",
        },
        critical: {
          DEFAULT: "#EF4444",
          muted: "#EF444433",
        },
        border: "#1E293B",
        input: "#0F1424",
        ring: "#3B82F6",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "var(--font-geist-mono)", "monospace"],
        sans: ["Plus Jakarta Sans", "var(--font-geist-sans)", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 20s linear infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite alternate",
        "scan-line": "scanLine 6s linear infinite",
      },
      keyframes: {
        glowPulse: {
          "0%": { boxShadow: "0 0 4px #3B82F6, inset 0 0 2px #3B82F6" },
          "100%": { boxShadow: "0 0 16px #3B82F6, inset 0 0 8px #3B82F6" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
