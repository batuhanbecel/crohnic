import type { BowelLog, Daily, HbiRow, SymptomLog } from './db';
import { isoDay, startOfDay } from './dates';
import { palette } from './theme';

/**
 * Weekly Crohn's activity score, built on the Harvey-Bradshaw Index (HBI): general well-being
 * (0–4) + abdominal pain (0–3) + liquid/soft stools a day + 1 for each complication. The
 * abdominal mass item needs a doctor's hands, so it isn't asked (it counts 0). The classic HBI
 * looks at the day before; here the questions cover the past 7 days, and the stool count is
 * the daily average from the toilet log. It follows the trend between visits; it doesn't
 * replace the score the doctor takes.
 */

export const WELLBEING = ['Çok iyi', 'İdare eder', 'Kötü', 'Çok kötü', 'Berbat'] as const;
export const PAIN = ['Yok', 'Hafif', 'Orta', 'Şiddetli'] as const;

export const COMPLICATIONS = [
  { key: 'eklem', label: 'Eklem ağrısı', hint: 'diz, ayak bileği, bel' },
  { key: 'goz', label: 'Gözde kızarıklık ya da ağrı', hint: 'ışığa hassasiyet, bulanık görme' },
  { key: 'eritem', label: 'Bacakta kırmızı, ağrılı şişlikler', hint: 'genelde kaval kemiği üstünde' },
  { key: 'aft', label: 'Ağızda aft', hint: 'geçmeyen yaralar' },
  { key: 'cilt', label: 'Ciltte iyileşmeyen yara', hint: '' },
  { key: 'fissur', label: 'Makatta çatlak', hint: 'dışkılarken keskin ağrı' },
  { key: 'fistul', label: 'Yeni fistül', hint: 'makat çevresinden akıntı' },
  { key: 'apse', label: 'Apse', hint: 'şiş, ağrılı, sıcak bölge' },
] as const;

export type HbiInput = { wellbeing: number; pain: number; liquid: number; complications: string[] };

export function hbiScore(h: HbiInput) {
  return Math.round((h.wellbeing + h.pain + h.liquid + h.complications.length) * 10) / 10;
}

export type HbiBand = { key: 'remisyon' | 'hafif' | 'orta' | 'agir'; label: string; color: string; bg: string; text: string };

/** Usual cut-offs: under 5 remission, 5–7 mild, 8–16 moderate, above 16 severe. */
export function hbiBand(score: number): HbiBand {
  if (score < 5) return { key: 'remisyon', label: 'Sakin', color: palette.good, bg: palette.goodSoft, text: 'Remisyon aralığında.' };
  if (score < 8) return { key: 'hafif', label: 'Hafif', color: palette.warn, bg: palette.warnSoft, text: 'Hafif hareketlilik aralığında.' };
  if (score <= 16) return { key: 'orta', label: 'Orta', color: palette.bad, bg: palette.badSoft, text: 'Orta düzey hareketlilik aralığında. Doktorunla paylaş.' };
  return { key: 'agir', label: 'Ağır', color: palette.bad, bg: palette.badSoft, text: 'Ağır hareketlilik aralığında. Beklemeden doktoruna haber ver.' };
}

/** Monday 00:00 of the week `ms` is in. */
export function weekStart(ms: number) {
  const d = new Date(startOfDay(ms));
  const back = (d.getDay() + 6) % 7; // Monday = 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back).getTime();
}

export const weekKey = (ms: number) => isoDay(weekStart(ms));

/** "13–19 Ekim" */
export function weekLabel(startMs: number) {
  const end = new Date(startMs + 6 * 86400000 + 3600000);
  const s = new Date(startMs);
  const month = (d: Date) => d.toLocaleDateString('tr-TR', { month: 'long' });
  return s.getMonth() === end.getMonth() ? `${s.getDate()}–${end.getDate()} ${month(end)}` : `${s.getDate()} ${month(s)} – ${end.getDate()} ${month(end)}`;
}

/**
 * Answers worked out from the last 7 days of logs, so the form opens filled in:
 * stools Bristol 5–7 per day, pain from the worst symptom of each day, well-being from the
 * daily mood. `days` says how many of the 7 days had a toilet log (few means "check it").
 */
export function prefill(at: number, bowel: BowelLog[], symptoms: SymptomLog[], daily: Daily[]) {
  const from = startOfDay(at) - 6 * 86400000;
  const inWeek = (t: number) => t >= from && t <= at;
  const b = bowel.filter((x) => inWeek(x.at));
  const soft = b.filter((x) => x.bristol >= 5).length;
  const bowelDays = new Set(b.map((x) => isoDay(x.at))).size;
  const liquid = Math.round((soft / 7) * 10) / 10;

  const maxByDay = new Map<string, number>();
  for (const s of symptoms.filter((x) => inWeek(x.at))) maxByDay.set(isoDay(s.at), Math.max(maxByDay.get(isoDay(s.at)) ?? 0, s.pain));
  const painAvg = maxByDay.size ? [...maxByDay.values()].reduce((a, c) => a + c, 0) / 7 : null;
  const pain = painAvg == null ? null : painAvg < 0.3 ? 0 : painAvg <= 1.5 ? 1 : painAvg <= 3 ? 2 : 3;

  const feels = daily.filter((d) => d.feel != null && d.day >= isoDay(from)).map((d) => d.feel!);
  const feel = feels.length ? feels.reduce((a, c) => a + c, 0) / feels.length : null;
  // daily mood is 0 (bad) … 4 (great); well-being is 0 (very well) … 4 (terrible)
  const wellbeing = feel == null ? null : feel >= 3 ? 0 : feel >= 2 ? 1 : feel >= 1 ? 2 : 3;

  return { liquid, bowelDays, pain, wellbeing };
}

export function parseComplications(row: Pick<HbiRow, 'complications'>) {
  return (row.complications ?? '').split(',').filter(Boolean);
}

/** True from Friday on when this week has no score yet. */
export function hbiDue(at: number, rows: Pick<HbiRow, 'week'>[]) {
  const dow = (new Date(at).getDay() + 6) % 7; // Monday 0 … Sunday 6
  return dow >= 4 && !rows.some((r) => r.week === weekKey(at));
}
