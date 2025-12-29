/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // X/Twitter dark theme colors
        'x-bg': '#000000',
        'x-bg-secondary': '#16181c',
        'x-bg-tertiary': '#1d1f23',
        'x-bg-hover': '#181818',
        'x-text': '#e7e9ea',
        'x-text-secondary': '#71767b',
        'x-accent': '#1d9bf0',
        'x-accent-hover': '#1a8cd8',
        'x-success': '#00ba7c',
        'x-warning': '#ffad1f',
        'x-error': '#f4212e',
        'x-border': '#2f3336',
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

