import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';
import type React from 'react';
import { PanResponder, View } from 'react-native';

/** Main tabs in tab-bar order. A horizontal swipe on a tab page moves to the neighbour. */
const TABS = ['/', '/gunluk', '/sor', '/ben', '/liste'] as const;

/**
 * Wraps a tab page so a deliberate sideways swipe switches tabs. Only claims clearly
 * horizontal, fast-enough drags, so vertical scrolling and horizontal chip rows
 * (native scroll views win their own gestures) keep working.
 */
export function TabSwipe({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const i = TABS.indexOf(path as (typeof TABS)[number]);

  const go = (dir: 1 | -1) => {
    const next = TABS[i + dir];
    if (!next) return;
    Haptics.selectionAsync().catch(() => {});
    router.navigate(next as never);
  };

  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => i >= 0 && Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2.2,
    onPanResponderTerminationRequest: () => true,
    onPanResponderRelease: (_, g) => {
      // decide by where the flick is heading, not only where the finger stopped
      const projected = g.dx + g.vx * 200;
      if (projected < -90) go(1);
      else if (projected > 90) go(-1);
    },
  });

  return (
    <View style={{ flex: 1 }} {...pan.panHandlers}>
      {children}
    </View>
  );
}
