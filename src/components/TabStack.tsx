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
        // no visible bar and no title in it: each page draws its own title, which scrolls away
        // with the content. The empty transparent bar is still there so iOS 26+ blurs content
        // passing under the top edge (scroll edge effect).
        title: '',
        headerLargeTitle: false,
        contentStyle: { backgroundColor: palette.paper },
      }}
    />
  );
}
