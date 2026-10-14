import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Appearance, AppState, DevSettings, Platform } from 'react-native';
import { useApp } from '../lib/app-state';
import { handleNotificationAction, setupNotifications, syncReminders } from '../lib/reminders';
import { scheme } from '../lib/theme';

setupNotifications();

/** Side effects that need the database: reminders, notification taps, appearance changes. */
export function Bootstrap() {
  const sql = useSQLiteContext();
  const { ready, dataVersion, bump } = useApp();

  // keep rolling reminders fresh
  useEffect(() => {
    if (ready) syncReminders(sql);
  }, [sql, ready, dataVersion]);

  // open the screen a notification points to
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    const go = async (r: Notifications.NotificationResponse | null) => {
      if (!r) return;
      // "İyi geldi" / "Aldım" pressed on the notification: save it, don't navigate
      if (await handleNotificationAction(sql, r)) {
        bump();
        return;
      }
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string' && url !== '/') router.push(url as never);
    };
    const cold = Notifications.getLastNotificationResponse();
    Notifications.clearLastNotificationResponse();
    const t = setTimeout(() => go(cold), 400); // let the navigator mount first
    const sub = Notifications.addNotificationResponseReceivedListener(go);
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, [ready, sql, bump]);

  // re-sync on resume; reload if light/dark changed while the app was open
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      syncReminders(sql);
      const now = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
      if (now !== scheme) {
        if (__DEV__) DevSettings.reload();
        else Updates.reloadAsync().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [sql]);

  return null;
}
