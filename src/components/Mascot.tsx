import { useEffect, useId, useMemo, useState } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { mascotSvg, type Mood } from '../lib/mascot-svg';
import { isDark } from '../lib/theme';
import { Text } from './text';
import { prefersReducedMotion } from './ui';

export type { Mood } from '../lib/mascot-svg';
export { MASCOT_COLORS } from '../lib/mascot-svg';

type Props = { mood?: Mood; size?: number; animate?: boolean; style?: ViewStyle };

/** Kıvırcık, the curly-lettuce mascot from the brand sheet. Colours are fixed in both themes. */
export function Mascot({ mood = 'happy', size = 120, animate = true, style }: Props) {
  const [bob] = useState(() => new Animated.Value(0));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const xml = useMemo(() => mascotSvg(mood, `k${uid}`), [mood, uid]);

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

  return (
    <View style={[{ width: size, height: size }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <SvgXml xml={xml} width={size} height={size} />
      </Animated.View>
    </View>
  );
}

/** Brand greens for the wordmark: Ana Yeşil on light, Açık Yeşil on dark. */
export const BRAND = {
  wordmark: isDark ? '#CFEA8E' : '#145A32',
  leaf: '#4CAF50',
  smile: isDark ? '#4CAF50' : '#8BC34A',
};

/**
 * The "Crohnic" wordmark: Nunito Black in Ana Yeşil, a leaf for the dot of the i and a
 * smile under the C. Optional tagline: YEME. KAYDET. ANLA. KENDİN OL.
 */
export function Logo({ size = 28, color, tagline = false }: { size?: number; color?: string; tagline?: boolean }) {
  const c = color ?? BRAND.wordmark;
  const word = { fontFamily: 'Nunito_900Black', fontSize: size, lineHeight: size * 1.2, color: c, letterSpacing: -size * 0.02 };
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="Crohnic" style={{ alignItems: 'flex-start' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <Text style={word}>Crohn</Text>
        <View>
          <Text style={word}>ı</Text>
          <Svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" style={{ position: 'absolute', top: size * 0.0, left: size * 0.05 }}>
            <Path d="M4 20 C 4 10, 10 4, 21 3 C 21 13, 15 20, 4 20 Z" fill={BRAND.leaf} />
            <Path d="M5 19 C 9 14, 13 10, 17 7" stroke={isDark ? '#0D1A12' : '#FFFFFF'} strokeOpacity={0.45} strokeWidth={1.4} strokeLinecap="round" fill="none" />
          </Svg>
        </View>
        <Text style={word}>c</Text>
      </View>
      <Svg width={size * 1.3} height={size * 0.32} viewBox="0 0 40 10" style={{ marginTop: -size * 0.16, marginLeft: size * 0.02 }}>
        <Path d="M2 2 Q20 11 38 2" stroke={BRAND.smile} strokeWidth={3.2} strokeLinecap="round" fill="none" />
      </Svg>
      {tagline ? (
        <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: Math.max(10, size * 0.22), letterSpacing: size * 0.06, color: c, marginTop: size * 0.05 }}>
          YEME. KAYDET. ANLA. KENDİN OL.
        </Text>
      ) : null}
    </View>
  );
}
