import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'

export const colors = {
  primary: '#1a3a5c',
  primaryLight: '#2a5a8c',
  primaryDark: '#0f2a44',
  secondary: '#c9a84c',
  secondaryLight: '#e8d48b',
  secondaryDark: '#b8943a',
  accent: '#e74c3c',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
}

export const typography = {
  heading: {
    fontFamily: 'System',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 'bold' as const,
  },
  subheading: {
    fontFamily: 'System',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'System',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'normal' as const,
  },
  caption: {
    fontFamily: 'System',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 'normal' as const,
  },
  small: {
    fontFamily: 'System',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 'normal' as const,
  },
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
}

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primary + '20',
    secondary: colors.secondary,
    secondaryContainer: colors.secondary + '20',
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    onSurface: colors.textSecondary,
    error: colors.error,
  },
  roundness: radius.md,
}

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primaryLight,
    primaryContainer: colors.primary + '40',
    secondary: colors.secondaryLight,
    secondaryContainer: colors.secondary + '40',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    onSurface: '#b0b0b0',
    error: colors.error,
  },
  roundness: radius.md,
}
