import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, View, type ViewStyle } from 'react-native';
import { Text } from './text';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { prefersReducedMotion } from './ui';

export type Mood = 'happy' | 'ok' | 'worried' | 'cheer' | 'sleepy';

type Props = { mood?: Mood; size?: number; animate?: boolean; style?: ViewStyle };

/**
 * Kıvırcık: a curly lettuce with a pale heart for a face and frilly bangs.
 * Colours are fixed (not themed) and the whole figure carries a deep green
 * outline, so it reads the same on light paper and in dark mode.
 */
export const MASCOT_COLORS = {
  outline: '#21451A',
  back: '#3F8A26',
  mid: '#6DBB3C',
  light: '#9BD866',
  face: '#F0F8D2',
  faceWorried: '#E6F2C4',
  vein: '#2F6B1D',
  eye: '#1B261D',
  blush: '#FF8C6B',
  tear: '#6FC0F2',
};
const C = MASCOT_COLORS;

/** Frilly outline: radius bumped by a sharpened sine so the edge curls. */
function ruffle(cx: number, cy: number, rx: number, ry: number, n: number, amp: number, phase: number, sharp: number, topBoost: number) {
  const steps = n * 12;
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
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${e[0].toFixed(1)} ${e[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

export const MASCOT_PATHS = {
  back: ruffle(60, 56, 45, 40, 13, 0.17, 0.4, 0.5, 0.18),
  mid: ruffle(60, 58, 38, 33, 15, 0.14, 1.2, 0.5, 0.12),
  face: 'M60 55 C 80 55, 90 67, 90 81 C 90 95, 77 104, 60 104 C 43 104, 30 95, 30 81 C 30 67, 40 55, 60 55 Z',
  bangs: 'M31.5 72 C 30 52, 90 52, 88.5 72 Q 85 79 79 72.5 Q 75 80.5 68.5 71.5 Q 64 79.5 60 71 Q 56 79.5 51.5 71.5 Q 45 80.5 41 72.5 Q 35 79 31.5 72 Z',
  curl: 'M60 22 C 57 13, 64 7, 70 10 C 76 13, 73 20, 68 19 C 64.5 18, 65.5 14, 68.5 14',
  veins: 'M36 44 C 42 47, 46 52, 48 58 M84 44 C 78 47, 74 52, 72 58 M60 28 C 60 36, 60 42, 60 50',
};
const P = MASCOT_PATHS;

export function Mascot({ mood = 'happy', size = 120, animate = true, style }: Props) {
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!animate || prefersReducedMotion()) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.03] });
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] });
  const thin = size < 60; // tiny sizes need a heavier outline to survive

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Ellipse cx={60} cy={113} rx={24} ry={3.4} fill="#000" opacity={0.12} />
          <Ellipse cx={49} cy={106} rx={6.5} ry={4.2} fill={C.back} stroke={C.outline} strokeWidth={2} />
          <Ellipse cx={71} cy={106} rx={6.5} ry={4.2} fill={C.back} stroke={C.outline} strokeWidth={2} />
          {mood === 'cheer' ? (
            <G>
              <Path d="M22 74 C 10 70, 6 58, 11 49 C 17 55, 22 62, 27 68 Z" fill={C.mid} stroke={C.outline} strokeWidth={2.2} strokeLinejoin="round" />
              <Path d="M98 74 C 110 70, 114 58, 109 49 C 103 55, 98 62, 93 68 Z" fill={C.mid} stroke={C.outline} strokeWidth={2.2} strokeLinejoin="round" />
            </G>
          ) : null}
          <Path d={P.back} fill={C.back} stroke={C.outline} strokeWidth={thin ? 4 : 3} strokeLinejoin="round" />
          <Path d={P.mid} fill={C.mid} />
          <Path d={P.curl} stroke={C.outline} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d={P.curl} stroke={C.light} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d={P.veins} stroke={C.vein} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.55} />
          <Path d={P.face} fill={mood === 'worried' ? C.faceWorried : C.face} stroke={C.outline} strokeWidth={2.2} />
          <Path d={P.bangs} fill={C.light} stroke={C.outline} strokeWidth={2.2} strokeLinejoin="round" />
          <Ellipse cx={41} cy={91} rx={5} ry={3.2} fill={C.blush} opacity={mood === 'worried' ? 0.3 : 0.55} />
          <Ellipse cx={79} cy={91} rx={5} ry={3.2} fill={C.blush} opacity={mood === 'worried' ? 0.3 : 0.55} />
          <Face mood={mood} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Eyes() {
  return (
    <G>
      <Ellipse cx={49} cy={83} rx={4.6} ry={5.6} fill={C.eye} />
      <Ellipse cx={71} cy={83} rx={4.6} ry={5.6} fill={C.eye} />
      <Circle cx={50.8} cy={80.8} r={1.8} fill="#fff" />
      <Circle cx={72.8} cy={80.8} r={1.8} fill="#fff" />
    </G>
  );
}

function Face({ mood }: { mood: Mood }) {
  const ink = C.eye;
  switch (mood) {
    case 'happy':
      return (
        <G>
          <Eyes />
          <Path d="M54.5 91 Q60 96 65.5 91" stroke={ink} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'cheer':
      return (
        <G>
          <Path d="M44 84 Q49 77.5 54 84" stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M66 84 Q71 77.5 76 84" stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M53 90 L67 90 Q66 98.5 60 98.5 Q54 98.5 53 90 Z" fill={ink} />
          <Path d="M56 95.5 Q60 93 64 95.5 Q62 98 60 98 Q58 98 56 95.5Z" fill={C.blush} />
        </G>
      );
    case 'worried':
      return (
        <G>
          <Eyes />
          <Path d="M43.5 75.5 L53.5 77.5" stroke={ink} strokeWidth={2.3} strokeLinecap="round" />
          <Path d="M76.5 75.5 L66.5 77.5" stroke={ink} strokeWidth={2.3} strokeLinecap="round" />
          <Path d="M54 95 Q57 91.5 60 95 Q63 98.5 66 95" stroke={ink} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Path d="M85 76 C 88.5 81, 88.5 84.5, 85 85.5 C 81.5 84.5, 81.5 81, 85 76 Z" fill={C.tear} stroke={C.outline} strokeWidth={1.2} />
        </G>
      );
    case 'sleepy':
      return (
        <G>
          <Path d="M44 84 Q49 87.5 54 84" stroke={ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />
          <Path d="M66 84 Q71 87.5 76 84" stroke={ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />
          <Ellipse cx={60} cy={94} rx={2.8} ry={3.2} fill={ink} />
          <Path d="M95 18 L103 18 L95 26 L103 26" stroke={C.outline} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      );
    default:
      return (
        <G>
          <Eyes />
          <Path d="M55.5 93 L64.5 93" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />
        </G>
      );
  }
}

/** Brand lockup: Kıvırcık + lowercase wordmark. */
export function Logo({ size = 28, color }: { size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.2 }}>
      <Mascot size={size * 1.5} animate={false} />
      <Text style={{ fontFamily: Platform.select({ ios: 'ui-rounded', default: undefined }), fontWeight: '800', fontSize: size, letterSpacing: -size * 0.03, color: color ?? '#3F7F26' }}>
        crohnic
      </Text>
    </View>
  );
}
