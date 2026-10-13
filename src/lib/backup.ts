import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as db from './db';
import { isoDay } from './dates';
import { photoUri } from './photos';

/**
 * Backup = one JSON file the user keeps wherever they like
 * (share sheet → "Dosyalara Kaydet" → iCloud Drive). Meal photos stay on the phone.
 */
export async function shareBackup(sql: SQLiteDatabase) {
  const data = await db.exportAll(sql);
  const file = new File(Paths.cache, `Crohnic-yedek-${isoDay(Date.now())}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data));
  await Sharing.shareAsync(file.uri, { UTI: 'public.json', mimeType: 'application/json', dialogTitle: 'Crohnic yedeği' });
  await db.setSetting(sql, 'last_backup', String(Date.now()));
}

/** Opens the Files picker; resolves to null when the user cancels. Throws on a wrong file. */
export async function pickBackup() {
  const picked = await File.pickFileAsync(); // no type filter: iCloud sometimes labels .json oddly; content is validated instead
  if (picked.canceled || !picked.result) return null;
  return db.readBackup(await picked.result.text());
}

export async function applyBackup(sql: SQLiteDatabase, data: Record<string, unknown>) {
  // photos aren't in the backup; drop references to files this phone doesn't have
  if (Array.isArray(data.meals)) {
    data.meals = (data.meals as Record<string, unknown>[]).map((m) => {
      if (!m.photo) return m;
      try {
        const uri = photoUri(String(m.photo));
        return uri && new File(uri).exists ? m : { ...m, photo: null };
      } catch {
        return { ...m, photo: null };
      }
    });
  }
  await db.importAll(sql, data);
  await db.setSetting(sql, 'onboarded', '1');
}

export async function lastBackup(sql: SQLiteDatabase) {
  const v = await db.getSetting(sql, 'last_backup');
  return v ? Number(v) : null;
}
