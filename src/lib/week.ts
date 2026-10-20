import type { BowelLog, Daily, HbiRow, Meal, SymptomLog } from './db';
import { groupMeals, isTobacco } from './db';
import { isoDay } from './dates';
import type { Phase } from './foods';
import { weekKey } from './hbi';
import { mealTiming } from './insights';
import { areaCounts } from './pain-map';
import { PLANT_GOAL, plantsOf } from './plants';
import { averageWater } from './water';

const DAY = 86400000;

export type WeekStats = {
  start: number;
  end: number;
  /** days with any log */
  logged: number;
  toiletPerDay: number | null;
  watery: number;
  blood: number;
  painDays: number;
  maxPain: number | null;
  areas: Map<string, number>;
  sittings: number;
  /** sittings that bothered, and their names */
  bothered: { name: string; bad: boolean }[];
  fine: number;
  unrated: number;
  water: number | null;
  plants: string[];
  lastMeal: number | null;
  lateNights: number;
  hbi: HbiRow | null;
};

/** Everything the Sunday summary shows for the week starting at `start` (Monday 00:00). */
export function weekStats(start: number, d: { meals: Meal[]; symptoms: SymptomLog[]; bowel: BowelLog[]; daily: Daily[]; hbi: HbiRow[] }): WeekStats {
  const end = start + 7 * DAY;
  const inW = (t: number) => t >= start && t < end;
  const meals = d.meals.filter((m) => inW(m.eaten_at) && !isTobacco(m));
  const bowel = d.bowel.filter((b) => inW(b.at));
  const symptoms = d.symptoms.filter((s) => inW(s.at));
  const days = d.daily.filter((x) => x.day >= isoDay(start) && x.day < isoDay(end));
  const loggedDays = new Set([...meals.map((m) => isoDay(m.eaten_at)), ...bowel.map((b) => isoDay(b.at)), ...symptoms.map((s) => isoDay(s.at))]);
  const bowelDays = new Set(bowel.map((b) => isoDay(b.at))).size;
  const painByDay = new Map<string, number>();
  for (const s of symptoms) painByDay.set(isoDay(s.at), Math.max(painByDay.get(isoDay(s.at)) ?? 0, s.pain));
  const groups = groupMeals(meals);
  const timing = mealTiming(meals, d.bowel, start);
  const lateNights = new Set(meals.filter((m) => {
    const h = new Date(m.eaten_at).getHours();
    return h >= 21 || h < 4;
  }).map((m) => isoDay(m.eaten_at - 4 * 3600000))).size;
  return {
    start,
    end,
    logged: loggedDays.size,
    toiletPerDay: bowelDays ? bowel.length / bowelDays : null,
    watery: bowel.filter((b) => b.bristol >= 6).length,
    blood: bowel.filter((b) => b.blood).length,
    painDays: [...painByDay.values()].filter((p) => p >= 2).length,
    maxPain: painByDay.size ? Math.max(...painByDay.values()) : null,
    areas: areaCounts(symptoms),
    sittings: groups.length,
    bothered: groups.filter((g) => g.reaction != null && g.reaction > 0).map((g) => ({ name: g.name, bad: g.reaction === 2 })),
    fine: groups.filter((g) => g.reaction === 0).length,
    unrated: groups.filter((g) => g.reaction == null).length,
    water: averageWater(days),
    plants: plantsOf(meals.map((m) => m.name)),
    lastMeal: timing.last,
    lateNights,
    hbi: d.hbi.find((h) => h.week === weekKey(start)) ?? null,
  };
}

/** Kıvırcık's one line for the week: the most useful thing to change or keep. */
export function weekTip(cur: WeekStats, prev: WeekStats | null, phase: Phase): string {
  if (cur.blood) return 'Bu hafta kanlı dışkı kaydettin. Doktorunla paylaşmayı erteleme.';
  if (cur.hbi && cur.hbi.score >= 8) return 'Aktivite skorun orta aralıkta. Raporu doktoruna göndermenin tam zamanı.';
  if (cur.watery >= 5 && (cur.water ?? 0) < 8) return 'Sulu dışkı çoktu ama su az kaldı. Önümüzdeki hafta günde en az 8–10 bardak hedefle.';
  if (prev?.toiletPerDay && cur.toiletPerDay && cur.toiletPerDay >= prev.toiletPerDay + 1) return 'Tuvalet sıklığın geçen haftaya göre arttı. Yeni denediğin yemekleri bir hafta ara ver, gidişata bak.';
  if (cur.lateNights >= 3 && cur.lastMeal != null && cur.lastMeal >= 21 * 60) return 'Bu hafta sık sık geç yedin. Son öğünü 20:00 civarına çekmeyi dene, gece rahatlığına bak.';
  if (cur.bothered.length >= 3) return `${cur.bothered.length} öğün dokundu. Örüntüler'de ortak noktalarına bak, bir sonraki haftayı onlarsız dene.`;
  if (cur.unrated >= 5) return `${cur.unrated} öğünün nasıl geçtiği boş kaldı. Cevapladıkça örüntüler netleşiyor.`;
  if (phase === 'remisyon' && cur.plants.length < 12 && cur.sittings >= 8) return `Bu hafta ${cur.plants.length} farklı bitki yedin. Sana uyanlardan 2–3 yenisini eklemek bağırsak florana iyi gelir.`;
  if (prev && cur.painDays < prev.painDays) return 'Ağrılı gün sayın geçen haftadan az. Bu haftaki düzeni koru.';
  return 'Sakin bir hafta. Kayda devam, iyi haftalar da karşılaştırma için değerli.';
}

export { PLANT_GOAL };
