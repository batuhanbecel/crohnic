import type { BowelLog, Daily, Meal, SymptomLog } from './db';
import { isoDay } from './dates';
import { normalizeName } from './foods';

const H = 3600000;

/** Moments that count as "a rough moment" for linking. */
export function badEvents(symptoms: SymptomLog[], bowel: BowelLog[]) {
  return [
    ...symptoms.filter((s) => s.pain >= 3 || s.bloating >= 4 || s.gas >= 4).map((s) => s.at),
    ...bowel.filter((b) => b.bristol >= 6 || b.blood).map((b) => b.at),
  ].sort((a, b) => a - b);
}

function followedByBad(at: number, events: number[], fromH = 2, toH = 24) {
  return events.some((e) => e >= at + fromH * H && e <= at + toH * H);
}

export type SuspectFood = { name: string; n: number; hit: number; rate: number };

/**
 * Foods that were often followed by a rough moment 2–24 h later.
 * Counts sittings, not rows, and only reports foods clearly above the user's own baseline.
 */
export function suspectFoods(meals: Meal[], symptoms: SymptomLog[], bowel: BowelLog[]) {
  const events = badEvents(symptoms, bowel);
  if (events.length < 2) return { foods: [] as SuspectFood[], baseline: 0 };
  const lastEvent = events[events.length - 1];
  // only meals old enough to have a full 24 h window
  const usable = meals.filter((m) => m.eaten_at <= Math.max(lastEvent, Date.now() - 24 * H));

  const sittings = new Map<string, Meal[]>();
  for (const m of usable) {
    const k = m.group_id ?? `m${m.id}`;
    sittings.set(k, [...(sittings.get(k) ?? []), m]);
  }
  const hitBySitting = new Map<string, boolean>();
  for (const [k, items] of sittings) hitBySitting.set(k, followedByBad(items[0].eaten_at, events));
  const baseline = sittings.size ? [...hitBySitting.values()].filter(Boolean).length / sittings.size : 0;

  const byFood = new Map<string, SuspectFood>();
  for (const [k, items] of sittings) {
    const hit = hitBySitting.get(k)!;
    for (const name of new Set(items.map((m) => m.name))) {
      const key = normalizeName(name);
      const cur = byFood.get(key) ?? { name, n: 0, hit: 0, rate: 0 };
      cur.n++;
      if (hit) cur.hit++;
      byFood.set(key, cur);
    }
  }
  const foods = [...byFood.values()]
    .map((f) => ({ ...f, rate: f.hit / f.n }))
    .filter((f) => f.n >= 3 && f.hit >= 2 && f.rate >= 0.5 && f.rate >= baseline + 0.2)
    .sort((a, b) => b.rate - a.rate || b.n - a.n)
    .slice(0, 6);
  return { foods, baseline };
}

export type LifestyleEffect = { key: 'stress' | 'sleep'; label: string; highLabel: string; lowLabel: string; high: number; low: number; nHigh: number; nLow: number };

/** Was the same or the next day rough? (stress and poor sleep often show up a day later) */
function roughDays(symptoms: SymptomLog[], bowel: BowelLog[], meals: Meal[]) {
  const rough = new Set<string>();
  for (const s of symptoms) if (s.pain >= 3 || s.bloating >= 4) rough.add(isoDay(s.at));
  for (const b of bowel) if (b.bristol >= 6 || b.blood) rough.add(isoDay(b.at));
  for (const m of meals) if (m.reaction === 2) rough.add(isoDay(m.eaten_at));
  return rough;
}

const nextDay = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return isoDay(new Date(y, m - 1, d + 1, 12).getTime());
};

export function lifestyleEffects(daily: Daily[], symptoms: SymptomLog[], bowel: BowelLog[], meals: Meal[]): LifestyleEffect[] {
  const rough = roughDays(symptoms, bowel, meals);
  const isRough = (day: string) => rough.has(day) || rough.has(nextDay(day));
  const rate = (days: Daily[]) => (days.length ? days.filter((d) => isRough(d.day)).length / days.length : 0);

  const out: LifestyleEffect[] = [];
  const stressHigh = daily.filter((d) => d.stress != null && d.stress >= 2);
  const stressLow = daily.filter((d) => d.stress != null && d.stress <= 1);
  if (stressHigh.length >= 3 && stressLow.length >= 3) {
    out.push({ key: 'stress', label: 'Stres', highLabel: 'Gergin günlerden sonra', lowLabel: 'Sakin günlerden sonra', high: rate(stressHigh), low: rate(stressLow), nHigh: stressHigh.length, nLow: stressLow.length });
  }
  const badSleep = (d: Daily) => d.sleep_q === 0 || (d.sleep_h != null && d.sleep_h <= 5);
  const goodSleep = (d: Daily) => !badSleep(d) && (d.sleep_q === 2 || (d.sleep_h != null && d.sleep_h >= 7));
  const sleepBad = daily.filter(badSleep);
  const sleepGood = daily.filter(goodSleep);
  if (sleepBad.length >= 3 && sleepGood.length >= 3) {
    out.push({ key: 'sleep', label: 'Uyku', highLabel: 'Kötü uykudan sonra', lowLabel: 'İyi uykudan sonra', high: rate(sleepBad), low: rate(sleepGood), nHigh: sleepBad.length, nLow: sleepGood.length });
  }
  return out;
}
