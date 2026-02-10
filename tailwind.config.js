/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    },
    extend: {
      colors: {
        sidebar: {
          bg: '#1e1e2d',
          hover: '#2a2a3e',
          active: '#32324a',
          text: '#a0a3b1',
          'text-active': '#ffffff',
          border: '#2f2f42',
          muted: '#6b7280',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        shimmer: 'shimmer 2s infinite linear',
      },
      transitionDuration: {
        fast: '200ms',
        base: '400ms',
      },
    },
  },
  plugins: [],
}
