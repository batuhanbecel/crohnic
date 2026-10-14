import { Stack } from 'expo-router';
import { hasLiquidGlass } from '../../../components/ui';
import { palette } from '../../../lib/theme';

/**
 * The food list lives in its own stack so iOS can show the native search field:
 * on iOS 26 it sits in the tab bar (this tab has role="search"), earlier versions
 * show it under the large title. It stays reachable however far you scroll.
 */
export default function FoodsLayout() {
  const glass = hasLiquidGlass();
  return (
    <Stack
      screenOptions={{
        title: 'Yemekler',
        headerLargeTitle: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerTintColor: palette.ink,
        headerTitleStyle: { color: palette.ink },
        headerLargeTitleStyle: { color: palette.ink },
        // iOS 26: transparent bar gets the system scroll-edge glass; older iOS: solid paper bar
        headerTransparent: glass,
        headerStyle: glass ? undefined : { backgroundColor: palette.paper },
        contentStyle: { backgroundColor: palette.paper },
      }}
    />
  );
}
