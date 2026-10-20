import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Bootstrap } from '../components/Bootstrap';
import { AppProvider } from '../lib/app-state';
import { migrate } from '../lib/db';
import { palette } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Links from the widget, the app icon shortcuts and notifications open a screen like /tuvalet
 * directly. Without an anchor that screen was the only one in the stack: no tab bar, no way
 * back. With it the tabs always sit underneath, so closing the sheet lands on Bugün.
 */
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // brand type: Nunito, loaded before the first frame so nothing flashes in the system font
  const [fontsReady, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const ready = fontsReady || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  // Solid headers on every stacked screen: transparent ones let titles overlap
  // scrolled content on iOS 26, where the scroll-edge blur isn't applied to RN scroll views.
  // transparent bars with no title (pages draw their own, which scrolls away): on iOS 26+ the
  // system draws Liquid Glass buttons and blurs content scrolling under them (scroll edge
  // effect, which only appears when the bar has at least one button). Screen insets the
  // content automatically.
  const solid = {
    headerTransparent: true,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: palette.paper },
  };
  // sheets: the iOS 26 close button top-left (a glass xmark; sheets dismiss, they don't go
  // "back"), which also brings the scroll edge blur
  const sheet = {
    presentation: 'modal' as const,
    headerShown: true,
    ...solid,
    unstable_headerLeftItems: () => [
      { type: 'button' as const, label: 'Kapat', icon: { type: 'sfSymbol' as const, name: 'xmark' as const }, onPress: () => router.back() },
    ],
  };
  const pushed = { ...solid, headerBackVisible: true };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="crohnic.db" onInit={migrate}>
          <AppProvider>
            <StatusBar style="auto" />
            <Bootstrap />
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: palette.paper },
                headerShadowVisible: false,
                headerTintColor: palette.ink,
                headerTitleStyle: { color: palette.ink, fontFamily: 'Nunito_800ExtraBold' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="yemek-ekle" options={{ ...sheet, title: '' }} />
              <Stack.Screen name="semptom" options={{ ...sheet, title: '' }} />
              <Stack.Screen name="tuvalet" options={{ ...sheet, title: '' }} />
              <Stack.Screen name="ogun/[id]" options={{ ...sheet, title: '' }} />
              <Stack.Screen name="sonuc" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="besin/[id]" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="ayarlar" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="ilaclar" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="rapor" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="tahliller" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="oneriler" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="ilac" options={{ ...sheet, title: '' }} />
              <Stack.Screen name="gun" options={{ ...sheet, title: '' }} />
              <Stack.Screen name="skor" options={{ ...sheet, title: '' }} />
              <Stack.Screen name="kontrol" options={{ ...sheet, title: '' }} />
              <Stack.Screen name="kontroller" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="hafta" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="disarida" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="tarif" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="durumlar" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="bildirimler" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="yedek" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="baglanti" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="kisayollar" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="hosgeldin" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
            </Stack>
          </AppProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
