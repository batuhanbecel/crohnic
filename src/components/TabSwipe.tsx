import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, usePathname } from 'expo-router';
import type React from 'react';
import { useCallback, useState } from 'react';
import { Animated, Easing, PanResponder } from 'react-native';
import { isRowTouch } from './gesture-lock';
import { prefersReducedMotion } from './ui';

/** Main tabs in tab-bar order. A horizontal swipe on a tab page moves to the neighbour. */
const TABS = ['/', '/gunluk', '/sor', '/ben', '/liste'] as const;

// direction of the swipe that's in flight, read by the page that receives focus
const swipe: { incoming: 1 | -1 | 0 } = { incoming: 0 };
function setIncoming(d: 1 | -1 | 0) {
  swipe.incoming = d;
}
function takeIncoming() {
  const d = swipe.incoming;
  swipe.incoming = 0;
  return d;
}

/**
 * Wraps a tab page so a deliberate sideways swipe switches tabs. Only claims clearly
 * horizontal drags, so vertical scrolling, swipe-to-delete rows and chip rows keep
 * their own gestures. The page follows the finger a little, and the next page slides
 * in from the side the finger moved toward (a fade with Reduce Motion).
 */
export function TabSwipe({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const i = TABS.indexOf(path as (typeof TABS)[number]);
  const [x] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));

  // entrance when this page was reached by a swipe
  useFocusEffect(
    useCallback(() => {
      const dir = takeIncoming();
      if (!dir) return;
      if (prefersReducedMotion()) {
        fade.setValue(0.4);
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        return;
      }
      x.setValue(dir * 60);
      fade.setValue(0.5);
      Animated.parallel([
        Animated.spring(x, { toValue: 0, stiffness: 438, damping: 41.9, mass: 1, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, [x, fade]),
  );

  const go = (dir: 1 | -1) => {
    const next = TABS[i + dir];
    if (!next) {
      Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start(); // edge: settle back
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    setIncoming(dir);
    x.setValue(0);
    router.navigate(next as never);
  };

  const pan = PanResponder.create({
    // capture phase so swipes that start on cards and buttons still count; rows with
    // swipe-to-delete keep their own gesture
    onMoveShouldSetPanResponderCapture: (_, g) => i >= 0 && !isRowTouch() && Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2.2,
    onPanResponderTerminationRequest: () => true,
    // follow the finger with resistance, so the page visibly responds before it switches
    onPanResponderMove: (_, g) => {
      if (!prefersReducedMotion()) x.setValue((g.dx * 0.35) / (1 + Math.abs(g.dx) / 600));
    },
    onPanResponderRelease: (_, g) => {
      const projected = g.dx + g.vx * 200; // where the flick is heading
      if (projected < -90) go(1);
      else if (projected > 90) go(-1);
      else Animated.spring(x, { toValue: 0, useNativeDriver: true, stiffness: 438, damping: 41.9, mass: 1 }).start();
    },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
  });

  return (
    <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateX: x }] }} {...pan.panHandlers}>
      {children}
    </Animated.View>
  );
}
