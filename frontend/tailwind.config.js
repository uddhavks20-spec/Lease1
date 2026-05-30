/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // OLD-BLUE: 50:#f0f9ff 100:#e0f2fe 200:#bae6fd 300:#7dd3fc 400:#38bdf8 500:#0ea5e9 600:#0284c7 700:#0369a1 800:#075985 900:#0c4a6e
        // BRAND: Hot pink primary, teal secondary — Synthwave/gaming vibe for Gen Z
        primary: {
          50: '#fff0f6',
          100: '#ffe0ed',
          200: '#ffc0db',
          300: '#ff91c0',
          400: '#ff4097',
          500: '#ff1f86',
          600: '#FF006E',
          700: '#cc0058',
          800: '#990042',
          900: '#66002c',
        },
        secondary: {
          50: '#e0fffa',
          100: '#b3fff2',
          200: '#80ffea',
          300: '#40ffe0',
          400: '#00ffd6',
          500: '#00fad4',
          600: '#00F5D4',
          700: '#00c4a9',
          800: '#00937f',
          900: '#006254',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        surface: {
          DEFAULT: '#FDF8F0',
          dark: '#FDF8F0',
          card: '#FFFFFF',
          'card-dark': '#F5F0E8',
          muted: '#F5F0E8',
          'muted-dark': '#EBE5D8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-light': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}