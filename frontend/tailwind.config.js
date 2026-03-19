/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#0A0C1A',
          surface: '#111326',
          elevated:'#181B2E',
          border:  '#1E2240',
          hover:   '#222542',
        },
        brand: {
          DEFAULT: '#FF6B00',
          light:   '#FF8C33',
          dim:     '#FF6B0022',
          glow:    '#FF6B0044',
        },
        teal: {
          DEFAULT: '#00CCA3',
          dim:     '#00CCA322',
        },
        text: {
          primary:   '#EEF0FF',
          secondary: '#8F91B0',
          muted:     '#545670',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger:  '#EF4444',
        info:    '#3B82F6',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body:    ['Nunito', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontWeight: {
        '500': '500',
        '600': '600',
        '700': '700',
        '800': '800',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern':     "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E2240' fill-opacity='0.6'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-slow':  'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up':    'slideUp 0.5s ease forwards',
        'fade-in':     'fadeIn 0.4s ease forwards',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'marquee':     'marquee 25s linear infinite',
        'shimmer':     'shimmer 2s linear infinite',
      },
      keyframes: {
        float:     { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        glowPulse: { '0%,100%': { boxShadow: '0 0 20px #FF6B0033' }, '50%': { boxShadow: '0 0 40px #FF6B0066' } },
        marquee:   { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'brand':    '0 0 30px #FF6B0030',
        'card':     '0 4px 24px #00000040',
        'glow-sm':  '0 0 12px #FF6B0040',
      },
    },
  },
  plugins: [],
}
