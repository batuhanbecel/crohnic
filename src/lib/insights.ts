import type { BowelLog, Daily, Meal, SymptomLog } from './db';
import { isoDay } from './dates';
import { findFoodByName, normalizeName } from './foods';

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
    // merged/renamed foods count as one (e.g. an old "Kayseri mantısı" entry is "Mantı")
    for (const name of new Set(items.map((m) => findFoodByName(m.name)?.name ?? m.name))) {
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

export type PhasePeriod = { phase: 'remisyon' | 'atak'; from: number; to: number | null; days: number };

/** Collapse the phase-change log into periods (repeated same-phase entries merge). Newest first. */
export function phasePeriods(changes: { phase: 'remisyon' | 'atak'; started_at: number }[], at = Date.now()): PhasePeriod[] {
  const merged: { phase: 'remisyon' | 'atak'; from: number }[] = [];
  for (const c of [...changes].sort((a, b) => a.started_at - b.started_at)) {
    if (merged.length && merged[merged.length - 1].phase === c.phase) continue;
    merged.push({ phase: c.phase, from: c.started_at });
  }
  return merged
    .map((p, i) => {
      const to = merged[i + 1]?.from ?? null;
      const end = to ?? at;
      return { phase: p.phase, from: p.from, to, days: Math.max(1, Math.round((end - p.from) / 86400000)) };
    })
    .reverse();
}

/** Days spent in flare inside [from, to). */
export function flareDaysBetween(periods: PhasePeriod[], from: number, to: number) {
  let ms = 0;
  for (const p of periods) {
    if (p.phase !== 'atak') continue;
    const a = Math.max(p.from, from);
    const b = Math.min(p.to ?? to, to);
    if (b > a) ms += b - a;
  }
  return Math.ceil(ms / 86400000); // a started day counts
}

export type DayStatus = 'good' | 'mid' | 'bad' | 'none';

/** How each day went, for the calendar: the worst signal of the day wins. */
export function dayStatuses(meals: Meal[], symptoms: SymptomLog[], bowel: BowelLog[], daily: Daily[]) {
  const rank: Record<DayStatus, number> = { none: 0, good: 1, mid: 2, bad: 3 };
  const out = new Map<string, DayStatus>();
  const bump = (day: string, s: DayStatus) => {
    const cur = out.get(day) ?? 'none';
    if (rank[s] > rank[cur]) out.set(day, s);
  };
  for (const m of meals) bump(isoDay(m.eaten_at), m.reaction === 2 ? 'bad' : m.reaction === 1 ? 'mid' : 'good');
  for (const s of symptoms) bump(isoDay(s.at), s.pain >= 3 || s.bloating >= 4 ? 'bad' : s.pain >= 1 || s.bloating >= 2 || s.gas >= 3 ? 'mid' : 'good');
  for (const b of bowel) bump(isoDay(b.at), b.blood || b.bristol >= 6 ? 'bad' : b.bristol === 5 || b.bristol <= 2 ? 'mid' : 'good');
  for (const d of daily) if (d.feel != null) bump(d.day, d.feel === 0 ? 'bad' : d.feel <= 2 ? 'mid' : 'good');
  return out;
}

// ---------- meal times ----------
export type MealTiming = {
  /** average time of the first and last meal of the day, minutes after midnight */
  first: number | null;
  last: number | null;
  days: number;
  /** nights after a late dinner (last meal 21:00 or later) vs earlier ones: share with a toilet trip 23:00–07:00 */
  late: { n: number; rate: number } | null;
  early: { n: number; rate: number } | null;
};

const LATE_FROM = 21 * 60;

/** A day runs 04:00 → 04:00, so a 01:00 snack belongs to the evening before. */
const dayOf = (t: number) => isoDay(t - 4 * H);
const minutesOf = (t: number) => {
  const d = new Date(t);
  const m = d.getHours() * 60 + d.getMinutes();
  return m < 4 * 60 ? m + 24 * 60 : m;
};

/**
 * When the user eats, and whether late dinners go with getting up at night. A night only
 * counts when there's a toilet log within the next day and a half (someone who doesn't log the
 * toilet can't show "no night trips"). Needs 4 nights on each side to say anything.
 */
export function mealTiming(meals: Meal[], bowel: BowelLog[], since: number): MealTiming {
  const byDay = new Map<string, { first: number; last: number; lastAt: number }>();
  for (const m of meals) {
    if (m.eaten_at < since || m.tags.split(',').includes('sigara')) continue;
    const k = dayOf(m.eaten_at);
    const min = minutesOf(m.eaten_at);
    const cur = byDay.get(k);
    if (!cur) byDay.set(k, { first: min, last: min, lastAt: m.eaten_at });
    else {
      cur.first = Math.min(cur.first, min);
      if (min > cur.last) {
        cur.last = min;
        cur.lastAt = m.eaten_at;
      }
    }
  }
  const days = [...byDay.values()];
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const late: boolean[] = [];
  const early: boolean[] = [];
  for (const [day, d] of byDay) {
    const [y, mo, dd] = day.split('-').map(Number);
    const nightFrom = new Date(y, mo - 1, dd, 23, 0).getTime();
    const nightTo = new Date(y, mo - 1, dd + 1, 7, 0).getTime();
    const logged = bowel.some((b) => b.at >= d.lastAt && b.at < d.lastAt + 36 * H);
    if (!logged || nightTo > Date.now()) continue;
    const trip = bowel.some((b) => b.at >= Math.max(nightFrom, d.lastAt) && b.at < nightTo);
    (d.last >= LATE_FROM ? late : early).push(trip);
  }
  const rate = (xs: boolean[]) => (xs.length >= 4 ? { n: xs.length, rate: xs.filter(Boolean).length / xs.length } : null);
  return { first: avg(days.map((d) => d.first)), last: avg(days.map((d) => d.last)), days: days.length, late: rate(late), early: rate(early) };
}

/** 1290 → "21:30" (minutes after midnight; past 24:00 wraps). */
export function clockLabel(min: number) {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
