/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#ff3877",
          "pink-light": "#ff6b98",
          "pink-soft": "#fff0f5",
          blue: "#0284c7",
          "blue-light": "#38bdf8",
          "blue-soft": "#f0f9ff",
          purple: "#8b5cf6",
          dark: "#0f172a",
          "dark-card": "#1e293b",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow-pink': '0 0 25px -5px rgba(255, 56, 119, 0.3)',
        'glow-blue': '0 0 25px -5px rgba(56, 189, 248, 0.3)',
        'card-hover': '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
