/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./frontend/src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        anahuac: {
          orange: '#ff9153',
        },
        surface: {
          DEFAULT: '#0e0e10',
          'container-low': '#131315',
          'container-high': '#1f1f22',
          bright: '#2c2c2f',
          variant: 'rgba(255, 255, 255, 0.05)',
        },
        primary: {
          DEFAULT: '#ff9153',
          container: '#ff7a23',
        },
        on: {
          surface: '#f9f5f8',
          'surface-variant': '#adaaad',
        },
        outline: {
          variant: '#48474a',
        }
      },
      boxShadow: {
        'ambient': '0 20px 40px rgba(0, 0, 0, 0.4)',
        'btn-primary': '0 10px 20px rgba(255, 145, 83, 0.2)',
      },
      backdropBlur: {
        'glass': '30px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
