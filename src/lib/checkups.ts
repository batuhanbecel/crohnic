import type { Checkup } from './db';
import { startOfDay, timeLabel } from './dates';

/**
 * Things with a date that matter between visits: appointments, routine blood and stool tests,
 * scopes and scans, vaccines (important on immune-suppressing drugs), bone density on long
 * cortisone. The intervals are common defaults; the doctor's plan always wins.
 */
export type CheckupKind = {
  key: string;
  label: string;
  emoji: string;
  /** default repeat in days; 0 = once */
  every: number;
  remind: number;
  timed: boolean;
  /** what to do when it's done */
  after?: 'labs' | 'report';
};

export const KINDS: CheckupKind[] = [
  { key: 'randevu', label: 'Doktor randevusu', emoji: '🩺', every: 0, remind: 1, timed: true, after: 'report' },
  { key: 'kan', label: 'Kan tahlili', emoji: '🩸', every: 90, remind: 1, timed: false, after: 'labs' },
  { key: 'kalprotektin', label: 'Kalprotektin (dışkı)', emoji: '🧪', every: 180, remind: 2, timed: false, after: 'labs' },
  { key: 'vitamin', label: 'B12, D vitamini ve demir', emoji: '💊', every: 180, remind: 1, timed: false, after: 'labs' },
  { key: 'kolonoskopi', label: 'Kolonoskopi', emoji: '🔬', every: 0, remind: 3, timed: true },
  { key: 'goruntuleme', label: 'MR ya da ultrason', emoji: '🖥️', every: 0, remind: 2, timed: true },
  { key: 'asi', label: 'Grip aşısı', emoji: '💉', every: 365, remind: 3, timed: false },
  { key: 'kemik', label: 'Kemik yoğunluğu', emoji: '🦴', every: 0, remind: 3, timed: false },
  { key: 'diger', label: 'Başka bir kontrol', emoji: '📌', every: 0, remind: 1, timed: false },
];

const BY_KEY = new Map(KINDS.map((k) => [k.key, k]));
export const kindOf = (key: string) => BY_KEY.get(key) ?? BY_KEY.get('diger')!;

export const REPEATS = [
  { days: 0, label: 'Tek sefer' },
  { days: 90, label: '3 ayda bir' },
  { days: 180, label: '6 ayda bir' },
  { days: 365, label: 'Yılda bir' },
];

export const REMINDS = [
  { days: 0, label: 'O gün' },
  { days: 1, label: '1 gün önce' },
  { days: 3, label: '3 gün önce' },
  { days: 7, label: '1 hafta önce' },
];

export function repeatLabel(days: number) {
  return REPEATS.find((r) => r.days === days)?.label ?? (days ? `${days} günde bir` : 'Tek sefer');
}

const DAY = 86400000;

/** Whole days from today to the due day (negative = late). */
export function daysUntil(due: number, at: number) {
  return Math.round((startOfDay(due) - startOfDay(at)) / DAY);
}

/** "Bugün 10:30", "Yarın", "12 gün sonra", "3 gün gecikti", "18 Kasım" */
export function dueText(c: Pick<Checkup, 'due_at' | 'timed'>, at: number) {
  const d = daysUntil(c.due_at, at);
  const time = c.timed ? ` ${timeLabel(c.due_at)}` : '';
  if (d < 0) return `${-d} gün gecikti`;
  if (d === 0) return `Bugün${time}`;
  if (d === 1) return `Yarın${time}`;
  if (d < 14) return `${d} gün sonra${time}`;
  return new Date(c.due_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', ...(d > 300 ? { year: 'numeric' } : {}) }) + time;
}

/** Shown on the home screen: from its reminder day on, and while it's late. */
export function isDueSoon(c: Checkup, at: number) {
  if (c.done_at) return false;
  return daysUntil(c.due_at, at) <= Math.max(1, c.remind_days);
}
