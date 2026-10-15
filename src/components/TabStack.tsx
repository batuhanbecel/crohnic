import { Stack } from 'expo-router';
import { palette } from '../lib/theme';

/**
 * Every tab sits in its own native stack so it gets the system navigation bar: a large
 * title that collapses into the bar while scrolling, Liquid Glass bar buttons, and (iOS 26+)
 * the scroll edge effect that blurs content passing under the bar. The bar itself stays transparent; the glass and
 * blur come from the system.
 */
export function TabStack() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        // iOS large title: scrolls up with the content and settles as the small title in the bar
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerTintColor: palette.lettuceDeep,
        headerTitleStyle: { fontFamily: 'Nunito_800ExtraBold', color: palette.ink },
        headerLargeTitleStyle: { fontFamily: 'Nunito_800ExtraBold', color: palette.ink },
        contentStyle: { backgroundColor: palette.paper },
      }}
    />
  );
}
