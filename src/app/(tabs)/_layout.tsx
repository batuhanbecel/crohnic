import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting, type RouterAction } from 'expo-quick-actions/router';
import { usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { rememberTab } from '../../lib/last-tab';
import { palette } from '../../lib/theme';

/** Long-press the app icon: the most common logs in one tap. */
const SHORTCUTS: RouterAction[] = [
  { id: 'tuvalet', title: 'Tuvalet kaydet', icon: 'symbol:drop.fill', params: { href: '/tuvalet' } },
  { id: 'ogun', title: 'Öğün ekle', icon: 'symbol:fork.knife', params: { href: '/yemek-ekle' } },
  { id: 'semptom', title: 'Semptom kaydet', icon: 'symbol:waveform.path.ecg', params: { href: '/semptom' } },
  { id: 'sor', title: 'Bunu yesem mi?', icon: 'symbol:camera.fill', params: { href: '/sor' } },
];

export default function TabsLayout() {
  useQuickActionRouting();
  const pathname = usePathname();
  useEffect(() => rememberTab(pathname), [pathname]);
  useEffect(() => {
    if (Platform.OS !== 'web') QuickActions.setItems(SHORTCUTS).catch(() => {});
  }, []);

  return (
    <NativeTabs tintColor={palette.lettuceDeep} minimizeBehavior="onScrollDown" labelStyle={{ fontFamily: 'Nunito_700Bold' }}>
      <NativeTabs.Trigger name="(bugun)">
        <NativeTabs.Trigger.Icon sf={{ default: 'leaf', selected: 'leaf.fill' }} md="eco" />
        <NativeTabs.Trigger.Label>Bugün</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="gunluk">
        <NativeTabs.Trigger.Icon sf={{ default: 'book.closed', selected: 'book.closed.fill' }} md="menu_book" />
        <NativeTabs.Trigger.Label>Günlük</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sor">
        <NativeTabs.Trigger.Icon sf={{ default: 'camera', selected: 'camera.fill' }} md="photo_camera" />
        <NativeTabs.Trigger.Label>Sor</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ben">
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} md="insights" />
        <NativeTabs.Trigger.Label>Örüntüler</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="liste" role="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Yemekler</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
