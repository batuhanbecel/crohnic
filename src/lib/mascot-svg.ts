/**
 * Kıvırcık, drawn after the Crohnic brand sheet: a round, frilly lettuce head with a pale
 * yellow-green heart for a face, big glossy eyes, pink cheeks and little leaf arms and feet.
 *
 * Pure string output (no React Native imports) so the same artwork renders in the app
 * (react-native-svg's SvgXml) and in the icon/splash build script.
 */
export type Mood = 'happy' | 'ok' | 'worried' | 'cheer' | 'sleepy';

export const MASCOT_COLORS = {
  edge: '#4A8A1E',
  back: '#7DBA33',
  mid: '#A3D143',
  midEdge: '#78B22C',
  frill: '#BEE05A',
  faceIn: '#E6F3A4',
  faceOut: '#C3DE6C',
  vein: '#5F9E2C',
  eye: '#1C1B15',
  brow: '#4A7A20',
  mouth: '#5C2119',
  tongue: '#F27C72',
  blush: '#FF9C8C',
  accent: '#8F79EE', // the "?" and the sleepy z's (brand lila, a touch deeper)
};
const C = MASCOT_COLORS;

/** Frilly outline: radius bumped by a sharpened sine so the edge curls. */
function ruffle(cx: number, cy: number, rx: number, ry: number, n: number, amp: number, phase: number, sharp: number, topBoost = 0) {
  const steps = n * 10;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * 2 * i) / steps;
    const up = Math.max(0, -Math.sin(t));
    const k = 1 + amp * Math.pow(Math.abs(Math.sin((t * n + phase) / 2)), sharp) + topBoost * up * up;
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
  }
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = mid(pts[0], pts[1]);
  let d = `M${s[0].toFixed(1)} ${s[1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const e = mid(p, pts[i + 1]);
    d += `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${e[0].toFixed(1)} ${e[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

/** A ring of frilly puffs: lettuce leaves bunched around the head. */
function puffs(cx: number, cy: number, R: number, ry: number, count: number, r: number, jitter: number, a0: number, from = 0, to = Math.PI * 2) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const t = from + ((to - from) * (i + 0.5)) / count + a0;
    const k = 1 + jitter * Math.sin(i * 2.3 + 1);
    const pr = r * (1 + 0.22 * Math.sin(i * 1.7 + 0.5));
    d += ruffle(cx + Math.cos(t) * R * k, cy + Math.sin(t) * ry * k, pr, pr * 0.92, 7, 0.14, i, 0.6);
  }
  return d;
}

const P = {
  back: puffs(60, 55, 38, 38, 14, 13, 0.07, 0.1),
  mid: puffs(60, 57, 31, 30, 12, 13, 0.05, 0.35),
  top: puffs(60, 38, 29, 20, 8, 11.5, 0.1, 0, Math.PI * 1.0, Math.PI * 2.0),
  creases:
    'M30 40 Q37 41 40 48 M90 40 Q83 41 80 48 M45 24 Q49 29 48 36 M75 24 Q71 29 72 36 M58 17 Q62 22 60 29 M22 62 Q27 61 31 65 M98 62 Q93 61 89 65 M33 86 Q37 84 40 87 M87 86 Q83 84 80 87',
  armsDown: 'M29 70 C 19 69, 10 76, 9.5 85 C 9.3 90.5, 15 92, 19.5 88.5 C 24 85, 29 81, 32.5 77 Z M91 70 C 101 69, 110 76, 110.5 85 C 110.7 90.5, 105 92, 100.5 88.5 C 96 85, 91 81, 87.5 77 Z',
  armsUp: 'M29 64 C 19 60, 10 50, 10 41 C 10 35.5, 16 34.5, 19.5 38.5 C 24 44, 29 51, 32.5 57 Z M91 64 C 101 60, 110 50, 110 41 C 110 35.5, 104 34.5, 100.5 38.5 C 96 44, 91 51, 87.5 57 Z',
};

const eyes = `
  <ellipse cx="47" cy="63" rx="7" ry="8.6" fill="${C.eye}"/>
  <ellipse cx="73" cy="63" rx="7" ry="8.6" fill="${C.eye}"/>
  <circle cx="49.6" cy="59.2" r="3.1" fill="#fff"/>
  <circle cx="75.6" cy="59.2" r="3.1" fill="#fff"/>
  <circle cx="44.9" cy="67.2" r="1.3" fill="#fff" opacity=".85"/>
  <circle cx="70.9" cy="67.2" r="1.3" fill="#fff" opacity=".85"/>`;

const brows = `<path d="M42 51.5 Q46.5 49 51 51 M69 51 Q73.5 49 78 51.5" stroke="${C.brow}" stroke-width="1.7" stroke-linecap="round" fill="none"/>`;

const openSmile = (w = 7, depth = 9.5) => `
  <path d="M${60 - w} 73 Q60 74.6 ${60 + w} 73 Q${60 + w - 0.6} ${73 + depth} 60 ${73 + depth + 0.4} Q${60 - w + 0.6} ${73 + depth} ${60 - w} 73 Z" fill="${C.mouth}"/>
  <path d="M${60 - w + 2.4} ${73 + depth - 3.5} Q60 ${73 + depth - 6.8} ${60 + w - 2.4} ${73 + depth - 3.5} Q${60 + w - 4.4} ${73 + depth + 0.2} 60 ${73 + depth + 0.3} Q${60 - w + 4.4} ${73 + depth + 0.2} ${60 - w + 2.4} ${73 + depth - 3.5} Z" fill="${C.tongue}"/>`;

function face(mood: Mood) {
  switch (mood) {
    case 'cheer':
      return `
        <path d="M42 66 Q48 58.5 54 66 M66 66 Q72 58.5 78 66" stroke="${C.eye}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        ${openSmile(8.5, 11)}`;
    case 'ok':
      return `${eyes}${brows}
        <path d="M54 74.5 Q60 79.5 66 74.5" stroke="${C.mouth}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
    case 'worried':
      return `${eyes}
        <path d="M43 55 L51.5 52 M77 55 L68.5 52" stroke="${C.brow}" stroke-width="1.9" stroke-linecap="round" fill="none"/>
        <path d="M54 77 Q57 74 60 77 Q63 80 66 77" stroke="${C.mouth}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
        <path d="M97 15 Q97 8.5 103 8.5 Q109 8.5 109 14.5 Q109 18.5 103.5 20.5 L103.5 25" stroke="${C.accent}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="103.5" cy="31" r="2.2" fill="${C.accent}"/>`;
    case 'sleepy':
      return `
        <path d="M42.5 64.5 Q48 69.5 53.5 64.5 M66.5 64.5 Q72 69.5 77.5 64.5" stroke="${C.eye}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        <ellipse cx="60" cy="77" rx="2.6" ry="3" fill="${C.mouth}"/>
        <path d="M94 12 L102 12 L94 20 L102 20 M104 26 L109 26 L104 31 L109 31" stroke="${C.accent}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    default:
      return `${eyes}${brows}${openSmile(8, 10.5)}`;
  }
}

/** Full SVG document for one mood. `id` keeps gradient ids unique when several are on screen. */
export function mascotSvg(mood: Mood = 'happy', id = 'k') {
  const arms = mood === 'cheer' ? P.armsUp : P.armsDown;
  const blush = mood === 'worried' ? 0.35 : 0.65;
  // raised arms wave in front of the head, resting ones tuck behind it
  const armsSvg = `<path d="${arms}" fill="${C.back}" stroke="${C.edge}" stroke-width="1.4" stroke-linejoin="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <radialGradient id="${id}b" cx="50%" cy="45%" r="60%"><stop offset=".5" stop-color="${C.back}"/><stop offset="1" stop-color="${C.edge}"/></radialGradient>
    <radialGradient id="${id}m" cx="50%" cy="55%" r="55%"><stop offset=".55" stop-color="${C.mid}"/><stop offset="1" stop-color="${C.midEdge}"/></radialGradient>
    <radialGradient id="${id}f" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="${C.faceIn}"/><stop offset=".6" stop-color="${C.faceOut}"/><stop offset="1" stop-color="${C.faceOut}" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="60" cy="114" rx="25" ry="3.4" fill="#000" opacity=".12"/>
  <ellipse cx="48" cy="106.5" rx="7.2" ry="4.6" fill="${C.back}" stroke="${C.edge}" stroke-width="1.4"/>
  <ellipse cx="72" cy="106.5" rx="7.2" ry="4.6" fill="${C.back}" stroke="${C.edge}" stroke-width="1.4"/>
  ${mood === 'cheer' ? '' : armsSvg}
  <path d="${P.back}" fill="url(#${id}b)"/>
  <ellipse cx="60" cy="58" rx="40" ry="38" fill="url(#${id}b)"/>
  <path d="${P.mid}" fill="url(#${id}m)"/>
  <ellipse cx="60" cy="60" rx="33" ry="31" fill="url(#${id}m)"/>
  <path d="${P.top}" fill="${C.frill}"/>
  <ellipse cx="60" cy="66" rx="31" ry="27" fill="url(#${id}f)"/>
  <path d="${P.creases}" stroke="${C.vein}" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".5"/>
  ${mood === 'cheer' ? armsSvg : ''}
  <ellipse cx="37.5" cy="72.5" rx="5.6" ry="3.5" fill="${C.blush}" opacity="${blush}"/>
  <ellipse cx="82.5" cy="72.5" rx="5.6" ry="3.5" fill="${C.blush}" opacity="${blush}"/>
  ${face(mood)}
</svg>`;
}
