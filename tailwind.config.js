/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Slate Emerald & Fresh Mint Theme Palette
        plum: {
          deep: '#0A231C',      // Dark Forest Slate
          secondary: '#143D32', // Deep Evergreen
          soft: '#DCFCE7',      // Soft Mint Accent
          hover: '#1E4E41',
          light: '#F0FDF4',     // Pale Mint Surface
        },
        peach: {
          primary: '#10B981',   // Vibrant Mint Emerald (AI signal & CTAs)
          soft: '#D1FAE5',      // Mint Glow
          hover: '#059669',     // Rich Emerald Hover
          light: '#ECFDF5',     // Mint Light
        },
        ivory: {
          warm: '#F6FAF8',      // Pearl Mint Canvas Background
          muted: '#EDF5F1',
        },
        ink: {
          primary: '#0F172A',   // Deep Charcoal Ink
          secondary: '#5B6B66', // Slate Moss Secondary Text
          muted: '#8A9B95',
        },
        semantic: {
          success: '#10B981',
          warning: '#D99A3D',
          danger: '#C94B58',
          successBg: '#ECFDF5',
          warningBg: '#FBF4E7',
          dangerBg: '#FCECEE',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(10, 35, 28, 0.06), 0 1px 4px -1px rgba(10, 35, 28, 0.04)',
        'card': '0 4px 20px -2px rgba(10, 35, 28, 0.08)',
        'modal': '0 20px 40px -10px rgba(10, 35, 28, 0.25)',
        'glow-peach': '0 0 18px rgba(16, 185, 129, 0.45)',
        'glow-plum': '0 0 20px rgba(10, 35, 28, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
