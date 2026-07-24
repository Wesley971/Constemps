/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f2f3f5',
        ink: '#17181c',
        inksoft: '#5b5e68',
        line: 'rgba(23,24,28,0.09)',
        'canvas-dot': 'rgba(23,24,28,0.035)',
        scrim: 'rgba(23,24,28,0.45)',
        'scrim-soft': 'rgba(23,24,28,0.24)',
        glass: 'rgba(255,255,255,0.7)',
        'glass-on-dark': 'rgba(255,255,255,0.08)',
        teal: {
          DEFAULT: '#0f9d8f',
          deep: '#0b7d72',
          tint: '#e7f5f1',
        },
        apricot: {
          DEFAULT: '#fb923c',
          deep: '#e07a1f',
        },
        success: {
          DEFAULT: '#0f9d6f',
          deep: '#0b7d58',
          tint: '#e6f5ee',
        },
        warning: {
          DEFAULT: '#fb923c',
          deep: '#e07a1f',
          tint: '#fdf1e4',
        },
        danger: {
          DEFAULT: '#d64545',
          deep: '#b23434',
          tint: '#fbe9e9',
        },
        info: {
          DEFAULT: '#3b7dd8',
          deep: '#2e63ad',
          tint: '#e8f0fc',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display-lg': ['34px', { lineHeight: '1.05', fontWeight: '800' }],
        'display-md': ['24px', { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm': ['17px', { lineHeight: '1.2', fontWeight: '700' }],
        stat: ['40px', { lineHeight: '1', fontWeight: '700' }],
        h1: ['40px', { lineHeight: '1.08', fontWeight: '800' }],
        h2: ['28px', { lineHeight: '1.15', fontWeight: '700' }],
        h3: ['20px', { lineHeight: '1.2', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '1.55', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13.5px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        label: ['13px', { lineHeight: '1.3', fontWeight: '500' }],
        quote: ['19px', { lineHeight: '1.5', fontWeight: '500' }],
        micro: ['10.5px', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.16em' }],
        code: ['13px', { lineHeight: '1.6', fontWeight: '400' }],
      },
      letterSpacing: {
        micro: '0.16em',
        tight: '-0.01em',
      },
      borderRadius: {
        tile: '26px',
        pill: '999px',
        sm: '14px',
        xs: '10px',
        input: '14px',
        modal: '24px',
      },
      boxShadow: {
        soft: '0 14px 34px -18px rgba(20,22,28,0.18)',
        lift: '0 22px 50px -22px rgba(20,22,28,0.28)',
        'glow-teal': '0 18px 40px -14px rgba(15,157,143,0.45)',
        focus: '0 0 0 3px rgba(15,157,143,0.35)',
        'elevation-0': 'none',
        'elevation-1': '0 1px 2px rgba(20,22,28,0.06), 0 1px 1px rgba(20,22,28,0.04)',
        'elevation-2': '0 14px 34px -18px rgba(20,22,28,0.18)',
        'elevation-3': '0 22px 50px -22px rgba(20,22,28,0.28)',
        'elevation-4': '0 32px 70px -24px rgba(20,22,28,0.38)',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(rgba(23,24,28,0.035) 1px, transparent 1px)',
        'teal-deep': 'linear-gradient(135deg, #0f9d8f, #135e56)',
        'cta-glow': 'radial-gradient(circle, #0f9d8f 0%, transparent 70%)',
        'photo-overlay': 'linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0) 55%)',
      },
      blur: {
        glass: '10px',
        glow: '70px',
      },
      transitionTimingFunction: {
        bounce: 'cubic-bezier(.34,1.56,.64,1)',
        standard: 'cubic-bezier(.4,0,.2,1)',
      },
      transitionDuration: {
        tile: '350ms',
        fast: '150ms',
        base: '200ms',
        slow: '350ms',
      },
      maxWidth: {
        wrap: '1040px',
      },
      minHeight: {
        hit: '44px',
      },
      minWidth: {
        hit: '44px',
      },
      zIndex: {
        base: '0',
        dropdown: '100',
        sticky: '200',
        drawer: '300',
        modal: '400',
        toast: '500',
        tooltip: '600',
      },
      keyframes: {
        'skeleton-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.55' },
        },
      },
      animation: {
        'skeleton-pulse': 'skeleton-pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
