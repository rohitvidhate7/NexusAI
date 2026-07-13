/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#0d1117',
          secondary: '#161b22',
          card: '#1c2128',
          hover: '#21262d',
          input: '#161b22',
        },
        border: {
          DEFAULT: '#30363d',
          light: '#3d444d',
        },
        accent: {
          purple: '#8b5cf6',
          'purple-hover': '#7c3aed',
          blue: '#3b82f6',
          'blue-hover': '#2563eb',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          orange: '#f97316',
          cyan: '#06b6d4',
          pink: '#ec4899',
        },
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e',
          muted: '#484f58',
          link: '#58a6ff',
        },
        status: {
          active: '#10b981',
          away: '#f59e0b',
          offline: '#484f58',
        },
        priority: {
          high: '#ef4444',
          medium: '#f59e0b',
          low: '#10b981',
        },
        tag: {
          ui: '#3b82f6',
          bug: '#ef4444',
          feature: '#8b5cf6',
          docs: '#06b6d4',
          backend: '#f59e0b',
          design: '#ec4899',
          performance: '#10b981',
          review: '#6366f1',
        },
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        'gradient-blue': 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        'gradient-green': 'linear-gradient(135deg, #10b981, #059669)',
        'gradient-card': 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05))',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5)',
        glow: '0 0 20px rgba(139,92,246,0.3)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.3)',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        pulse: 'pulse 2s infinite',
        shimmer: 'shimmer 1.5s infinite',
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
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
