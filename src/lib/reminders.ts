import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import * as db from './db';
import { isoDay, startOfDay } from './dates';
import { fmtTime, parseTimes, slotsBetween } from './meds';

/**
 * Local notifications only (no push server):
 *  - meal follow-up ~3 h after eating ("nasıl geçti?")
 *  - medication reminders
 *  - evening check-in (stress, sleep) on days it isn't filled in yet
 * Rolling one-off reminders are re-synced every time the app opens.
 */

const DAY = 86400000;
const MEAL_AFTER_H = 3;
const QUIET_FROM = 23;
const QUIET_TO = 8;
const MORNING = 9;

export const SETTINGS = {
  meals: 'remind_meals',
  daily: 'remind_daily',
  dailyTime: 'remind_daily_time',
} as const;

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

let handlerSet = false;
export function setupNotifications() {
  if (!supported || handlerSet) return;
  handlerSet = true;
  setupCategories();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ---------- quick actions on the notification itself ----------
// Actions open the app (opensAppToForeground): with the app closed iOS only delivers
// the answer when the app launches, so a background-only action could be lost.
const CATEGORY = { meal: 'mealCheck', med: 'medDose' } as const;

let categoriesSet = false;
async function setupCategories() {
  if (!supported || categoriesSet) return;
  categoriesSet = true;
  try {
    await Notifications.setNotificationCategoryAsync(CATEGORY.meal, [
      { identifier: 'r0', buttonTitle: '😌 İyi geldi' },
      { identifier: 'r1', buttonTitle: '😕 Biraz dokundu' },
      { identifier: 'r2', buttonTitle: '😣 Çok dokundu' },
    ]);
    await Notifications.setNotificationCategoryAsync(CATEGORY.med, [{ identifier: 'taken', buttonTitle: '✓ Aldım' }]);
  } catch {
    categoriesSet = false;
  }
}

/** Apply a quick action from a notification. Returns true when it was one. */
export async function handleNotificationAction(sql: SQLiteDatabase, r: Notifications.NotificationResponse) {
  const action = r.actionIdentifier;
  if (!action || action === Notifications.DEFAULT_ACTION_IDENTIFIER) return false;
  const data = (r.notification.request.content.data ?? {}) as Record<string, unknown>;
  if (data.kind === 'meal' && /^r[012]$/.test(action)) {
    const group = await db.getMealGroup(sql, Number(data.mealId));
    if (group.length) await db.setGroupReaction(sql, group.map((m) => m.id), Number(action[1]) as db.Reaction, null);
    return true;
  }
  if (data.kind === 'med' && action === 'taken') {
    let due = typeof data.due === 'number' ? data.due : null;
    if (due == null && typeof data.time === 'string') {
      // daily reminders repeat, so the dose is the one at this time on the day it fired
      const [h, m] = data.time.split(':').map(Number);
      const d = new Date(r.notification.date);
      due = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime();
    }
    if (due != null) await db.logDose(sql, Number(data.medId), due, true);
    return true;
  }
  return false;
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function permission(): Promise<PermissionState> {
  if (!supported) return 'denied';
  try {
    const p = await Notifications.getPermissionsAsync();
    if (p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
    return p.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function askPermission(): Promise<boolean> {
  if (!supported) return false;
  try {
    const p = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    return p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

export async function isOn(sql: SQLiteDatabase, key: string) {
  return (await db.getSetting(sql, key)) !== '0';
}

async function canNotify(sql: SQLiteDatabase, key: string) {
  return supported && (await isOn(sql, key)) && (await permission()) === 'granted';
}

async function schedule(id: string, title: string, body: string, when: number, url: string, extra?: { category?: string; data?: Record<string, unknown> }) {
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, data: { url, ...extra?.data }, sound: 'default', categoryIdentifier: extra?.category },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
}

// ---------- meals ----------
const mealId = (firstMealId: number) => `meal-${firstMealId}`;

/** Push a reminder that would ring at night to the next morning. */
function outOfQuietHours(t: number) {
  const d = new Date(t);
  const h = d.getHours();
  if (h >= QUIET_FROM) return { at: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, MORNING).getTime(), moved: true };
  if (h < QUIET_TO) return { at: new Date(d.getFullYear(), d.getMonth(), d.getDate(), MORNING).getTime(), moved: true };
  return { at: t, moved: false };
}

export async function scheduleMealReminder(sql: SQLiteDatabase, meal: { firstId: number; name: string; eatenAt: number }) {
  try {
    if (!(await canNotify(sql, SETTINGS.meals))) return;
    const { at, moved } = outOfQuietHours(meal.eatenAt + MEAL_AFTER_H * 3600000);
    if (at < Date.now() + 5 * 60000) return;
    const name = meal.name.length > 60 ? `${meal.name.slice(0, 57)}…` : meal.name;
    const title = moved ? 'Günaydın 🌱' : `${MEAL_AFTER_H} saat oldu 🌱`;
    const body = moved ? `Dün akşam yediğin ${name} nasıl geçti?` : `Yediğin ${name} nasıl geçti?`;
    await schedule(mealId(meal.firstId), title, body, at, `/ogun/${meal.firstId}`, {
      category: CATEGORY.meal,
      data: { kind: 'meal', mealId: meal.firstId },
    });
  } catch {
    // reminders are best effort
  }
}

/** Call after saving a meal: schedules the follow-up unless a reaction was already given. */
export async function afterMealSaved(sql: SQLiteDatabase, ids: number[], reaction?: db.Reaction | null) {
  if (!ids.length || reaction != null) return;
  const rows = await Promise.all(ids.map((id) => db.getMeal(sql, id)));
  const meals = rows.filter((m): m is db.Meal => !!m);
  if (!meals.length) return;
  await scheduleMealReminder(sql, { firstId: ids[0], name: meals.map((m) => m.name).join(', '), eatenAt: meals[0].eaten_at });
}

export async function cancelMealReminder(firstMealIds: number[]) {
  if (!supported) return;
  for (const id of firstMealIds) await Notifications.cancelScheduledNotificationAsync(mealId(id)).catch(() => {});
}

// ---------- meds + daily check-in ----------
async function cancelPrefix(prefixes: string[]) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all.filter((n) => prefixes.some((p) => n.identifier.startsWith(p))).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Rebuild medication and check-in reminders from the database. Cheap; call on launch, on resume and after edits. */
export async function syncReminders(sql: SQLiteDatabase) {
  if (!supported) return;
  try {
    await cancelPrefix(['med-', 'daily-', 'stock-']);
    if ((await permission()) !== 'granted') return;
    const now = Date.now();

    // medications
    const meds = (await db.listMeds(sql)).filter((m) => m.remind);
    const logs = await db.medLogsBetween(sql, startOfDay(now), now + 60 * DAY);
    const done = new Set(logs.map((l) => `${l.med_id}:${l.due_at}`));
    for (const m of meds) {
      const title = m.dose ? `${m.name} · ${m.dose}` : m.name;
      if (m.kind === 'daily') {
        // repeating daily trigger: keeps working even if the app isn't opened for days
        for (const [h, min] of parseTimes(m.times)) {
          await Notifications.scheduleNotificationAsync({
            identifier: `med-${m.id}-${fmtTime([h, min]).replace(':', '')}`,
            content: {
              title: 'İlaç saati',
              body: `${title} zamanı geldi.`,
              data: { url: '/', kind: 'med', medId: m.id, time: fmtTime([h, min]) },
              sound: 'default',
              categoryIdentifier: CATEGORY.med,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: min },
          });
        }
      } else {
        const next = slotsBetween(m, now + 60000, now + Math.max(60, m.every_days * 5) * DAY)
          .filter((t) => !done.has(`${m.id}:${t}`))
          .slice(0, 4);
        for (const t of next) {
          await schedule(`med-${m.id}-${t}`, 'İlaç günü', `Bugün ${title} günü.`, t, '/', { category: CATEGORY.med, data: { kind: 'med', medId: m.id, due: t } });
        }
      }
    }

    // running out at home: one nudge the next morning (re-planned on every sync, so it stops once refilled)
    for (const m of meds) {
      if (m.stock == null || m.stock > (m.stock_alert ?? 2)) continue;
      const d = new Date(startOfDay(now) + DAY + 3600000);
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0).getTime();
      const body = m.stock === 0 ? `${m.name} evde bitti. Reçeteni yenilemeyi unutma.` : `${m.name} için evde ${m.stock} doz kaldı. Reçeteni yenilemeyi unutma.`;
      await schedule(`stock-${m.id}`, 'İlacın bitiyor', body, at, '/ilaclar');
    }

    // evening check-in on the next days that aren't filled in yet
    if (await isOn(sql, SETTINGS.daily)) {
      const [h, min] = parseTimes((await db.getSetting(sql, SETTINGS.dailyTime)) ?? '21:30')[0] ?? [21, 30];
      for (let i = 0; i < 6; i++) {
        const d = new Date(startOfDay(now) + i * DAY + 3600000); // +1h guards DST
        const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, min).getTime();
        if (at <= now) continue;
        const done = await db.getDaily(sql, isoDay(at));
        if (done && (done.stress != null || done.sleep_q != null || done.sleep_h != null)) continue; // a feel-only row isn't a check-in
        await schedule(`daily-${isoDay(at)}`, 'Bugün nasıldı?', 'Stres ve uykunu 10 saniyede yaz, örüntülerde işe yarıyor.', at, '/gun');
      }
    }
  } catch {
    // best effort
  }
}
