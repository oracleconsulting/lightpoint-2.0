// ============================================================================
// LIGHTPOINT BLOG DESIGN SYSTEM
// Clean slate rebuild - matches Gamma output quality
// ============================================================================

// ----------------------------------------------------------------------------
// COLOR PALETTE
// ----------------------------------------------------------------------------

export const colors = {
  // Text colors
  heading: '#1e293b',      // slate-800 - primary headings
  body: '#374151',         // gray-700 - body text
  muted: '#6b7280',        // gray-500 - secondary text
  light: '#9ca3af',        // gray-400 - tertiary text
  
  // Brand colors (from Lightpoint logo)
  primary: '#2563eb',      // blue-600 - primary accent
  primaryDark: '#1e3a5f',  // custom navy - deep accent
  primaryLight: '#3b82f6', // blue-500 - lighter accent
  gold: '#d4a84b',         // brand gold - success/highlight
  goldLight: '#e8b84a',    // lighter gold
  
  // Background colors
  white: '#ffffff',
  offWhite: '#f8fafc',     // slate-50 - subtle background
  gray: '#f3f4f6',         // gray-100 - card backgrounds
  grayDark: '#e5e7eb',     // gray-200 - borders
  blueLight: '#dbeafe',    // blue-100 - callout backgrounds
  blueLighter: '#eff6ff',  // blue-50 - subtle blue tint
  
  // Chart colors (navy to light blue progression)
  chart: {
    primary: '#1e3a5f',    // navy
    secondary: '#2563eb',  // blue-600
    tertiary: '#3b82f6',   // blue-500
    quaternary: '#60a5fa', // blue-400
    quinary: '#93c5fd',    // blue-300
  },
  
  // Semantic colors
  success: '#10b981',      // emerald-500
  warning: '#f59e0b',      // amber-500
  error: '#ef4444',        // red-500
  info: '#3b82f6',         // blue-500
} as const;

// ----------------------------------------------------------------------------
// TYPOGRAPHY
// ----------------------------------------------------------------------------

export const typography = {
  // Font family
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  
  // Font sizes
  sizes: {
    hero: '48px',          // Hero section title
    h1: '40px',            // Page titles
    h2: '32px',            // Section headings
    h3: '24px',            // Subsection headings
    h4: '20px',            // Card titles
    body: '18px',          // Body text (larger for readability)
    bodySmall: '16px',     // Secondary body text
    small: '14px',         // Captions, metadata
    tiny: '12px',          // Fine print
    stat: '48px',          // Large statistics
    statSmall: '36px',     // Medium statistics
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,            // Headings
    snug: 1.4,             // Subheadings
    normal: 1.5,           // Short text
    relaxed: 1.7,          // Body text
    loose: 1.8,            // Long-form reading
  },
  
  // Font weights
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

// ----------------------------------------------------------------------------
// SPACING
// ----------------------------------------------------------------------------

export const spacing = {
  // Base units
  px: '1px',
  0: '0',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  
  // Semantic spacing
  sectionY: '64px',        // Vertical section padding
  sectionX: '32px',        // Horizontal section padding
  cardPadding: '24px',     // Card internal padding
  componentGap: '24px',    // Gap between components
  paragraphGap: '16px',    // Gap between paragraphs
  
  // Max widths
  maxWidth: '1200px',      // Maximum container width
  contentWidth: '720px',   // Optimal reading width
  wideWidth: '960px',      // Wide content width
} as const;

// ----------------------------------------------------------------------------
// BORDERS & SHADOWS
// ----------------------------------------------------------------------------

export const borders = {
  // Border radius
  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  // Border widths
  width: {
    thin: '1px',
    medium: '2px',
    thick: '4px',
  },
  
  // Accent borders
  accent: `4px solid ${colors.primary}`,
  accentGold: `4px solid ${colors.gold}`,
  subtle: `1px solid ${colors.grayDark}`,
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// ----------------------------------------------------------------------------
// BREAKPOINTS
// ----------------------------------------------------------------------------

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ----------------------------------------------------------------------------
// TRANSITIONS
// ----------------------------------------------------------------------------

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
  
  // Named transitions
  colors: 'color 200ms ease-in-out, background-color 200ms ease-in-out, border-color 200ms ease-in-out',
  transform: 'transform 200ms ease-in-out',
  all: 'all 200ms ease-in-out',
} as const;

// ----------------------------------------------------------------------------
// TAILWIND CLASS HELPERS
// ----------------------------------------------------------------------------

// These are the exact Tailwind classes to use for each scenario
export const tw = {
  // Container
  container: 'max-w-5xl mx-auto px-8',
  
  // Text
  heading1: 'text-5xl font-bold text-slate-800 leading-tight',
  heading2: 'text-4xl font-bold text-slate-800',
  heading3: 'text-2xl font-bold text-slate-800',
  heading4: 'text-xl font-bold text-slate-800',
  body: 'text-lg text-gray-600 leading-relaxed',
  bodySmall: 'text-base text-gray-600',
  muted: 'text-sm text-gray-500',
  
  // Cards
  card: 'bg-gray-100 rounded-lg p-6',
  cardWhite: 'bg-white rounded-lg p-6 shadow-sm',
  
  // Stats
  statValue: 'text-5xl font-bold text-slate-800',
  statLabel: 'font-semibold text-slate-700',
  statDesc: 'text-sm text-gray-500',
  
  // Sections
  section: 'py-16 px-8',
  sectionWhite: 'bg-white py-16 px-8',
  sectionGray: 'bg-gray-50 py-16 px-8',
  
  // Grids
  grid2: 'grid md:grid-cols-2 gap-6',
  grid3: 'grid md:grid-cols-3 gap-6',
  grid4: 'grid grid-cols-2 md:grid-cols-4 gap-8',
  
  // Callouts
  calloutBlue: 'bg-blue-100 rounded-lg p-5',
  calloutBorder: 'border-l-4 border-blue-500 bg-gray-50 rounded-r-lg pl-6 py-4',
  
  // Buttons
  buttonPrimary: 'bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors',
  buttonSecondary: 'bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors',
} as const;

// ----------------------------------------------------------------------------
// COMPONENT DEFAULTS
// ----------------------------------------------------------------------------

export const componentDefaults = {
  // Section padding
  sectionPadding: 'py-16 px-8',
  
  // Image placeholders
  imagePlaceholder: 'bg-gray-100 rounded-lg flex items-center justify-center',
  
  // Aspect ratios
  imageAspect: 'aspect-[4/3]',
  heroAspect: 'aspect-[16/9]',
  
  // Animation
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
} as const;

// ----------------------------------------------------------------------------
// EXPORT ALL
// ----------------------------------------------------------------------------

export const theme = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  breakpoints,
  transitions,
  tw,
  componentDefaults,
} as const;

export default theme;

