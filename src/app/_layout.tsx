import {
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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../lib/app-state';
import { migrate } from '../lib/db';
import { colors, fonts } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  const modal = { presentation: 'modal' as const, headerShown: true };

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="crohnic.db" onInit={migrate}>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.bg },
              headerStyle: { backgroundColor: colors.bg },
              headerShadowVisible: false,
              headerTintColor: colors.coral,
              headerTitleStyle: { fontFamily: fonts.heavy, color: colors.ink, fontSize: 17 },
              headerBackButtonDisplayMode: 'minimal',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="yemek-ekle" options={{ ...modal, title: 'Yemek kaydı' }} />
            <Stack.Screen name="semptom" options={{ ...modal, title: 'Nasıl hissediyorsun?' }} />
            <Stack.Screen name="tuvalet" options={{ ...modal, title: 'Tuvalet kaydı' }} />
            <Stack.Screen name="ogun/[id]" options={{ ...modal, title: 'Öğün' }} />
            <Stack.Screen name="sonuc" options={{ title: 'Kıvırcık’ın yorumu' }} />
            <Stack.Screen name="besin/[id]" options={{ title: '' }} />
            <Stack.Screen name="ayarlar" options={{ title: 'Ayarlar' }} />
          </Stack>
        </AppProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
