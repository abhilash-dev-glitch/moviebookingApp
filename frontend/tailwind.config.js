/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#f84464',
          dark: '#e03b58',
          light: '#ff6b84'
        },
        surface: {
          DEFAULT: '#0f172a',
          100: '#111827',
          200: '#0b1220',
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.15)',
        lift: '0 12px 24px -8px rgba(0,0,0,0.35)'
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(248,68,100,0.25), rgba(17,24,39,0.75))'
      }
    }
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')]
}
