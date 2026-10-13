import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Bootstrap } from '../components/Bootstrap';
import { hasLiquidGlass } from '../components/ui';
import { AppProvider } from '../lib/app-state';
import { migrate } from '../lib/db';
import { palette } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const glass = hasLiquidGlass();
  const sheet = {
    presentation: 'modal' as const,
    headerShown: true,
    headerTransparent: true,
    headerBlurEffect: glass ? undefined : ('systemUltraThinMaterial' as const),
  };
  const pushed = {
    headerTransparent: true,
    headerBlurEffect: glass ? undefined : ('systemUltraThinMaterial' as const),
  };

  return (
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
              headerTitleStyle: { color: palette.ink, fontWeight: '600' },
              headerBackButtonDisplayMode: 'minimal',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="yemek-ekle" options={{ ...sheet, title: 'Öğün ekle' }} />
            <Stack.Screen name="semptom" options={{ ...sheet, title: 'Bugün nasılsın' }} />
            <Stack.Screen name="tuvalet" options={{ ...sheet, title: 'Tuvalet' }} />
            <Stack.Screen name="ogun/[id]" options={{ ...sheet, title: 'Öğün' }} />
            <Stack.Screen name="sonuc" options={{ ...pushed, title: '' }} />
            <Stack.Screen name="besin/[id]" options={{ ...pushed, title: '' }} />
            <Stack.Screen name="ayarlar" options={{ ...pushed, title: 'Ayarlar' }} />
            <Stack.Screen name="ilaclar" options={{ ...pushed, title: 'İlaçlarım' }} />
            <Stack.Screen name="rapor" options={{ ...pushed, title: 'Doktor raporu' }} />
            <Stack.Screen name="ilac" options={{ ...sheet, title: 'İlaç' }} />
            <Stack.Screen name="gun" options={{ ...sheet, title: 'Bugün nasıldı' }} />
            <Stack.Screen name="hosgeldin" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
          </Stack>
        </AppProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
