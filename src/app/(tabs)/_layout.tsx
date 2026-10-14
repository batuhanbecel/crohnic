import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { palette } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <NativeTabs tintColor={palette.lettuceDeep} minimizeBehavior="onScrollDown" labelStyle={{ fontFamily: 'Nunito_700Bold' }}>
      <NativeTabs.Trigger name="index">
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
