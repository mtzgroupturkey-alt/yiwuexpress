/**
 * Motion Tokens and Framer Motion Variants
 * Strict TypeScript 'as const' definitions for animations, physics, and reduced-motion fallbacks.
 */

export const MOTION_TOKENS = {
  // Spring configurations (stiffness, damping)
  springTactile: { type: 'spring', stiffness: 400, damping: 25 } as const,
  springSmooth: { type: 'spring', stiffness: 260, damping: 20 } as const,
  springGentle: { type: 'spring', stiffness: 180, damping: 22 } as const,

  // Easing bezier curves
  easeOutCubic: [0.215, 0.61, 0.355, 1.0] as const,
  easeInOutCubic: [0.645, 0.045, 0.355, 1.0] as const,
  easeOutExpo: [0.16, 1, 0.3, 1] as const,

  // Standard Durations (seconds)
  durationFast: 0.18,
  durationBase: 0.32,
  durationSlow: 0.55,

  // Standard Viewport Trigger Config
  viewportOnce: { once: true, margin: '-40px' } as const,
} as const;

/**
 * Reusable Framer Motion Variants
 */

export const FADE_UP_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: (customDelay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TOKENS.durationBase,
      ease: MOTION_TOKENS.easeOutCubic,
      delay: customDelay,
    },
  }),
} as const;

export const FADE_IN_VARIANTS = {
  hidden: { opacity: 0 },
  visible: (customDelay: number = 0) => ({
    opacity: 1,
    transition: {
      duration: MOTION_TOKENS.durationBase,
      ease: MOTION_TOKENS.easeOutCubic,
      delay: customDelay,
    },
  }),
} as const;

export const STAGGER_CONTAINER = (staggerDelay = 0.05, delayChildren = 0) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: delayChildren,
    },
  },
});

export const STAGGER_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: MOTION_TOKENS.springGentle,
  },
} as const;

export const SCALE_CARD_VARIANTS = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: (customDelay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      ...MOTION_TOKENS.springSmooth,
      delay: customDelay,
    },
  }),
} as const;

export const SLIDE_IN_LEFT_VARIANTS = {
  hidden: { opacity: 0, x: -20 },
  visible: (customDelay = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: MOTION_TOKENS.durationBase,
      ease: MOTION_TOKENS.easeOutCubic,
      delay: customDelay,
    },
  }),
} as const;

export default MOTION_TOKENS;
