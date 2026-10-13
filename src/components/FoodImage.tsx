import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Animated, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { markBroken, useFoodImage } from '../lib/food-images';
import type { Food } from '../lib/foods';
import { radius as R, surface } from '../lib/theme';

/** Food photo with the emoji as placeholder and fallback. */
export function FoodImage({
  food,
  size = 50,
  radius = R.sm,
  style,
}: {
  food: Food;
  size?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const sql = useSQLiteContext();
  const url = useFoodImage(sql, food);
  const [opacity] = useState(() => new Animated.Value(0));
  const [broken, setBroken] = useState('');
  const show = !!url && broken !== url;

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: radius, backgroundColor: surface.well, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
        style,
      ]}
    >
      <Text style={{ fontSize: Math.round(size * 0.48) }}>{food.emoji}</Text>
      {show ? (
        <Animated.Image
          source={{ uri: url }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          onLoad={() => Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start()}
          onError={() => {
            setBroken(url);
            markBroken(sql, food.id);
          }}
          style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, opacity }}
        />
      ) : null}
    </View>
  );
}
