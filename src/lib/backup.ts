import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as db from './db';
import { isoDay } from './dates';
import { photoUri } from './photos';

/**
 * Manual backup = one JSON file the user keeps wherever they like
 * (share sheet → "Dosyalara Kaydet" → iCloud Drive), e.g. to move to an Android phone.
 * Meal photos aren't in it; they are in the iPhone's own iCloud Backup.
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

/**
 * Weekly automatic copy inside the app's Documents folder (last 4 kept). Documents is part of
 * the iPhone's iCloud Backup, together with the database and meal photos, so this is a second
 * line of defence: it lets the user roll back if something goes wrong on the phone itself.
 */
const SNAP_DIR = 'Yedekler';
const SNAP_KEEP = 4;

function snapDir() {
  const dir = new Directory(Paths.document, SNAP_DIR);
  if (!dir.exists) dir.create();
  return dir;
}

export async function autoSnapshot(sql: SQLiteDatabase) {
  try {
    const last = Number((await db.getSetting(sql, 'last_auto_backup')) ?? 0);
    if (Date.now() - last < 7 * 86400000) return;
    if ((await db.countMeals(sql)) === 0) return;
    const data = await db.exportAll(sql);
    const dir = snapDir();
    const file = new File(dir, `oto-${isoDay(Date.now())}.json`);
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(data));
    const old = dir
      .list()
      .filter((x): x is File => x instanceof File && x.name.startsWith('oto-'))
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(SNAP_KEEP);
    for (const f of old) f.delete();
    await db.setSetting(sql, 'last_auto_backup', String(Date.now()));
  } catch (e) {
    console.warn('auto backup failed', e);
  }
}

/** Newest automatic copy, parsed; null when there is none. */
export async function latestSnapshot() {
  try {
    const files = snapDir()
      .list()
      .filter((x): x is File => x instanceof File && x.name.startsWith('oto-'))
      .sort((a, b) => b.name.localeCompare(a.name));
    if (!files.length) return null;
    return db.readBackup(await files[0].text());
  } catch {
    return null;
  }
}

export async function lastBackup(sql: SQLiteDatabase) {
  const v = await db.getSetting(sql, 'last_backup');
  return v ? Number(v) : null;
}
