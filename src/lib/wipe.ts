import { Directory, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import * as db from './db';
import { syncReminders } from './reminders';
import { syncWidget } from './widget-sync';

/**
 * Erase everything Crohnic keeps on this phone: the records, meal photos, the automatic daily
 * copies, scheduled reminders and alarms, and what the widget shows. Backups the user exported
 * to Files or iCloud are theirs and stay where they put them.
 */
export async function wipeEverything(sql: SQLiteDatabase) {
  await db.wipeAll(sql);
  for (const name of ['photos', 'Yedekler']) {
    try {
      const dir = new Directory(Paths.document, name);
      if (dir.exists) dir.delete();
    } catch {
      // a folder that can't be removed shouldn't stop the rest
    }
  }
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  await syncReminders(sql); // no meds left: this also takes the alarms down
  await syncWidget(sql).catch(() => {});
}
