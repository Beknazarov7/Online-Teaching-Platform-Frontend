/**
 * Tailwind config — color tokens + typography + spacing taken from the
 * Stitch design system. Light values are the same as the Stitch theme;
 * dark values follow Material 3 dark theme mapping (lower-saturation
 * surfaces, higher-luminance "on" colors).
 *
 * Dark mode: class-based. Toggle by adding/removing `dark` on <html>.
 * Use it with `dark:bg-...` variants throughout the UI.
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Stitch palette — these are the named tokens used directly in markup.
        primary: '#003fb1',
        'on-primary': '#ffffff',
        'primary-container': '#1a56db',
        'on-primary-container': '#d4dcff',
        'primary-fixed': '#dbe1ff',
        'primary-fixed-dim': '#b5c4ff',
        'on-primary-fixed': '#00174d',
        'on-primary-fixed-variant': '#003dab',

        secondary: '#5c5f60',
        'on-secondary': '#ffffff',
        'secondary-container': '#dee0e2',
        'on-secondary-container': '#606365',
        'secondary-fixed': '#e1e2e4',
        'secondary-fixed-dim': '#c5c6c8',
        'on-secondary-fixed': '#191c1e',
        'on-secondary-fixed-variant': '#444749',

        tertiary: '#852b00',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#ad3b00',
        'on-tertiary-container': '#ffd4c5',
        'tertiary-fixed': '#ffdbcf',
        'tertiary-fixed-dim': '#ffb59a',
        'on-tertiary-fixed': '#380d00',
        'on-tertiary-fixed-variant': '#802a00',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        background: '#f9f9ff',
        'on-background': '#121c2a',
        surface: '#f9f9ff',
        'on-surface': '#121c2a',
        'on-surface-variant': '#434654',
        'surface-variant': '#d9e3f7',
        'surface-dim': '#d0daef',
        'surface-bright': '#f9f9ff',
        'surface-tint': '#1353d8',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff3ff',
        'surface-container': '#e6eeff',
        'surface-container-high': '#dee9fd',
        'surface-container-highest': '#d9e3f7',
        'inverse-surface': '#273140',
        'inverse-on-surface': '#ebf1ff',
        'inverse-primary': '#b5c4ff',

        outline: '#737686',
        'outline-variant': '#c3c5d7',

        // Dark-mode palette — applied via `dark:` variants in components,
        // OR via the `dark-*` aliases below if a component needs both.
        // We keep the same token *names* so markup stays readable.
        'dark-background': '#0e1422',
        'dark-on-background': '#dde2ed',
        'dark-surface': '#0e1422',
        'dark-on-surface': '#dde2ed',
        'dark-on-surface-variant': '#c3c5d7',
        'dark-surface-container-lowest': '#0a1020',
        'dark-surface-container-low': '#161c2a',
        'dark-surface-container': '#1a2030',
        'dark-surface-container-high': '#222a3b',
        'dark-surface-container-highest': '#2c354a',
        'dark-outline-variant': '#434654',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        gutter: '20px',
        'container-max': '1440px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        h1: ['30px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-base': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        button: ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      maxWidth: {
        'container-max': '1440px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
