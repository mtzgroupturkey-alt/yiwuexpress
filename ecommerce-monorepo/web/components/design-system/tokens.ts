/**
 * Central design tokens extracted from Design-3 Homepage.
 * Source of truth for storefront colors, typography, radii, elevation, and layout.
 */
export const DESIGN_TOKENS = {
  colors: {
    brandNavy: '#00407a',
    brandNavyHover: '#003366',
    brandNavyLight: '#EFF6FF',
    accentAmber: '#F5A602',
    accentAmberHover: '#E09500',
    accentAmberLight: '#FEF3C7',
    canvasBg: '#F8FAFC',
    cardBg: '#FFFFFF',
    borderDefault: '#E2E8F0', // slate-200
    borderLight: '#F1F5F9',   // slate-100
    textPrimary: '#0F172A',   // slate-900
    textSecondary: '#475569', // slate-600
    textMuted: '#64748B',     // slate-500
    success: '#16A34A',       // emerald-600
    danger: '#DC2626',        // red-600
  },
  radius: {
    xs: 'rounded',       // 4px
    sm: 'rounded-md',    // 6px
    md: 'rounded-lg',    // 8px
    card: 'rounded-xl',  // 12px
    box: 'rounded-2xl',  // 16px
    pill: 'rounded-full',
  },
  shadows: {
    subtle: 'shadow-2xs',
    card: 'shadow-xs',
    hover: 'hover:shadow-md hover:shadow-slate-900/5',
    elevation: 'shadow-lg shadow-slate-900/10',
    accentHover: 'hover:shadow-[0_8px_20px_rgba(0,64,122,0.06)]',
  },
  layout: {
    maxWidth: 'max-w-[1440px]',
    paddingX: 'px-4 lg:px-6',
    paddingSectionY: 'py-6 sm:py-8',
  },
} as const;
