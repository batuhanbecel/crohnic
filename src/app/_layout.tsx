import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
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
  const solid = {
    headerTransparent: false,
    headerStyle: { backgroundColor: palette.paper },
    headerShadowVisible: false,
  };
  const sheet = { presentation: 'modal' as const, headerShown: true, ...solid };
  const pushed = { ...solid };

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
              <Stack.Screen name="yemek-ekle" options={{ ...sheet, title: 'Öğün ekle' }} />
              <Stack.Screen name="semptom" options={{ ...sheet, title: 'Semptom' }} />
              <Stack.Screen name="tuvalet" options={{ ...sheet, title: 'Tuvalet' }} />
              <Stack.Screen name="ogun/[id]" options={{ ...sheet, title: 'Öğün' }} />
              <Stack.Screen name="sonuc" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="besin/[id]" options={{ ...pushed, title: '' }} />
              <Stack.Screen name="ayarlar" options={{ ...pushed, title: 'Ayarlar' }} />
              <Stack.Screen name="ilaclar" options={{ ...pushed, title: 'İlaçlarım' }} />
              <Stack.Screen name="rapor" options={{ ...pushed, title: 'Doktor raporu' }} />
              <Stack.Screen name="ilac" options={{ ...sheet, title: 'İlaç' }} />
              <Stack.Screen name="gun" options={{ ...sheet, title: 'Gün nasıldı' }} />
              <Stack.Screen name="hosgeldin" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
            </Stack>
          </AppProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
