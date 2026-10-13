import { useEffect, useState } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { palette } from '../lib/theme';

export type Mood = 'happy' | 'ok' | 'worried' | 'cheer' | 'sleepy';

type Props = { mood?: Mood; size?: number; animate?: boolean; style?: ViewStyle };

/** Frilly lettuce outline: radius bumped by a sharpened sine so the edge curls. */
function ruffle(cx: number, cy: number, rx: number, ry: number, n: number, amp: number, phase: number, sharp: number, topBoost: number) {
  const steps = n * 10;
  const pts: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const t = (Math.PI * 2 * i) / steps;
    const up = Math.max(0, -Math.sin(t));
    const k = 1 + amp * Math.pow(Math.abs(Math.sin((t * n + phase) / 2)), sharp) + topBoost * up * up;
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
  }
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = mid(pts[pts.length - 1], pts[0]);
  let d = `M${s[0].toFixed(1)} ${s[1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const e = mid(p, pts[(i + 1) % pts.length]);
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${e[0].toFixed(1)} ${e[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

const BACK = ruffle(60, 66, 41, 35, 14, 0.16, 0.3, 0.45, 0.32);
const MID = ruffle(60, 68, 35, 30, 17, 0.12, 1.3, 0.45, 0.22);
const FACE = ruffle(60, 72, 26, 23, 22, 0.045, 0.2, 0.5, 0);

const C = {
  dark: '#4F9A2F',
  mid: '#86C94A',
  vein: '#5FAE35',
  face: '#DDF3A6',
  faceVein: '#C3E584',
  feet: '#3F7F26',
  blush: '#FF8F70',
};

/** Kıvırcık: a frilly lettuce who knows a thing or two about your gut. */
export function Mascot({ mood = 'happy', size = 120, animate = true, style }: Props) {
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.035] });
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] });
  const face = mood === 'worried' ? '#E9F5C2' : C.face;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Ellipse cx={60} cy={111} rx={26} ry={3.6} fill={palette.ink} opacity={0.08} />
          <Ellipse cx={49} cy={103} rx={6.5} ry={4.2} fill={C.feet} />
          <Ellipse cx={71} cy={103} rx={6.5} ry={4.2} fill={C.feet} />
          {mood === 'cheer' ? (
            <G>
              <Path d="M24 70 C 12 64, 9 52, 14 44 C 20 50, 24 58, 28 64 Z" fill={C.mid} />
              <Path d="M96 70 C 108 64, 111 52, 106 44 C 100 50, 96 58, 92 64 Z" fill={C.mid} />
            </G>
          ) : null}
          <Path d={BACK} fill={C.dark} />
          <Path d={MID} fill={C.mid} />
          {/* the curl on top */}
          <Path d="M58 36 C 55 27, 62 20, 68 23 C 74 26, 71 33, 66 32 C 62.5 31, 63.5 27, 66.5 27" stroke="#B9E27A" strokeWidth={3.2} strokeLinecap="round" fill="none" />
          <Path
            d="M60 38 C 59 46, 58 52, 60 58 M44 44 C 47 50, 50 54, 54 57 M76 44 C 73 50, 70 54, 66 57"
            stroke={C.vein}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
            opacity={0.7}
          />
          <Path d={FACE} fill={face} />
          <Path d="M60 52 C 58.5 62, 58.5 82, 60 93" stroke={C.faceVein} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Ellipse cx={43.5} cy={80} rx={5} ry={3.2} fill={C.blush} opacity={mood === 'worried' ? 0.25 : 0.5} />
          <Ellipse cx={76.5} cy={80} rx={5} ry={3.2} fill={C.blush} opacity={mood === 'worried' ? 0.25 : 0.5} />
          <Face mood={mood} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Face({ mood }: { mood: Mood }) {
  const ink = palette.ink;
  const eyes = (
    <G>
      <Ellipse cx={50} cy={72} rx={4.2} ry={5} fill={ink} />
      <Ellipse cx={70} cy={72} rx={4.2} ry={5} fill={ink} />
      <Circle cx={51.6} cy={70} r={1.6} fill="#fff" />
      <Circle cx={71.6} cy={70} r={1.6} fill="#fff" />
    </G>
  );
  switch (mood) {
    case 'happy':
      return (
        <G>
          {eyes}
          <Path d="M55 81 Q60 86 65 81" stroke={ink} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'cheer':
      return (
        <G>
          <Path d="M45 73 Q50 67 55 73" stroke={ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />
          <Path d="M65 73 Q70 67 75 73" stroke={ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />
          <Path d="M53 79 L67 79 Q66 88 60 88 Q54 88 53 79 Z" fill={ink} />
          <Path d="M56 85 Q60 82.5 64 85 Q62 87.5 60 87.5 Q58 87.5 56 85 Z" fill={C.blush} />
        </G>
      );
    case 'worried':
      return (
        <G>
          {eyes}
          <Path d="M44 63 L54 65.5" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M76 63 L66 65.5" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M54 84 Q57 80.5 60 84 Q63 87.5 66 84" stroke={ink} strokeWidth={2.3} strokeLinecap="round" fill="none" />
          <Path d="M84 58 C 87.5 63, 87.5 66.5, 84 67.5 C 80.5 66.5, 80.5 63, 84 58 Z" fill="#7CC4F2" />
        </G>
      );
    case 'sleepy':
      return (
        <G>
          <Path d="M45 73 Q50 76.5 55 73" stroke={ink} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d="M65 73 Q70 76.5 75 73" stroke={ink} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Ellipse cx={60} cy={83} rx={2.6} ry={3} fill={ink} />
        </G>
      );
    default:
      return (
        <G>
          {eyes}
          <Path d="M56 82.5 L64 82.5" stroke={ink} strokeWidth={2.4} strokeLinecap="round" />
        </G>
      );
  }
}
