import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radius, surface } from '../lib/theme';
import { Icon, IconBubble, Row, T, Tap, type SymbolName } from './ui';

type Item = { title: string; sub: string; icon: SymbolName; fallback: string; color: string; to: string };

const ITEMS: Item[] = [
  { title: 'Öğün', sub: 'Ne yediğini yaz', icon: 'fork.knife', fallback: '🍽️', color: palette.lettuce, to: '/yemek-ekle' },
  { title: 'Tuvalet', sub: 'Saat, kıvam, kan', icon: 'drop.fill', fallback: '💧', color: palette.sky, to: '/tuvalet' },
  { title: 'Semptom', sub: 'Ağrı, şişkinlik, gaz, yorgunluk', icon: 'waveform.path.ecg', fallback: '🌡️', color: palette.apricot, to: '/semptom' },
  { title: 'İlaç', sub: 'Aldığın dozu işaretle', icon: 'pills.fill', fallback: '💊', color: palette.peri, to: '/ilaclar' },
  { title: 'Gün nasıldı', sub: 'Stres ve uyku', icon: 'moon.stars.fill', fallback: '🌙', color: palette.flare, to: '/gun' },
];

const SHEET_H = 520;

/**
 * Bottom panel listing every kind of entry. Built on RN Modal (not a native
 * form sheet) so it looks the same on every iOS version and in dark mode.
 */
export function AddMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [anim] = useState(() => new Animated.Value(0)); // 0 hidden, 1 shown
  const [drag] = useState(() => new Animated.Value(0));
  const closing = useRef(false);

  useEffect(() => {
    if (!visible) return;
    closing.current = false;
    drag.setValue(0);
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [visible, anim, drag]);

  /** Slide out, then tell the parent; optionally open a form afterwards. */
  const close = (to?: string) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(anim, { toValue: 0, duration: 190, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      onClose();
      if (to) setTimeout(() => router.push(to as never), 30);
    });
  };
  // Recreated each render; nothing re-renders mid-drag (the drag lives in an Animated.Value).
  // The ref is only read inside gesture callbacks, never during render.
  // eslint-disable-next-line react-hooks/refs
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
    onPanResponderRelease: (_, g) => {
      if (g.dy > 110 || g.vy > 1.2) close();
      else Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    },
  });

  if (!visible) return null;

  const translateY = Animated.add(anim.interpolate({ inputRange: [0, 1], outputRange: [SHEET_H, 0] }), drag);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => close()}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityLabel="Kapat" />
      </Animated.View>
      <Animated.View
        {...pan.panHandlers}
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, 16) + 8, backgroundColor: surface.sheet, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.grabber} />
        <T v="h2" style={{ marginBottom: 6, paddingHorizontal: 4 }}>
          Ne kaydedelim?
        </T>
        {ITEMS.map((it, i) => (
          <View key={it.title}>
            {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline, marginLeft: 62 }} /> : null}
            <Tap onPress={() => close(it.to)}>
              <Row gap={14} style={{ paddingVertical: 11, paddingHorizontal: 4 }}>
                <IconBubble name={it.icon} color={it.color} dim={44} fallback={it.fallback} />
                <View style={{ flex: 1 }}>
                  <T v="h3">{it.title}</T>
                  <T v="small" color={palette.inkSoft} numberOfLines={1}>
                    {it.sub}
                  </T>
                </View>
                <Icon name="chevron.right" size={14} color={palette.inkFaint} fallback="›" />
              </Row>
            </Tap>
          </View>
        ))}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 18,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
  },
  grabber: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: palette.inkFaint, opacity: 0.45, marginBottom: 14 },
});
