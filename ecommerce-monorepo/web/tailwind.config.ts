import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // YIWU EXPRESS Brand Colors
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#1a3a5c', // Deep Navy Blue
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
          500: '#c9a84c', // Gold
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
          500: '#e74c3c', // Red
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
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1a3a5c 0%, #102a43 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #c9a84c 0%, #a0843e 100%)',
        'gradient-accent': 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        'pattern-china': 'url("/pattern-china.svg")',
      },
      boxShadow: {
        'brand': '0 4px 6px -1px rgba(26, 58, 92, 0.1), 0 2px 4px -1px rgba(26, 58, 92, 0.06)',
        'brand-lg': '0 10px 15px -3px rgba(26, 58, 92, 0.1), 0 4px 6px -2px rgba(26, 58, 92, 0.05)',
      },
    },
  },
  plugins: [],
}
export default config