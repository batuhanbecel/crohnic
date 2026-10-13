import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import type { SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, T, Tap } from '../../components/ui';
import { colors, fonts, shadow } from '../../lib/theme';

const ITEMS: Record<string, { label: string; icon: SymbolViewProps['name']; fallback: string }> = {
  index: { label: 'Bugün', icon: 'house.fill', fallback: '🏠' },
  gunluk: { label: 'Günlük', icon: 'book.closed.fill', fallback: '📖' },
  sor: { label: 'Sor', icon: 'camera.fill', fallback: '📷' },
  liste: { label: 'Yemekler', icon: 'fork.knife', fallback: '🍽️' },
  ben: { label: 'Beni tanı', icon: 'heart.text.square.fill', fallback: '💗' },
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={st.bar}>
        {state.routes.map((route, i) => {
          const item = ITEMS[route.name];
          if (!item) return null;
          const focused = state.index === i;
          const go = () => {
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
          };
          if (route.name === 'sor') {
            return (
              <Tap key={route.key} onPress={go} style={st.centerWrap} accessibilityLabel="Kıvırcık’a sor">
                <View style={[st.center, focused && { backgroundColor: colors.pinkDeep }]}>
                  <Icon name={item.icon} size={26} color="#fff" fallback={item.fallback} />
                </View>
              </Tap>
            );
          }
          const c = focused ? colors.coral : colors.inkFaint;
          return (
            <Tap key={route.key} onPress={go} style={st.item} accessibilityLabel={item.label}>
              <Icon name={item.icon} size={21} color={c} fallback={item.fallback} />
              <T v="tiny" color={c} style={{ fontFamily: fonts.heavy, fontSize: 11 }}>
                {item.label}
              </T>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <TabBar {...p} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="gunluk" />
      <Tabs.Screen name="sor" />
      <Tabs.Screen name="liste" />
      <Tabs.Screen name="ben" />
    </Tabs>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 30,
    height: 68,
    paddingHorizontal: 6,
    ...shadow,
    shadowOpacity: 0.22,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%' },
  centerWrap: { flex: 1, alignItems: 'center' },
  center: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 5,
    borderColor: colors.bg,
    ...shadow,
    shadowColor: colors.coral,
    shadowOpacity: 0.4,
  },
});
