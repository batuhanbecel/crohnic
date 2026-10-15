import { Appearance } from 'react-native';

/**
 * Crohnic design tokens (v3, brand sheet "Yeme. Kaydet. Anla. Kendin ol.").
 *
 * Brand palette: Ana Yeşil #145A32 · Doğal Yeşil #4CAF50 · Açık Yeşil #CFEA8E · Krem #FFF8E1 ·
 * Turuncu #FFA552 · Mercan #FF7B6B · Lila #B8A7F9 · Mavi #8EC5F7. Type: Nunito.
 *
 * How the brand maps onto the UI
 * - Krem is the page, white cards sit on it. Ana Yeşil is the one accent (primary button,
 *   selection, links). The pastel brand colours are fills; where they carry text or a thin
 *   glyph a deeper shade of the same hue is used so it clears 4.5:1 on white and on Krem.
 * - Icons sit in pastel rounded squares with the glyph in the deeper shade (brand icon style).
 * - Each colour means one thing: green = gentle/meals, Turuncu = careful + atak,
 *   Mercan = risky + symptoms, Mavi = medication, Lila = the day check-in (mood, sleep),
 *   warm brown on peach = toilet.
 *
 * Keys are kept from earlier versions so screens don't change:
 *   paper=background · ink=label · inkSoft=secondary · inkFaint=tertiary
 *   lettuce=accent fill · lettuceDeep=accent text · *Soft=tinted fills
 *   apricot=symptoms · peri=medication · sky=toilet · plum=check-in · flare=atak
 */
const LIGHT = {
  paper: '#FFF8E1', // Krem
  ink: '#17301F', // 12.9:1 on Krem
  onInk: '#FFFFFF',
  inkSoft: '#4F6155', // 6.2:1
  inkFaint: '#627166', // 4.8:1
  hairline: 'rgba(23,48,31,0.12)',

  lettuce: '#145A32', // Ana Yeşil; white on it 8.2:1
  lettuceDeep: '#145A32',
  lettuceSoft: '#EAF5CF', // Açık Yeşil, lightened
  apricot: '#B5382F', // symptoms, from Mercan; 5.4:1
  apricotSoft: '#FFE6E2',
  peri: '#22689F', // medication, from Mavi; 5.8:1
  periSoft: '#E2F0FD',
  sky: '#8A5228', // toilet, brown on peach; 6.0:1
  skySoft: '#FFE8D6',
  plum: '#6A4FD0', // check-in, from Lila; 5.9:1
  plumSoft: '#EEEAFE',

  flare: '#E0661C', // atak, from Turuncu; white bold labels 3.4:1
  flareDeep: '#A84B0E', // 5.4:1
  flareSoft: '#FFEBD6',
  flareStrong: '#E0661C',

  good: '#246D2F', // from Doğal Yeşil; 5.9:1
  goodSoft: '#E4F4D9',
  warn: '#9C5500', // from Turuncu; 5.2:1
  warnSoft: '#FFEDD2',
  bad: '#B5332A', // from Mercan; 5.6:1
  badSoft: '#FFE4E0',
};

const DARK: typeof LIGHT = {
  paper: '#0D1A12', // Ana Yeşil at night
  ink: '#F5F1DE', // Krem, 16:1
  onInk: '#0D1A12',
  inkSoft: '#B7C2B6', // 9.6:1
  inkFaint: '#93A093', // 6.5:1
  hairline: 'rgba(245,241,222,0.13)',

  lettuce: '#7CC36A', // dark label on it
  lettuceDeep: '#CFEA8E', // Açık Yeşil
  lettuceSoft: '#1E3A24',
  apricot: '#FF8F80', // Mercan
  apricotSoft: '#3D1E1A',
  peri: '#8EC5F7', // Mavi
  periSoft: '#16293B',
  sky: '#E9AE7C',
  skySoft: '#38261A',
  plum: '#B8A7F9', // Lila
  plumSoft: '#272241',

  flare: '#FFA552', // Turuncu
  flareDeep: '#FFB877',
  flareSoft: '#3D2714',
  flareStrong: '#E0661C',

  good: '#7FD08A',
  goodSoft: '#173320',
  warn: '#FFB866',
  warnSoft: '#3A2A12',
  bad: '#FF8F80',
  badSoft: '#3D1B17',
};

const SURFACE_LIGHT = {
  card: '#FFFFFF',
  cardStrong: '#FFF8E1', // text fields inside cards
  cardBorder: 'transparent',
  well: 'rgba(23,48,31,0.06)', // gray fill for controls
  glassFill: 'rgba(255,252,240,0.65)',
  glassBorder: 'rgba(255,255,255,0.7)',
  scrim: 'rgba(255,248,225,0.7)',
  sheet: '#FFFFFF',
  /** the only colour wash behind content: a soft warm light during a flare */
  glow: { calm: ['#FFF8E1', '#FFF8E1', '#FFF8E1'], flare: ['#FFE0C2', '#FFF8E1', '#FFF8E1'] },
  glowOpacity: 1,
};

const SURFACE_DARK: typeof SURFACE_LIGHT = {
  card: '#16271C',
  cardStrong: '#203527',
  cardBorder: 'transparent',
  well: 'rgba(245,241,222,0.08)',
  glassFill: 'rgba(22,39,28,0.6)',
  glassBorder: 'rgba(255,255,255,0.1)',
  scrim: 'rgba(13,26,18,0.7)',
  sheet: '#16271C',
  glow: { calm: ['#0D1A12', '#0D1A12', '#0D1A12'], flare: ['#3A2312', '#0D1A12', '#0D1A12'] },
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

/** `c` laid over the card colour at `amount` (0…1): the pastel square behind brand icons. */
export function soft(c: string, amount = isDark ? 0.2 : 0.16) {
  const parse = (h: string) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  if (!/^#[0-9a-f]{6}$/i.test(c)) return c;
  const a = parse(c);
  const b = parse(surface.card);
  const mix = a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount)));
  return `#${mix.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** v2 signal colours are already text-safe; kept so callers don't change. */
export function readable(c: string) {
  return c;
}

/**
 * Corner radii follow hierarchy: the hero 32, cards 24, tiles and inner wells 16, small
 * badges 12, controls are capsules. Nested shapes get the smaller radius so corners stay concentric.
 */
export const radius = { sm: 12, md: 16, lg: 24, xl: 32, pill: 999 };

/** One set of sizes for the whole app (44 pt minimum touch target). */
export const size = {
  button: 54,
  buttonSm: 42,
  icon: 38,
  tile: 128,
  stat: 86,
  gap: 14,
  pad: 18,
};

/**
 * Type: Nunito everywhere (the Text wrapper picks the file from the weight). Large titles and
 * big numbers use ExtraBold, which is where the brand voice lives.
 */
export const type = {
  display: { fontWeight: '900' as const },
  rounded: { fontWeight: '900' as const },
  body: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
};

/**
 * Cards rest on the Krem page with a soft lift tinted in Ana Yeşil (a grey shadow looks dirty on
 * cream). Dark mode has no shadows: separation comes from the lighter card colour.
 */
export const shadow = {
  shadowColor: '#145A32',
  shadowOpacity: isDark ? 0 : 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
};

/** A coloured glow under a filled control (primary button, candy tiles), light mode only. */
export function glow(color: string, strength = 0.28) {
  return isDark
    ? {}
    : { shadowColor: color, shadowOpacity: strength, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } };
}
