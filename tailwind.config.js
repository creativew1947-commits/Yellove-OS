/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        csk: { gold: '#F9CD05', dark: '#111827', accent: '#FACC15' }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in-out': 'fadeInOut 8s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeInOut: {
          '0%, 100%': { opacity: '0', transform: 'translateY(5px)' },
          '10%, 90%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
