import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      maxWidth: {
        '7xl': '1400px',
      },
      colors: {
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#1a3a5c',
          600: '#102a43',
          700: '#0d1e32',
          800: '#0a1522',
          900: '#070d16',
        },
        secondary: {
          50: '#fef9ec',
          100: '#fcefd0',
          200: '#f9dfa1',
          300: '#f5cc6e',
          400: '#f0b241',
          500: '#c9a84c',
          600: '#a0843e',
          700: '#7e6530',
          800: '#5c4922',
          900: '#3a2f15',
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#e74c3c',
          600: '#c0392b',
          700: '#992d22',
          800: '#7b241c',
          900: '#5c1e17',
        },
        success: '#27ae60',
        warning: '#f39c12',
        info: '#3498db',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1a3a5c 0%, #102a43 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #c9a84c 0%, #a0843e 100%)',
        'gradient-accent': 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        'gradient-gold': 'linear-gradient(135deg, #c9a84c 0%, #e8d48b 50%, #c9a84c 100%)',
        'gradient-navy': 'linear-gradient(135deg, #1a3a5c 0%, #102a43 100%)',
        'pattern-china': 'url("/pattern-china.svg")',
        'gradient-mesh-1': 'radial-gradient(circle at 0% 0%, rgba(201,168,76,0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(26,58,92,0.1) 0%, transparent 50%)',
        'gradient-mesh-2': 'radial-gradient(circle at 100% 0%, rgba(201,168,76,0.1) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(26,58,92,0.15) 0%, transparent 50%)',
      },
      boxShadow: {
        'brand': '0 4px 6px -1px rgba(26, 58, 92, 0.1), 0 2px 4px -1px rgba(26, 58, 92, 0.06)',
        'brand-lg': '0 10px 15px -3px rgba(26, 58, 92, 0.1), 0 4px 6px -2px rgba(26, 58, 92, 0.05)',
        'premium': '0 4px 20px rgba(26, 58, 92, 0.08)',
        'premium-lg': '0 12px 40px rgba(26, 58, 92, 0.16)',
        'premium-xl': '0 16px 48px rgba(26, 58, 92, 0.24)',
        'gold': '0 8px 32px rgba(201, 168, 76, 0.25)',
        'gold-lg': '0 16px 48px rgba(201, 168, 76, 0.35)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shimmer-premium': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 168, 76, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(201, 168, 76, 0.6)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'checkmark': {
          '0%': { strokeDashoffset: '50' },
          '100%': { strokeDashoffset: '0' },
        },
        'gold-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        gradient: 'gradient 3s ease infinite',
        'shimmer-premium': 'shimmer-premium 3s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'spin-slow': 'spin-slow 3s linear infinite',
        'checkmark': 'checkmark 0.5s ease-out forwards',
        'gold-shimmer': 'gold-shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
