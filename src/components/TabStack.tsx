import { Stack } from 'expo-router';
import { palette } from '../lib/theme';

/**
 * Every tab sits in its own native stack so it gets the system navigation bar: a title
 * pinned at the top, Liquid Glass bar buttons, and (iOS 26+) the scroll edge effect that
 * blurs content passing under the bar. The bar itself stays transparent; the glass and
 * blur come from the system.
 */
export function TabStack() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        // the title stays pinned in the glass bar; only the content scrolls (and blurs) under it
        headerLargeTitle: false,
        headerTintColor: palette.lettuceDeep,
        headerTitleStyle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: palette.ink },
        contentStyle: { backgroundColor: palette.paper },
      }}
    />
  );
}
