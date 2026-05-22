/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#0b0f19',
          850: '#070a12',
          900: '#03050c',
          950: '#010206',
        },
        safety: {
          emerald: '#10b981',
          orange: '#f97316',
          crimson: '#ef4444',
          glow: '#3b82f6',
        }
      },
      boxShadow: {
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glass-glow': '0 0 20px 2px rgba(16, 185, 129, 0.15)',
        'crimson-glow': '0 0 25px 5px rgba(239, 68, 68, 0.3)',
        'neomorphic': '5px 5px 10px rgba(0, 0, 0, 0.5), -5px -5px 10px rgba(255, 255, 255, 0.02)',
        'neomorphic-inset': 'inset 3px 3px 6px rgba(0,0,0,0.6), inset -3px -3px 6px rgba(255,255,255,0.02)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'vignette-heartbeat': 'heartbeat 1.2s ease-in-out infinite',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.15 },
          '50%': { transform: 'scale(1.02)', opacity: 0.35 },
        }
      }
    },
  },
  plugins: [],
}
