/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'serif': ['Crimson Text', 'serif'],
        'mono': ['Fira Code', 'monospace']
      },
      colors: {
        'haunted': {
          '50': '#f8f5ff',
          '100': '#f1ebff',
          '200': '#e0d4ff',
          '300': '#c8b0ff',
          '400': '#a77eff',
          '500': '#8a4fff',
          '600': '#7c2dff',
          '700': '#6e1bff',
          '800': '#5c16d9',
          '900': '#4c13b3',
          '950': '#2e0a66',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'flicker': 'flicker 8s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '41.99%': { opacity: 1 },
          '42%': { opacity: 0.8 },
          '43%': { opacity: 1 },
          '43.08%': { opacity: 0.6 },
          '43.8%': { opacity: 0.9 },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
