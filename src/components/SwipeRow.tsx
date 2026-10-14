import * as Haptics from 'expo-haptics';
import type React from 'react';
import { useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedReaction, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { palette, surface } from '../lib/theme';
import { Icon, T } from './ui';

const ACTION = 84;

/**
 * iOS Mail-style swipe-to-delete on the native gesture system (UI thread, plays nicely with
 * the scroll view): drag left to reveal "Sil", or keep dragging past the middle of the row
 * — a tick confirms — and let go to delete straight away. Tap the row to open it.
 */
export function SwipeRow({ children, onPress, onDelete, label }: { children: React.ReactNode; onPress?: () => void; onDelete: () => void; label: string }) {
  const ref = useRef<SwipeableMethods>(null);
  const armed = useRef(false);
  const done = useRef(false);
  const isOpen = useRef(false);
  // a drag must never also count as a tap (the release reaches the press handler first)
  const drag = useRef(false);
  const [dragging, setDragging] = useState(false);
  const startDrag = () => {
    drag.current = true;
    setDragging(true);
  };
  const endDrag = () => {
    drag.current = false;
    setDragging(false);
  };
  const { width } = useWindowDimensions();
  const full = width * 0.5;

  const remove = () => {
    if (done.current) return;
    done.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    onDelete();
  };
  const arm = (on: boolean) => {
    if (on && !armed.current) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    armed.current = on;
  };

  return (
    <Swipeable
      ref={ref}
      friction={1}
      rightThreshold={ACTION / 2}
      overshootRight
      overshootFriction={1}
      dragOffsetFromRightEdge={12}
      onSwipeableOpenStartDrag={startDrag}
      onSwipeableCloseStartDrag={startDrag}
      onSwipeableWillOpen={() => {
        endDrag();
        if (armed.current) remove();
      }}
      onSwipeableWillClose={endDrag}
      onSwipeableOpen={() => (isOpen.current = true)}
      onSwipeableClose={() => (isOpen.current = false)}
      renderRightActions={(_, translation) => <DeleteAction translation={translation} full={full} onArm={arm} onPress={remove} label={label} />}
    >
      <Pressable
        onPress={() => {
          if (drag.current) return;
          if (isOpen.current) ref.current?.close();
          else onPress?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Düzenlemek için dokun"
        accessibilityActions={[{ name: 'delete', label: 'Sil' }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && remove()}
        style={{ backgroundColor: surface.card }}
      >
        {({ pressed }) => <View style={{ opacity: pressed && !dragging ? 0.55 : 1 }}>{children}</View>}
      </Pressable>
    </Swipeable>
  );
}

function DeleteAction({
  translation,
  full,
  onArm,
  onPress,
  label,
}: {
  translation: SharedValue<number>;
  full: number;
  onArm: (on: boolean) => void;
  onPress: () => void;
  label: string;
}) {
  // tell JS when the drag crosses the full-swipe line (in order, so a release reads the right state)
  useAnimatedReaction(
    () => -translation.value > full,
    (on, prev) => {
      if (on !== prev) scheduleOnRN(onArm, on);
    },
  );
  // the red area grows with the drag, the label rides along at its leading edge
  const fill = useAnimatedStyle(() => ({ width: Math.max(ACTION, -translation.value) }));

  return (
    <View style={{ width: ACTION }}>
      <Animated.View style={[styles.fill, fill]}>
        <View style={{ width: ACTION, height: '100%' }}>
          <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label} sil`} style={styles.button}>
            <Icon name="trash.fill" size={18} color="#fff" fallback="🗑" />
            <T v="caption" color="#fff">
              Sil
            </T>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, bottom: 0, right: 0, backgroundColor: palette.bad, flexDirection: 'row' },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
