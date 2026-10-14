import * as Haptics from 'expo-haptics';
import type React from 'react';
import { useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { palette } from '../lib/theme';
import { setRowTouch } from './gesture-lock';
import { Icon, T } from './ui';

const OPEN = -88;

/**
 * List row with the iOS swipe-to-delete pattern: drag left to reveal a red "Sil",
 * or keep dragging (or flick) to delete straight away. Tap the row to open it.
 */
export function SwipeRow({ children, onPress, onDelete, label }: { children: React.ReactNode; onPress?: () => void; onDelete: () => void; label: string }) {
  const [x] = useState(() => new Animated.Value(0));
  const [open, setOpen] = useState(false);

  const snap = (to: number) => {
    setOpen(to !== 0);
    Animated.spring(x, { toValue: to, useNativeDriver: true, stiffness: 438, damping: 41.9, mass: 1 }).start();
  };
  const remove = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Animated.timing(x, { toValue: -500, duration: 180, useNativeDriver: true }).start(() => {
      onDelete();
      x.setValue(0);
      setOpen(false);
    });
  };

  // horizontal drags only; vertical ones stay with the page's scroll view
  const pan = PanResponder.create({
    // capture phase: the row's own Pressable already owns the touch, so the row has to claim it first
    onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8 && (g.dx < 0 || open),
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, g) => x.setValue(Math.min(0, (open ? OPEN : 0) + g.dx)),
    onPanResponderRelease: (_, g) => {
      const end = (open ? OPEN : 0) + g.dx + g.vx * 120; // where the flick is heading
      if (end < -220) remove();
      else if (end < OPEN / 2) snap(OPEN);
      else snap(0);
    },
  });

  return (
    <View style={{ overflow: 'hidden' }} onTouchStart={() => setRowTouch(true)} onTouchEnd={() => setRowTouch(false)} onTouchCancel={() => setRowTouch(false)}>
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: palette.bad }]}>
        <Pressable onPress={remove} accessibilityRole="button" accessibilityLabel={`${label} sil`} style={{ width: -OPEN, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Icon name="trash.fill" size={18} color="#fff" fallback="🗑" />
          <T v="caption" color="#fff">
            Sil
          </T>
        </Pressable>
      </View>
      <Animated.View style={{ transform: [{ translateX: x }] }} {...pan.panHandlers}>
        <Pressable
          onPress={() => (open ? snap(0) : onPress?.())}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint="Düzenlemek için dokun"
          accessibilityActions={[{ name: 'delete', label: 'Sil' }]}
          onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && remove()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}
