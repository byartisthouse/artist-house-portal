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
        brand: {
          bg: '#FAFAF8',
          surface: '#FFFFFF',
          'surface-alt': '#F5F4F0',
          border: 'rgba(0,0,0,0.08)',
          'border-hover': 'rgba(0,0,0,0.15)',
          text: '#1A1A1A',
          muted: '#6B6B65',
          dim: '#9C9B95',
          accent: '#1A1A1A',
        },
        status: {
          green: '#1D9E75',
          blue: '#2563EB',
          purple: '#7C3AED',
          coral: '#DC4A2D',
          amber: '#B45309',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['FT Activica Mix', 'DM Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
