/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4EEE3',
        paper: '#FBF8F3',
        'paper-sunken': '#E9E1D2',
        ink: '#211D19',
        inksoft: '#4A4339',
        inkfaint: '#8A8074',
        line: 'rgba(33,29,25,0.14)',
        'line-strong': 'rgba(33,29,25,0.26)',
        'canvas-dot': 'rgba(33,29,25,0.06)',
        scrim: 'rgba(28,24,21,0.5)',
        indigo: {
          DEFAULT: '#33465B',
          deep: '#28394A',
          tint: '#E2E7EC',
        },
        clay: {
          DEFAULT: '#A85A34',
          deep: '#8A4726',
          tint: '#F1E1D2',
        },
        success: {
          DEFAULT: '#4B7A5B',
          deep: '#3C6249',
          tint: '#E3ECE4',
        },
        warning: {
          DEFAULT: '#A97A2E',
          deep: '#8A6224',
          tint: '#F1E7D3',
        },
        danger: {
          DEFAULT: '#9C4438',
          deep: '#7C362C',
          tint: '#F0DFDA',
        },
        info: {
          DEFAULT: '#33465B',
          deep: '#28394A',
          tint: '#E2E7EC',
        },
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', '"Times New Roman"', 'serif'],
        body: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['52px', { lineHeight: '1.06', fontWeight: '600' }],
        'display-lg': ['38px', { lineHeight: '1.1', fontWeight: '600' }],
        'display-md': ['26px', { lineHeight: '1.18', fontWeight: '600' }],
        'display-sm': ['19px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['17px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['13.5px', { lineHeight: '1.55', fontWeight: '400' }],
        label: ['13px', { lineHeight: '1.3', fontWeight: '500' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        micro: ['10.5px', { lineHeight: '1.3', fontWeight: '600' }],
      },
      letterSpacing: {
        micro: '0.14em',
        tight: '-0.011em',
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '22px',
        pill: '999px',
      },
      boxShadow: {
        1: '0 1px 2px rgba(33,29,25,0.07)',
        2: '0 6px 18px -10px rgba(33,29,25,0.16)',
        3: '0 18px 36px -14px rgba(33,29,25,0.18)',
        modal: '0 28px 56px -18px rgba(33,29,25,0.24)',
        'focus-ring': '0 0 0 3px rgba(51,70,91,0.25)',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(rgba(33,29,25,0.06) 1px, transparent 1px)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(.2,.7,.3,1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '380ms',
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
