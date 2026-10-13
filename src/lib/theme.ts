import { Appearance, Platform } from 'react-native';

/**
 * Crohnic palette: ink + lettuce + apricot + periwinkle on a soft pistachio paper.
 * Verdict colours follow iOS system colours so they read instantly.
 *
 * Light and dark sets share keys. The scheme is picked once at launch; if the
 * system appearance changes while the app is open, the root layout reloads the
 * JS bundle so every screen picks up the new values.
 */
const LIGHT = {
  paper: '#F4F6EE',
  ink: '#1D2B22',
  /** text/icon colour on top of an `ink` tint */
  onInk: '#FFFFFF',
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

  flare: '#F26B3A',
  flareDeep: '#D9531F',
  flareSoft: '#FFE6DA',

  good: '#2DB357',
  goodSoft: '#DDF4E3',
  warn: '#D99A00',
  warnSoft: '#FDF3D3',
  bad: '#E5483D',
  badSoft: '#FCE3E0',
};

const DARK: typeof LIGHT = {
  paper: '#0E1410',
  ink: '#EAF0E5',
  onInk: '#13201A',
  inkSoft: '#A3AFA6',
  inkFaint: '#6D7A71',
  hairline: 'rgba(234,240,229,0.1)',

  lettuce: '#6CC23F',
  lettuceDeep: '#8BD45F',
  lettuceSoft: '#1D3317',
  apricot: '#FFB677',
  apricotSoft: '#3A2918',
  peri: '#8B87FF',
  periSoft: '#25244A',
  sky: '#55AEF0',
  skySoft: '#15293A',

  flare: '#FF7442',
  flareDeep: '#FF8656',
  flareSoft: '#3B2015',

  good: '#3AC968',
  goodSoft: '#12301F',
  warn: '#F0B429',
  warnSoft: '#372C0E',
  bad: '#FF5E52',
  badSoft: '#3D1815',
};

const SURFACE_LIGHT = {
  card: 'rgba(255,255,255,0.72)',
  cardStrong: 'rgba(255,255,255,0.9)',
  cardBorder: 'rgba(255,255,255,0.9)',
  well: 'rgba(29,43,34,0.05)',
  glassFill: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(255,255,255,0.85)',
  scrim: 'rgba(244,246,238,0.55)',
  /** solid panel that slides over content (bottom menus) */
  sheet: '#FBFCF7',
  /** radial glows behind the content: calm / flare */
  glow: { calm: ['#C6E89B', '#FFD9B0', '#D9D7FF'], flare: ['#FFC2A3', '#FFDDB0', '#FFD0C6'] },
  glowOpacity: 1,
};

const SURFACE_DARK: typeof SURFACE_LIGHT = {
  card: 'rgba(30,40,34,0.72)',
  cardStrong: 'rgba(38,49,42,0.95)',
  cardBorder: 'rgba(255,255,255,0.07)',
  well: 'rgba(234,240,229,0.07)',
  glassFill: 'rgba(40,52,45,0.55)',
  glassBorder: 'rgba(255,255,255,0.12)',
  scrim: 'rgba(14,20,16,0.6)',
  sheet: '#1A241E',
  glow: { calm: ['#2C5A1C', '#5A3A1C', '#2E2C66'], flare: ['#6A2A12', '#5A3A14', '#5A2420'] },
  glowOpacity: 0.55,
};

export type Scheme = 'light' | 'dark';
export const scheme: Scheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
export const isDark = scheme === 'dark';

export const palette = isDark ? DARK : LIGHT;

/** Translucent surfaces that sit on the gradient background. */
export const surface = isDark ? SURFACE_DARK : SURFACE_LIGHT;

/** Foreground for a filled/tinted control: dark text on the light `ink` tint in dark mode, white otherwise. */
export function onTint(tint: string | undefined) {
  return tint === palette.ink ? palette.onInk : '#FFFFFF';
}

export const radius = { sm: 12, md: 18, lg: 24, xl: 30, pill: 999 };

/** One set of sizes for the whole app. */
export const size = {
  button: 50,
  buttonSm: 40,
  icon: 40,
  tile: 128,
  stat: 86,
  gap: 12,
  pad: 16,
};

const rounded = Platform.select({ ios: 'ui-rounded', default: undefined });

export const type = {
  display: { fontFamily: rounded, fontWeight: '800' as const },
  rounded: { fontFamily: rounded, fontWeight: '700' as const },
  body: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
};

export const shadow = {
  shadowColor: isDark ? '#000000' : '#2B3A2F',
  shadowOpacity: isDark ? 0.3 : 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
};
