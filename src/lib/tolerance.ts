import type { Meal } from './db';
import { FOOD_BY_ID, STRICTURE_TAGS, TAGS, isTag, normalizeName, type Food, type Phase, type Tag, type Verdict } from './foods';

export const VERDICT_RANK: Record<Verdict, number> = { iyi: 0, dikkat: 1, riskli: 2 };

export function tagsOf(meal: Pick<Meal, 'tags' | 'food_id'>): Tag[] {
  const fromMeal = meal.tags.split(',').map((t) => t.trim()).filter(isTag);
  if (fromMeal.length) return fromMeal;
  return meal.food_id && FOOD_BY_ID[meal.food_id] ? FOOD_BY_ID[meal.food_id].tags : [];
}

let stricture = false;
/** Set from Ayarlar: with a stricture, fibre-type tags keep their flare weight in remission too. */
export function setStricture(on: boolean) {
  stricture = on;
}
export function hasStricture() {
  return stricture;
}

function weight(t: Tag, phase: Phase) {
  return stricture && STRICTURE_TAGS.includes(t) ? TAGS[t].w.atak : TAGS[t].w[phase];
}

/** General (non-personal) verdict from tags and current phase. */
export function generalVerdict(tags: Tag[], phase: Phase): { verdict: Verdict; reasons: string[] } {
  const score = tags.reduce((s, t) => s + weight(t, phase), 0);
  const verdict: Verdict = score < 0.9 ? 'iyi' : score < 2 ? 'dikkat' : 'riskli';
  const reasons = [...tags]
    .sort((a, b) => weight(b, phase) - weight(a, phase))
    .map((t) => TAGS[t].reason);
  if (!reasons.length) reasons.push('Bilinen bir tetikleyici içermiyor');
  return { verdict, reasons };
}

export type PersonalStat = { n: number; good: number; mild: number; bad: number; avg: number; last: number };

function emptyStat(): PersonalStat {
  return { n: 0, good: 0, mild: 0, bad: 0, avg: 0, last: 0 };
}

function push(stat: PersonalStat, m: Meal) {
  if (m.reaction == null) return;
  stat.n += 1;
  if (m.reaction === 0) stat.good += 1;
  if (m.reaction === 1) stat.mild += 1;
  if (m.reaction === 2) stat.bad += 1;
  stat.avg = (stat.mild + stat.bad * 2) / stat.n;
  stat.last = Math.max(stat.last, m.eaten_at);
}

export function statsByName(meals: Meal[]): Map<string, PersonalStat & { name: string }> {
  const map = new Map<string, PersonalStat & { name: string }>();
  for (const m of meals) {
    const key = m.food_id ?? normalizeName(m.name);
    const s = map.get(key) ?? { ...emptyStat(), name: m.food_id ? FOOD_BY_ID[m.food_id]?.name ?? m.name : m.name };
    push(s, m);
    map.set(key, s);
  }
  return map;
}

export function statsByTag(meals: Meal[]): Map<Tag, PersonalStat> {
  const map = new Map<Tag, PersonalStat>();
  for (const m of meals) {
    for (const t of tagsOf(m)) {
      const s = map.get(t) ?? emptyStat();
      push(s, m);
      map.set(t, s);
    }
  }
  return map;
}

export function personalVerdict(stat: PersonalStat | undefined): Verdict | null {
  if (!stat || stat.n === 0) return null;
  return stat.avg < 0.5 ? 'iyi' : stat.avg < 1.3 ? 'dikkat' : 'riskli';
}

export type FoodAssessment = {
  verdict: Verdict;
  general: Verdict;
  personal: Verdict | null;
  stat?: PersonalStat;
  reasons: string[];
  confidence: 'genel' | 'karışık' | 'kişisel';
};

/** Combine general knowledge with the user's own history. Personal data wins once there's enough of it. */
export function assessFood(food: Food, phase: Phase, meals: Meal[], stats?: ReturnType<typeof statsByName>): FoodAssessment {
  const g = generalVerdict(food.tags, phase);
  const map = stats ?? statsByName(meals);
  const stat = map.get(food.id) ?? map.get(normalizeName(food.name));
  const p = personalVerdict(stat);

  let verdict = g.verdict;
  let confidence: FoodAssessment['confidence'] = 'genel';
  if (p && stat) {
    if (stat.n >= 2) {
      verdict = p;
      confidence = 'kişisel';
    } else {
      // one data point: lean towards the more careful option
      verdict = VERDICT_RANK[p] >= VERDICT_RANK[g.verdict] ? p : g.verdict;
      confidence = 'karışık';
    }
    // a flare makes everything a notch more sensitive
    if (phase === 'atak' && verdict === 'iyi' && g.verdict !== 'iyi') verdict = 'dikkat';
  }
  return { verdict, general: g.verdict, personal: p, stat, reasons: g.reasons, confidence };
}

export type TriggerInsight = { tag: Tag; stat: PersonalStat; rate: number };

/** Tags that the user reacted badly to. Needs at least 2 rated meals with that tag. */
export function triggerInsights(meals: Meal[]): { triggers: TriggerInsight[]; safe: TriggerInsight[] } {
  const all: TriggerInsight[] = [];
  statsByTag(meals).forEach((stat, tag) => {
    if (stat.n < 2 || tag === 'hafif') return;
    all.push({ tag, stat, rate: (stat.mild * 0.5 + stat.bad) / stat.n });
  });
  return {
    triggers: all.filter((x) => x.rate >= 0.5).sort((a, b) => b.rate - a.rate || b.stat.n - a.stat.n),
    safe: all.filter((x) => x.rate < 0.2).sort((a, b) => b.stat.n - a.stat.n),
  };
}

/** Compact summary sent to the AI so it can personalise. */
export function historyForAI(meals: Meal[]) {
  const byName = [...statsByName(meals).values()].sort((a, b) => b.last - a.last).slice(0, 60);
  const verdictOf = (s: PersonalStat) => personalVerdict(s);
  const { triggers } = triggerInsights(meals);
  return {
    iyi_gelenler: byName.filter((s) => verdictOf(s) === 'iyi').map((s) => `${s.name} (${s.n}x)`),
    biraz_dokunanlar: byName.filter((s) => verdictOf(s) === 'dikkat').map((s) => `${s.name} (${s.n}x)`),
    dokunanlar: byName.filter((s) => verdictOf(s) === 'riskli').map((s) => `${s.name} (${s.n}x)`),
    olasi_tetikleyiciler: triggers.map((t) => `${TAGS[t.tag].label} (${t.stat.n} kayıtta ${t.stat.mild + t.stat.bad} kez dokundu)`),
  };
}
