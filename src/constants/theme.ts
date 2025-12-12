
// Design System Tokens for Gymie App

export const colors = {
  light: {
    background: '#F7FAFC',
    card: '#FFFFFF',
    textPrimary: '#0B0B0B',
    textSecondary: '#374151',
    accentBlue: '#0A74FF',
    softAccent: '#5EA1FF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E5E7EB',
    inputBackground: '#F3F4F6',
    shadow: 'rgba(0, 0, 0, 0.1)',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    progressBackground: '#E5E7EB',
    caloriesRing: '#0A74FF',
    proteinColor: '#10B981',
    carbsColor: '#F59E0B',
    fatColor: '#EF4444',
    stepsColor: '#8B5CF6',
    heartRateColor: '#EC4899',
  },
  dark: {
    background: '#0B1220',
    card: '#0F1724',
    textPrimary: '#E6EEF8',
    textSecondary: '#94A3B8',
    accentBlue: '#5EA1FF',
    softAccent: '#0A74FF',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    border: '#1E293B',
    inputBackground: '#1E293B',
    shadow: 'rgba(0, 0, 0, 0.3)',
    tabBarBackground: '#0F1724',
    tabBarBorder: '#1E293B',
    progressBackground: '#1E293B',
    caloriesRing: '#5EA1FF',
    proteinColor: '#34D399',
    carbsColor: '#FBBF24',
    fatColor: '#F87171',
    stepsColor: '#A78BFA',
    heartRateColor: '#F472B6',
  },
} as const;

export const typography = {
  headline: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  mono: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
  monoLarge: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 30,
    fontFamily: 'monospace',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const shadows = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
  },
} as const;

export type ThemeMode = 'light' | 'dark';
export type ColorScheme = typeof colors.light;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
