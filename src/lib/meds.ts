import type { Med, MedLog } from './db';
import { fromIsoDay, isoDay, startOfDay } from './dates';

const DAY = 86400000;

export function parseTimes(times: string): [number, number][] {
  return times
    .split(',')
    .map((t) => t.trim().split(':').map(Number) as [number, number])
    .filter(([h, m]) => Number.isFinite(h) && Number.isFinite(m) && h >= 0 && h < 24 && m >= 0 && m < 60)
    .sort((a, b) => a[0] * 60 + a[1] - (b[0] * 60 + b[1]));
}

export function fmtTime([h, m]: [number, number]) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Is a dose of this med due on the calendar day starting at `dayStart`? */
export function dueOnDay(med: Pick<Med, 'kind' | 'every_days' | 'start_day'>, dayStart: number) {
  const start = fromIsoDay(med.start_day);
  if (dayStart < start) return false;
  if (med.kind === 'daily') return true;
  const n = Math.max(1, med.every_days);
  const diff = Math.round((dayStart - start) / DAY); // round: DST days are 23/25 h
  return diff % n === 0;
}

/** Dose times (ms) between from (inclusive) and to (exclusive). */
export function slotsBetween(med: Med, from: number, to: number) {
  const times = parseTimes(med.times);
  const use = med.kind === 'interval' ? times.slice(0, 1) : times;
  const out: number[] = [];
  for (let d = startOfDay(from); d < to; d = startOfDay(d + DAY * 1.5)) {
    if (!dueOnDay(med, d)) continue;
    for (const [h, m] of use) {
      const day = new Date(d);
      const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime();
      if (t >= from && t < to) out.push(t);
    }
  }
  return out;
}

export type Dose = { med: Med; due: number; log: MedLog | null };

/** Today's doses plus missed interval doses from the last few days (an every-2-weeks injection is easy to forget). */
export function dosesForToday(meds: Med[], logs: MedLog[], at: number): Dose[] {
  const today = startOfDay(at);
  const key = (id: number, due: number) => `${id}:${due}`;
  const byKey = new Map(logs.map((l) => [key(l.med_id, l.due_at), l]));
  const out: Dose[] = [];
  for (const med of meds) {
    const from = med.kind === 'interval' ? today - 3 * DAY : today;
    for (const due of slotsBetween(med, from, today + DAY)) {
      const log = byKey.get(key(med.id, due)) ?? null;
      if (due < today && log) continue; // only carry over missed ones
      out.push({ med, due, log });
    }
  }
  return out.sort((a, b) => a.due - b.due);
}

/** Taken / due in a window, per med. */
export function adherence(meds: Med[], logs: MedLog[], from: number, to: number) {
  return meds
    .map((med) => {
      const start = Math.max(from, fromIsoDay(med.start_day), startOfDay(med.created_at));
      const slots = slotsBetween(med, start, to);
      const taken = logs.filter((l) => l.med_id === med.id && l.taken_at != null && l.due_at >= start && l.due_at < to).length;
      return { med, due: slots.length, taken: Math.min(taken, slots.length) };
    })
    .filter((x) => x.due > 0);
}

export function scheduleLabel(med: Pick<Med, 'kind' | 'times' | 'every_days'>) {
  const t = parseTimes(med.times).map(fmtTime);
  if (med.kind === 'daily') return `Her gün ${t.join(', ')}`;
  if (med.every_days === 7) return `Haftada bir, ${t[0] ?? ''}`;
  if (med.every_days === 14) return `İki haftada bir, ${t[0] ?? ''}`;
  if (med.every_days === 28) return `Dört haftada bir, ${t[0] ?? ''}`;
  return `${med.every_days} günde bir, ${t[0] ?? ''}`;
}

export { isoDay };
