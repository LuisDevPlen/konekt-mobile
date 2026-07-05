export const colors = {
  primary: '#EA1D2C',
  primaryDark: '#C31825',
  bg: '#FFFFFF',
  bgSecondary: '#F7F7F7',
  bgSection: '#F2F2F2',
  searchBg: '#F2F2F2',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#717171',
  textMuted: '#A6A6A6',
  border: '#EBEBEB',
  success: '#50A773',
  successBright: '#00A335',
  danger: '#EA1D2C',
  white: '#FFFFFF',
  chipBg: '#FFF5F5',
  promoPurple: '#9B59B6',
  promoGreen: '#1F7A4C',
  overlay: 'rgba(0,0,0,0.45)',
  tabInactive: '#717171',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  footer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
};

/** @deprecated use named exports colors, radius, shadow */
export const ifood = { colors, radius, shadow };

export function storeAccent(slug: string): string {
  const map: Record<string, string> = {
    alpha: '#EA1D2C',
    beta: '#FF922B',
    system: '#717171',
  };
  return map[slug] || '#EA1D2C';
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  title: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 16 },
};

export const touchTarget = 44;

export const tabBarStyle = {
  height: 60,
  paddingBottom: 8,
  paddingTop: 6,
  borderTopColor: colors.border,
  backgroundColor: colors.bg,
};
