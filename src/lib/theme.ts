import { Appearance, Platform } from 'react-native';

/**
 * Crohnic design tokens (v2, HIG-based).
 *
 * Principles
 * - The app is a quiet, native utility with one character: Kıvırcık. Boldness lives in the
 *   mascot and the large rounded titles; everything else defers to content.
 * - Two layers (HIG › Materials): content sits on opaque grouped surfaces; Liquid Glass is only
 *   used for floating controls (tab bar, search, the add panel, the floating gear).
 * - One accent (lettuce green) for the primary action and selection. Signal colours mean one
 *   thing each: green = gentle, amber = careful, red = risky, flare orange = "atak".
 * - Every text colour clears 4.5:1 on both the background and a card (numbers in comments).
 *
 * Keys are kept from v1 so screens don't change; values follow the roles below.
 *   paper=background · ink=label · inkSoft=secondary label · inkFaint=tertiary label
 *   lettuce=accent fill · lettuceDeep=accent text · *Soft=tinted fills
 */
const LIGHT = {
  paper: '#F2F4F0', // grouped background, faint green-grey
  ink: '#17201A', // 15.1:1
  onInk: '#FFFFFF',
  inkSoft: '#59625C', // 5.7:1
  inkFaint: '#666E68', // 4.7:1
  hairline: 'rgba(23,32,26,0.12)',

  lettuce: '#2E7D32', // accent; white on it 5.1:1
  lettuceDeep: '#256B2B', // accent text 5.9:1
  lettuceSoft: '#E3EFE0',
  apricot: '#A9520A', // symptoms; 4.9:1
  apricotSoft: '#F9EADB',
  peri: '#5452D6', // medication; 5.3:1
  periSoft: '#E8E8FB',
  sky: '#0B67C2', // toilet; 5.1:1
  skySoft: '#E0ECF8',
  plum: '#8A3FB0', // evening check-in; 5.8:1
  plumSoft: '#F1E6F7',

  flare: '#C9480F', // atak; white on it 4.8:1
  flareDeep: '#B23E0C', // atak text 5.3:1
  flareSoft: '#FBE6DB',
  flareStrong: '#C9480F',

  good: '#1E7F3A', // 4.6:1
  goodSoft: '#E1F1E5',
  warn: '#9A6200', // 4.6:1
  warnSoft: '#F7ECD6',
  bad: '#C42B22', // 5.1:1
  badSoft: '#F9E3E1',
};

const DARK: typeof LIGHT = {
  paper: '#0B0D0C',
  ink: '#EEF2EE', // 17.2:1
  onInk: '#121614',
  inkSoft: '#A9B1AB', // 8.9:1
  inkFaint: '#8C948E', // 6.3:1
  hairline: 'rgba(238,242,238,0.14)',

  lettuce: '#2F9E44', // white on it 3.5:1 (bold labels only)
  lettuceDeep: '#6FD67F', // 10.8:1
  lettuceSoft: '#17301C',
  apricot: '#FF9F45',
  apricotSoft: '#382412',
  peri: '#8E8CFF',
  periSoft: '#24234A',
  sky: '#4AA8FF',
  skySoft: '#10263D',
  plum: '#C98BF0',
  plumSoft: '#2E1D3A',

  flare: '#FF7A45',
  flareDeep: '#FF9466',
  flareSoft: '#3A1E12',
  flareStrong: '#D2551F',

  good: '#3CCB66',
  goodSoft: '#13301C',
  warn: '#F2B33D',
  warnSoft: '#352A0C',
  bad: '#FF6259',
  badSoft: '#3B1714',
};

const SURFACE_LIGHT = {
  card: '#FFFFFF',
  cardStrong: '#F2F4F0', // text fields inside cards
  cardBorder: 'transparent',
  well: 'rgba(23,32,26,0.06)', // gray fill for controls
  glassFill: 'rgba(255,255,255,0.6)',
  glassBorder: 'rgba(255,255,255,0.7)',
  scrim: 'rgba(242,244,240,0.7)',
  sheet: '#FFFFFF',
  /** the only colour wash behind content: a soft warm light during a flare */
  glow: { calm: ['#F2F4F0', '#F2F4F0', '#F2F4F0'], flare: ['#F9D9C8', '#F2F4F0', '#F2F4F0'] },
  glowOpacity: 1,
};

const SURFACE_DARK: typeof SURFACE_LIGHT = {
  card: '#1A1D1B',
  cardStrong: '#242826',
  cardBorder: 'transparent',
  well: 'rgba(238,242,238,0.08)',
  glassFill: 'rgba(30,34,32,0.6)',
  glassBorder: 'rgba(255,255,255,0.1)',
  scrim: 'rgba(11,13,12,0.7)',
  sheet: '#1A1D1B',
  glow: { calm: ['#0B0D0C', '#0B0D0C', '#0B0D0C'], flare: ['#3A1A0E', '#0B0D0C', '#0B0D0C'] },
  glowOpacity: 1,
};

export type Scheme = 'light' | 'dark';
export const scheme: Scheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
export const isDark = scheme === 'dark';

export const palette = isDark ? DARK : LIGHT;

/** Surfaces of the content layer (opaque) and the glass fallback. */
export const surface = isDark ? SURFACE_DARK : SURFACE_LIGHT;

/** Relative luminance of a #RRGGBB colour (0 dark … 1 light). */
function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** Foreground for a filled control: white on dark/saturated fills, deep ink on light ones. */
export function onTint(tint: string | undefined) {
  if (!tint) return '#FFFFFF';
  if (tint === palette.ink) return palette.onInk;
  return luminance(tint) > 0.36 ? '#121614' : '#FFFFFF';
}

/** v2 signal colours are already text-safe; kept so callers don't change. */
export function readable(c: string) {
  return c;
}

/** Corner radii: controls are capsules, cards use one radius, inner wells a smaller one. */
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

/** One set of sizes for the whole app (44 pt minimum touch target). */
export const size = {
  button: 50,
  buttonSm: 40,
  icon: 36,
  tile: 128,
  stat: 86,
  gap: 12,
  pad: 16,
};

const rounded = Platform.select({ ios: 'ui-rounded', default: undefined });

/**
 * Type: SF Pro for everything people read and tap; SF Pro Rounded only for large titles
 * and big numbers, which is where the brand voice lives.
 */
export const type = {
  display: { fontFamily: rounded, fontWeight: '800' as const },
  rounded: { fontFamily: rounded, fontWeight: '700' as const },
  body: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
};

/** Content cards don't float; separation comes from the background contrast. */
export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
};
