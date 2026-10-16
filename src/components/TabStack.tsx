import { Stack } from 'expo-router';
import { palette } from '../lib/theme';
import { InTabsContext } from './ui';

/**
 * Every tab sits in its own native stack only for the iOS 26+ scroll edge effect: content
 * blurs as it passes under the top edge, and the glass bar buttons float there. The bar itself
 * is invisible and has no title; each page draws its own, which scrolls away with the content.
 * InTabsContext tells pages to leave room for the floating tab bar at the bottom.
 */
export function TabStack() {
  return (
    <InTabsContext.Provider value>
      <Stack
        screenOptions={{
          headerTransparent: true,
          headerShadowVisible: false,
          title: '',
          headerLargeTitle: false,
          contentStyle: { backgroundColor: palette.paper },
        }}
      />
    </InTabsContext.Provider>
  );
}
