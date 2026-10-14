import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Image, Platform } from 'react-native';
import { now, startOfDay, timeLabel } from './dates';
import * as db from './db';
import { dosesForToday } from './meds';

/**
 * Pushes today's numbers to the home/lock screen widget. Cheap; called on launch, resume and
 * after every change. Safe to call where widgets don't exist (web, old builds): it just returns.
 */
export async function syncWidget(sql: SQLiteDatabase) {
  if (Platform.OS !== 'ios') return;
  try {
    const { widgetsDirectory } = await import('expo-widgets');
    const Bugun = (await import('../widgets/Bugun')).default;
    const t = now();
    const from = startOfDay(t);
    const [meals, bowel, symptoms, meds, logs] = await Promise.all([
      db.listMeals(sql, 60),
      db.listBowel(sql, 60),
      db.listSymptoms(sql, 30),
      db.listMeds(sql),
      db.medLogsBetween(sql, from - 4 * 86400000, from + 86400000),
    ]);
    const mealsToday = db.groupMeals(meals.filter((m) => m.eaten_at >= from)).length;
    const next = dosesForToday(meds, logs, t).find((d) => !d.log && d.due >= from);
    const img = mascotFile(widgetsDirectory);
    const today = {
      toilet: bowel.filter((b) => b.at >= from).length,
      meals: mealsToday,
      symptoms: symptoms.filter((s) => s.at >= from).length,
      dose: next ? `${next.med.name} ${timeLabel(next.due)}` : '',
      img,
    };
    // today's numbers now, and zeros from midnight on even if the app isn't opened
    Bugun.updateTimeline([
      { date: new Date(t), props: today },
      { date: new Date(from + 86400000 + 60000), props: { toilet: 0, meals: 0, symptoms: 0, dose: '', img } },
    ]);
  } catch (e) {
    // widget extension not in this build yet, or the write failed
    console.warn('widget sync failed', e);
  }
}

/** Copies Kıvırcık into the folder the widget can read (once) and returns its file URI. */
function mascotFile(dir: string | null): string {
  if (!dir) return '';
  try {
    const target = new File(dir, 'kivircik.webp');
    if (!target.exists) {
      const src = Image.resolveAssetSource(require('../../assets/kivircik/mutlu.webp'));
      new File(src.uri).copy(target);
    }
    return target.uri;
  } catch {
    return '';
  }
}
