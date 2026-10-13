import { useEffect, useState } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '../lib/theme';

export type Mood = 'happy' | 'ok' | 'worried' | 'cheer' | 'sleepy';

type Props = { mood?: Mood; size?: number; animate?: boolean; style?: ViewStyle };

/** Kıvırcık — Crohnic'in kıvrım kıvrım maskotu. */
export function Mascot({ mood = 'happy', size = 120, animate = true, style }: Props) {
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.04] });
  const scaleY = bob.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  const body = mood === 'worried' ? '#FFC4B8' : colors.pink;
  const ink = colors.ink;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Animated.View style={{ transform: [{ translateY }, { scaleY }] }}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          {/* shadow */}
          <Ellipse cx={60} cy={110} rx={30} ry={4.5} fill="#E9D6C6" opacity={0.7} />
          {/* feet */}
          <Ellipse cx={45} cy={102} rx={9} ry={6} fill={colors.pinkDeep} />
          <Ellipse cx={75} cy={102} rx={9} ry={6} fill={colors.pinkDeep} />
          {/* curl on top */}
          <Path
            d="M60 36 C 58 26, 66 20, 72 24 C 78 28, 74 36, 68 34 C 64 33, 64 28, 68 28"
            stroke={colors.pinkDeep}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          {/* body */}
          <Path
            d="M60 34 C 86 34, 100 52, 100 70 C 100 90, 84 102, 60 102 C 36 102, 20 90, 20 70 C 20 52, 34 34, 60 34 Z"
            fill={body}
          />
          {/* belly highlight */}
          <Path d="M36 52 C 40 44, 50 40, 56 41" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" fill="none" />
          {/* belly swirl */}
          <Path
            d="M60 88 C 52 88, 50 80, 56 78 C 62 76, 66 82, 62 85"
            stroke={colors.pinkDeep}
            strokeOpacity={0.45}
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
          {/* arms */}
          {mood === 'cheer' ? (
            <G>
              <Path d="M24 66 C 14 60, 12 50, 16 44" stroke={body} strokeWidth={9} strokeLinecap="round" fill="none" />
              <Path d="M96 66 C 106 60, 108 50, 104 44" stroke={body} strokeWidth={9} strokeLinecap="round" fill="none" />
            </G>
          ) : (
            <G>
              <Ellipse cx={21} cy={74} rx={6} ry={9} fill={body} />
              <Ellipse cx={99} cy={74} rx={6} ry={9} fill={body} />
            </G>
          )}
          {/* cheeks */}
          <Ellipse cx={38} cy={72} rx={7} ry={4.5} fill={colors.coral} opacity={0.45} />
          <Ellipse cx={82} cy={72} rx={7} ry={4.5} fill={colors.coral} opacity={0.45} />
          <Face mood={mood} ink={ink} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Face({ mood, ink }: { mood: Mood; ink: string }) {
  const openEyes = (
    <G>
      <Ellipse cx={47} cy={62} rx={5.5} ry={6.5} fill={ink} />
      <Ellipse cx={73} cy={62} rx={5.5} ry={6.5} fill={ink} />
      <Circle cx={49} cy={59.5} r={2} fill="#fff" />
      <Circle cx={75} cy={59.5} r={2} fill="#fff" />
    </G>
  );

  switch (mood) {
    case 'happy':
      return (
        <G>
          <Path d="M41 63 Q 47 56, 53 63" stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          <Path d="M67 63 Q 73 56, 79 63" stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          <Path d="M53 73 Q 60 80, 67 73" stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'cheer':
      return (
        <G>
          {openEyes}
          <Path d="M51 72 Q 60 72, 69 72 Q 68 84, 60 84 Q 52 84, 51 72 Z" fill={ink} />
          <Path d="M55 80 Q 60 77, 65 80 Q 63 83, 60 83 Q 57 83, 55 80 Z" fill={colors.coral} />
          <Path d="M104 30 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" fill={colors.butter} />
          <Path d="M14 28 l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5 -3.5 l-3.5 -1.5 l3.5 -1.5 Z" fill={colors.butter} />
        </G>
      );
    case 'worried':
      return (
        <G>
          {openEyes}
          <Path d="M40 52 L 52 55" stroke={ink} strokeWidth={3} strokeLinecap="round" />
          <Path d="M80 52 L 68 55" stroke={ink} strokeWidth={3} strokeLinecap="round" />
          <Path d="M52 78 Q 56 74, 60 78 Q 64 82, 68 78" stroke={ink} strokeWidth={3.2} strokeLinecap="round" fill="none" />
          <Path d="M90 46 C 94 52, 94 56, 90 57 C 86 56, 86 52, 90 46 Z" fill={colors.sky} opacity={0.85} />
        </G>
      );
    case 'sleepy':
      return (
        <G>
          <Path d="M41 63 Q 47 67, 53 63" stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          <Path d="M67 63 Q 73 67, 79 63" stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          <Ellipse cx={60} cy={77} rx={3.5} ry={4} fill={ink} />
        </G>
      );
    default:
      return (
        <G>
          {openEyes}
          <Path d="M54 75 Q 60 79, 66 75" stroke={ink} strokeWidth={3.2} strokeLinecap="round" fill="none" />
        </G>
      );
  }
}
