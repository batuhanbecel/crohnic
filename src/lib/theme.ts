import { Platform } from 'react-native';

/**
 * Crohnic palette: ink + lettuce + apricot + periwinkle on a soft pistachio paper.
 * Verdict colours follow iOS system colours so they read instantly.
 */
export const palette = {
  paper: '#F4F6EE',
  ink: '#1D2B22',
  inkSoft: '#5E6B62',
  inkFaint: '#9AA59D',
  hairline: 'rgba(29,43,34,0.08)',

  lettuce: '#5FAE35',
  lettuceDeep: '#3F7F26',
  lettuceSoft: '#E3F2CF',
  apricot: '#FFB677',
  apricotSoft: '#FFEBD6',
  peri: '#6E6AF0',
  periSoft: '#E7E6FF',
  sky: '#3E9BE0',
  skySoft: '#DDEEFB',

  good: '#2DB357',
  goodSoft: '#DDF4E3',
  warn: '#E8890C',
  warnSoft: '#FDEFD9',
  bad: '#E5483D',
  badSoft: '#FCE3E0',
};

/** Translucent surfaces that sit on the gradient background. */
export const surface = {
  card: 'rgba(255,255,255,0.72)',
  cardStrong: 'rgba(255,255,255,0.9)',
  cardBorder: 'rgba(255,255,255,0.9)',
  well: 'rgba(29,43,34,0.05)',
};

export const radius = { sm: 12, md: 18, lg: 26, xl: 32, pill: 999 };

const rounded = Platform.select({ ios: 'ui-rounded', default: undefined });

export const type = {
  display: { fontFamily: rounded, fontWeight: '800' as const },
  rounded: { fontFamily: rounded, fontWeight: '700' as const },
  body: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
};

export const shadow = {
  shadowColor: '#2B3A2F',
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
};
