import { AccessibilityProps, Platform } from 'react-native'

export const a11y = {
  // Touch target minimum size (Apple HIG & Android Material Design)
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
  },

  // Color contrast helper (WCAG AA compliance)
  contrast: {
    // WCAG AA: 4.5:1 for normal text, 3:1 for large text
    text: '4.5:1',
    largeText: '3:1',
  },

  // Accessibility labels
  labels: {
    product: (name: string, price: number) =>
      `${name}, priced at $${price.toFixed(2)}`,
    cart: (count: number) =>
      count > 0 ? `${count} items in cart` : 'Cart is empty',
    search: 'Search products',
    menu: 'Open navigation menu',
    close: 'Close',
    back: 'Go back',
    favorite: (isFavorite: boolean) =>
      isFavorite ? 'Remove from favorites' : 'Add to favorites',
  },

  // Role helpers
  roles: {
    button: 'button' as const,
    link: 'link' as const,
    heading: 'header' as const,
    image: 'image' as const,
    list: 'list' as const,
  },
}

export function getAccessibilityProps(
  type: 'button' | 'link' | 'image' | 'heading',
  label?: string,
  hint?: string
): AccessibilityProps {
  const props: AccessibilityProps = {
    accessible: true,
    accessibilityRole: type,
  }

  if (label) {
    props.accessibilityLabel = label
  }

  if (hint) {
    props.accessibilityHint = hint
  }

  return props
}

// Check if a touch target meets minimum size requirements
export function isValidTouchTarget(width: number, height: number): boolean {
  return width >= a11y.touchTarget.minWidth && height >= a11y.touchTarget.minHeight
}

// Announce screen reader message (for important updates)
export function announceForAccessibility(message: string) {
  if (Platform.OS === 'ios') {
    // iOS VoiceOver announcement
    // @ts-ignore - AccessibilityInfo is available
    const AccessibilityInfo = require('react-native').AccessibilityInfo
    AccessibilityInfo.announceForAccessibility(message)
  } else if (Platform.OS === 'android') {
    // Android TalkBack announcement
    // @ts-ignore
    const AccessibilityInfo = require('react-native').AccessibilityInfo
    AccessibilityInfo.announceForAccessibility(message)
  }
}
