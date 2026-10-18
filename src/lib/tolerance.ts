import type { Meal, Reaction } from './db';
import { medFloor, medHits, medLine, ratingMedLabels, type MedHit } from './med-food';
import {
  FOODS,
  FOOD_BY_ID,
  RARE_FOOD,
  LACTOSE_WEIGHTS,
  STRICTURE_TAGS,
  TAGS,
  findFoodByName,
  isTag,
  normalizeName,
  type Category,
  type Food,
  type Phase,
  type Tag,
  type Verdict,
} from './foods';

export const VERDICT_RANK: Record<Verdict, number> = { iyi: 0, dikkat: 1, riskli: 2 };

export function tagsOf(meal: Pick<Meal, 'tags' | 'food_id'>): Tag[] {
  const fromMeal = meal.tags.split(',').map((t) => t.trim()).filter(isTag);
  if (fromMeal.length) return fromMeal;
  return meal.food_id && FOOD_BY_ID[meal.food_id] ? FOOD_BY_ID[meal.food_id].tags : [];
}

/**
 * Personal factors from Ayarlar. Each one moves the general weights towards what the
 * guidelines say for that situation.
 * - stricture / stoma: insoluble fibre, skins, seeds and nuts keep their flare weight in
 *   remission too (risk of blockage).
 * - lactose intolerance: lactose gets a real weight instead of the small default.
 */
const profile = { stricture: false, stoma: false, lactose: false };

export function setStricture(on: boolean) {
  profile.stricture = on;
}
export function hasStricture() {
  return profile.stricture;
}
export function setStoma(on: boolean) {
  profile.stoma = on;
}
export function hasStoma() {
  return profile.stoma;
}
export function setLactose(on: boolean) {
  profile.lactose = on;
}
export function hasLactose() {
  return profile.lactose;
}

/**
 * The user's own reactions per tag (from rated meals). A tag that keeps causing trouble
 * weighs more on every food that has it, even ones never logged; one the user clearly
 * tolerates stops counting against them.
 */
let tagHistory = new Map<Tag, PersonalStat>();
/** Per food, so a screen without its own copy of the meals rates foods the same way. */
let nameHistory: ReturnType<typeof statsByName> = new Map();
export function setTagHistory(meals: Meal[]) {
  tagHistory = statsByTag(meals);
  nameHistory = statsByName(meals);
}

const TAG_MIN_N = 3;

function tagRate(t: Tag) {
  const s = tagHistory.get(t);
  if (t === 'hafif' || !s || s.n < TAG_MIN_N) return null;
  return { s, rate: (s.mild * 0.5 + s.bad) / s.n };
}

function baseWeight(t: Tag, phase: Phase) {
  const lactose = profile.lactose ? LACTOSE_WEIGHTS[t] : undefined;
  if (lactose) return lactose[phase];
  if ((profile.stricture || profile.stoma) && STRICTURE_TAGS.includes(t)) return TAGS[t].w.atak;
  return TAGS[t].w[phase];
}

function weight(t: Tag, phase: Phase) {
  const w = baseWeight(t, phase);
  const r = tagRate(t);
  if (!r) return w;
  if (r.rate >= 0.5) return w + 1; // a personal trigger
  if (r.rate < 0.2) return Math.min(w, 0); // tolerated well, again and again
  return w;
}

function reasonFor(t: Tag) {
  const r = tagRate(t);
  const label = TAGS[t].label.toLocaleLowerCase('tr-TR');
  if (r && r.rate >= 0.5) return `${TAGS[t].reason}. Kayıtlarında ${label} içeren yemekler ${r.s.n} kayıtta ${r.s.mild + r.s.bad} kez dokundu`;
  if (r && r.rate < 0.2) return `${TAGS[t].label} içeren yemekler ${r.s.n} kayıttır sana dokunmadı`;
  return TAGS[t].reason;
}

/** General verdict from tags and phase, adjusted by personal factors and per-tag history. */
export function generalVerdict(tags: Tag[], phase: Phase): { verdict: Verdict; reasons: string[] } {
  // rounded so 0.3 + 0.6 lands on the 0.9 boundary instead of 0.8999…
  const score = Math.round(tags.reduce((s, t) => s + weight(t, phase), 0) * 100) / 100;
  const verdict: Verdict = score < 0.9 ? 'iyi' : score < 2 ? 'dikkat' : 'riskli';
  const reasons = [...tags].sort((a, b) => weight(b, phase) - weight(a, phase)).map(reasonFor);
  if (!reasons.length) reasons.push('Bilinen bir tetikleyici içermiyor');
  return { verdict, reasons };
}

type Counts = { n: number; good: number; mild: number; bad: number };

export type PersonalStat = Counts & {
  /** 0 … 2: mild counts 1, bad counts 2 */
  avg: number;
  last: number;
  /** the same counts split by the phase the meal was eaten in */
  phases: Record<Phase, Counts>;
  /** the latest reactions, oldest first (at most 8) */
  recent: { r: Reaction; phase: Phase; at: number }[];
};

const counts = (): Counts => ({ n: 0, good: 0, mild: 0, bad: 0 });

function emptyStat(): PersonalStat {
  return { ...counts(), avg: 0, last: 0, phases: { remisyon: counts(), atak: counts() }, recent: [] };
}

function add(c: Counts, r: Reaction) {
  c.n += 1;
  if (r === 0) c.good += 1;
  if (r === 1) c.mild += 1;
  if (r === 2) c.bad += 1;
}

function push(stat: PersonalStat, m: Meal) {
  if (m.reaction == null) return;
  const phase: Phase = m.phase === 'atak' ? 'atak' : 'remisyon';
  add(stat, m.reaction);
  add(stat.phases[phase], m.reaction);
  stat.avg = (stat.mild + stat.bad * 2) / stat.n;
  stat.last = Math.max(stat.last, m.eaten_at);
  stat.recent.push({ r: m.reaction, phase, at: m.eaten_at });
  stat.recent.sort((a, b) => a.at - b.at);
  if (stat.recent.length > 8) stat.recent.shift();
}

export function statsByName(meals: Meal[]): Map<string, PersonalStat & { name: string }> {
  const map = new Map<string, PersonalStat & { name: string }>();
  for (const m of meals) {
    // ids of merged entries resolve to the food they were merged into
    const food = m.food_id ? FOOD_BY_ID[m.food_id] : undefined;
    const key = food?.id ?? m.food_id ?? normalizeName(m.name);
    const s = map.get(key) ?? { ...emptyStat(), name: food?.name ?? m.name };
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

function verdictOf(c: Counts): Verdict | null {
  if (!c.n) return null;
  const avg = (c.mild + c.bad * 2) / c.n;
  return avg < 0.5 ? 'iyi' : avg < 1.3 ? 'dikkat' : 'riskli';
}

/** Over every phase; use assessFood for "what does it mean now". */
export function personalVerdict(stat: PersonalStat | undefined): Verdict | null {
  return stat ? verdictOf(stat) : null;
}

const maxV = (...vs: Verdict[]) => vs.reduce((a, b) => (VERDICT_RANK[b] > VERDICT_RANK[a] ? b : a));
const minV = (a: Verdict, b: Verdict) => (VERDICT_RANK[a] <= VERDICT_RANK[b] ? a : b);
const otherPhase = (p: Phase): Phase => (p === 'atak' ? 'remisyon' : 'atak');
const PHASE_IN: Record<Phase, string> = { remisyon: 'Remisyonda', atak: 'Atakta' };

function outcome(c: Counts) {
  const hits = c.mild + c.bad;
  if (!hits) return c.n === 1 ? 'dokunmadı' : 'hiç dokunmadı';
  if (hits === c.n) return c.n === 1 ? (c.bad ? 'çok dokundu' : 'biraz dokundu') : c.bad === c.n ? 'her seferinde çok dokundu' : 'her seferinde dokundu';
  return `${hits} kez dokundu`;
}

/** "Remisyonda 3 kez yedin, hiç dokunmadı" */
export function phaseSummary(phase: Phase, c: Counts) {
  return `${PHASE_IN[phase]} ${c.n} kez yedin, ${outcome(c)}`;
}

/**
 * What the user's own records say for the phase they're in now. The same phase counts fully; the
 * other one only partly, because the gut is a different gut in a flare: "fine in remission" says
 * little about a flare, and "bothered me during a flare" may have been the flare itself.
 */
function personalFor(stat: PersonalStat, phase: Phase, g: Verdict): { verdict: Verdict; confidence: 'karışık' | 'kişisel'; note: string; advice?: string } {
  const o = otherPhase(phase);
  const S = stat.phases[phase];
  const O = stat.phases[o];
  const vS = verdictOf(S);
  const vO = verdictOf(O);
  const both = [S.n ? phaseSummary(phase, S) : null, O.n ? phaseSummary(o, O) : null].filter(Boolean).join('; ');

  // enough in this very phase: that's the answer
  if (S.n >= 2 && vS) return { verdict: vS, confidence: 'kişisel', note: both };

  if (S.n === 1 && vS) {
    if (vS === 'iyi') {
      // once fine now, and fine in the other phase too
      if (vO === 'iyi' && (phase === 'remisyon' || O.n >= 2)) {
        return { verdict: phase === 'atak' && g === 'riskli' ? 'dikkat' : 'iyi', confidence: 'kişisel', note: both };
      }
      return { verdict: g, confidence: 'karışık', note: both, advice: 'Bir iki kayıt daha olunca sana göre söylerim.' };
    }
    // one bad time in this phase is a warning, not a ban (it may have been something else that day);
    // what the other phase showed can add to it
    let v = maxV(minV(vS, 'dikkat'), g);
    if (vO && vO !== 'iyi') v = maxV(v, phase === 'atak' ? vO : minV(vO, 'dikkat'));
    return { verdict: v, confidence: 'karışık', note: both, advice: O.n ? undefined : 'Tek kayıt. Yine yersen az ye ve nasıl geçtiğini yaz.' };
  }

  // only the other phase
  if (phase === 'atak') {
    if (vO && vO !== 'iyi') return { verdict: maxV(g, vO), confidence: 'karışık', note: both, advice: 'Remisyonda bile dokunduysa atakta daha temkinli ol.' };
    const v = g === 'riskli' && O.n >= 3 ? 'dikkat' : g;
    return { verdict: v, confidence: 'karışık', note: both, advice: v === 'iyi' ? undefined : 'Remisyonda dokunmaması atakta da dokunmayacağı anlamına gelmez; az dene.' };
  }
  if (vO === 'iyi') return O.n >= 2 ? { verdict: 'iyi', confidence: 'kişisel', note: both, advice: 'Atakta bile dokunmadıysa remisyonda rahat olabilirsin.' } : { verdict: g, confidence: 'karışık', note: both };
  return { verdict: maxV(g, 'dikkat'), confidence: 'karışık', note: both, advice: 'Atakta dokunmuş; bu atağın etkisi olabilir. Remisyonda az deneyip nasıl geçtiğini yaz.' };
}

export type FoodAssessment = {
  verdict: Verdict;
  general: Verdict;
  /** what the user's records mean for this phase (null without records) */
  personal: Verdict | null;
  stat?: PersonalStat;
  reasons: string[];
  confidence: 'genel' | 'karışık' | 'kişisel';
  /** what decided the verdict: the general rules, the user's records, or a medicine */
  driver: 'genel' | 'kisisel' | 'ilac';
  /** one line on why, matching the driver (list rows) */
  why: string;
  /** the user's records for this food, per phase ("Remisyonda 3 kez yedin, hiç dokunmadı") */
  personalNote?: string;
  /** what to make of them when the records come from the other phase or are few */
  personalAdvice?: string;
  /** what the user's medicines say about this food (shown apart from the reasons) */
  meds?: MedHit[];
};

/**
 * Medicines come last and only ever make a verdict more careful: on cortisone a sweet that
 * always "went fine" still raises blood sugar. Timing notes ('bilgi') don't touch the verdict.
 */
function withMeds(a: FoodAssessment, food: Food): FoodAssessment {
  const hits = medHits(food);
  if (!hits.length) return a;
  const floor = medFloor(hits);
  const raised = !!floor && VERDICT_RANK[floor] > VERDICT_RANK[a.verdict];
  // the medicine also explains the verdict when it asks for exactly that much care (baklava on cortisone)
  const explains = !!floor && VERDICT_RANK[floor] >= VERDICT_RANK[a.verdict];
  const rated = hits.filter((h) => h.level !== 'bilgi');
  const top = rated.find((h) => (h.level === 'kacin' ? 'riskli' : 'dikkat') === floor);
  return {
    ...a,
    verdict: raised ? floor! : a.verdict,
    reasons: [...rated.map(medLine), ...a.reasons],
    meds: hits,
    driver: explains ? 'ilac' : a.driver,
    why: explains && top ? medLine(top) : a.why,
  };
}

/**
 * The one verdict every screen shows: general rules for the phase, adjusted by personal factors,
 * the user's own records (phase-aware) and the medicines switched on.
 */
export function assessFood(food: Food, phase: Phase, meals?: Meal[], stats?: ReturnType<typeof statsByName>): FoodAssessment {
  const g = generalVerdict(food.tags, phase);
  const map = stats ?? (meals ? statsByName(meals) : nameHistory);
  const stat = map.get(food.id) ?? map.get(normalizeName(food.name));
  const base: FoodAssessment = { verdict: g.verdict, general: g.verdict, personal: null, stat, reasons: g.reasons, confidence: 'genel', driver: 'genel', why: g.reasons[0] };
  // tobacco harms over months, not hours: how one cigarette felt never makes it "iyi"
  if (food.tags.includes('sigara') || !stat?.n) return withMeds(base, food);
  const p = personalFor(stat, phase, g.verdict);
  return withMeds(
    { ...base, verdict: p.verdict, personal: p.verdict, confidence: p.confidence, driver: p.verdict === g.verdict && p.confidence !== 'kişisel' ? 'genel' : 'kisisel', why: p.note, personalNote: p.note, personalAdvice: p.advice },
    food,
  );
}

/** What a verdict was based on, for a one-line "Remisyon · Kortizon · Laktoz" context. */
export function assessContext(phase: Phase) {
  return {
    phase: phase === 'atak' ? 'Atak' : 'Remisyon',
    extras: [profile.stricture ? 'Darlık' : null, profile.stoma ? 'Stoma' : null, profile.lactose ? 'Laktoz' : null, ...ratingMedLabels()].filter((x): x is string => !!x),
  };
}

/** Categories that can stand in for each other ("instead of baklava: fruit"). Alcohol and tobacco never do. */
const NEAR: Partial<Record<Category, Category[]>> = {
  Tatlı: ['Meyve'],
  'Atıştırmalık & çikolata': ['Kuruyemiş & çerez', 'Meyve', 'Tatlı'],
  'Kuruyemiş & çerez': ['Meyve'],
  'Burger, pizza & sokak lezzetleri': ['Et & tavuk', 'Hamur işi & börek', 'Sandviç & tost', 'Dünya mutfağı'],
  'Restoran zincirleri': ['Burger, pizza & sokak lezzetleri', 'Et & tavuk', 'Sandviç & tost'],
  'Kafe & pastane zincirleri': ['İçecekler', 'Tatlı', 'Sandviç & tost'],
  'Sandviç & tost': ['Kahvaltı', 'Ekmek'],
  Kahvaltı: ['Süt ürünleri & peynir', 'Sandviç & tost', 'Ekmek'],
  'Alkollü içecekler': ['İçecekler', 'Paketli içecekler'],
  'Paketli içecekler': ['İçecekler'],
  İçecekler: ['Paketli içecekler'],
  'Salata & mezeler': ['Sebze yemekleri', 'Sade sebze & yeşillik'],
  'Sade sebze & yeşillik': ['Sebze yemekleri'],
  'Sebze yemekleri': ['Sade sebze & yeşillik'],
  Bakliyat: ['Çorba', 'Sebze yemekleri'],
  Ekmek: ['Pilav & tahıl', 'Kahvaltı'],
  'Hamur işi & börek': ['Ekmek', 'Kahvaltı'],
  'Makarna & mantı': ['Pilav & tahıl'],
  'Pilav & tahıl': ['Makarna & mantı'],
  'Et & tavuk': ['Balık & deniz ürünleri'],
  'Balık & deniz ürünleri': ['Et & tavuk'],
  'Süt ürünleri & peynir': ['Kahvaltı'],
  'Dünya mutfağı': ['Et & tavuk', 'Pilav & tahıl'],
  'Beslenme destekleri': ['İçecekler'],
};
const NEVER_SWAP: Category[] = ['Alkollü içecekler', 'Sigara & tütün'];
const DRINK = /🥤|🧃|🧋|☕|🍵|🥛|🍋|⚡|🫧|🍺|🍷|🍸|🍹|🥂|🍶|🧉|🍾|🥃|💧|🫖/u;
const SWEET = /🍰|🍮|🍨|🍦|🍫|🍪|🍩|🧁|🥧|🍯|🍬|🍭|🎂|🧇|🥞|🍧|🍡|🥮/u;
const SWEET_NAME = /künefe|kadayıf|baklava|tatlı|helva|sütlaç|puding|pasta|cheesecake|tiramisu|sufle|dondurma|lokum|kurabiye|cookie/i;
/** A burger is swapped for a dish, a soup for a soup, a cola for a drink, a dessert for something sweet. */
const kindOf = (f: Food) =>
  f.cat === 'Soslar & baharat'
    ? 'sos'
    : DRINK.test(f.emoji)
      ? 'icecek'
      : f.cat === 'Çorba' || f.emoji === '🍲'
        ? 'corba'
        : f.cat === 'Tatlı' || SWEET.test(f.emoji) || SWEET_NAME.test(f.name)
          ? 'tatli'
          : 'yemek';
const words = (name: string) => new Set(normalizeName(name).split(/[^a-zçğıöşü0-9]+/).filter((w) => w.length >= 4));
const CHAINS: Category[] = ['Restoran zincirleri', 'Kafe & pastane zincirleri'];
/** "KFC", "McDonald's": at a chain, the same place's menu comes first. */
const brandOf = (f: Food) => (CHAINS.includes(f.cat) ? normalizeName(f.name).split(' ')[0] : null);

/**
 * "Bunun yerine": foods that come out 'iyi' with the very same assessment as the food page
 * (phase, factors, records, medicines), closest first: ones the user already eats without
 * trouble, then the same main ingredient or way of cooking, then similar contents.
 */
export function alternativesFor(food: Food, phase: Phase, limit = 4, stats?: ReturnType<typeof statsByName>) {
  if (food.tags.includes('sigara')) return [];
  const cats = [food.cat, ...(NEAR[food.cat] ?? [])].filter((c) => !NEVER_SWAP.includes(c));
  const mine = words(food.name);
  const tags = new Set(food.tags);
  const kind = kindOf(food);
  const brand = brandOf(food);
  const scored: { food: Food; a: FoodAssessment; score: number }[] = [];
  for (const f of FOODS) {
    if (f.id === food.id || !cats.includes(f.cat)) continue;
    // fruit stands in for a dessert; otherwise only the same kind of thing
    const k = kindOf(f);
    if (k !== kind && !(kind === 'tatli' && f.cat === 'Meyve')) continue;
    const a = assessFood(f, phase, undefined, stats);
    if (a.verdict !== 'iyi') continue;
    const shared = [...words(f.name)].filter((w) => mine.has(w)).length;
    const union = new Set([...tags, ...f.tags]).size || 1;
    const jaccard = f.tags.filter((t) => tags.has(t)).length / union;
    const score = (a.confidence === 'kişisel' ? 50 : 0) + (brand && brandOf(f) === brand ? 10 : 0) + shared * 8 + jaccard * 4 + (f.cat === food.cat ? 6 : 0) + (f.emoji === food.emoji ? 4 : 0) + (f.tags.includes('hafif') ? 2 : 0) - (RARE_FOOD.test(f.name) ? 6 : 0);
    scored.push({ food: f, a, score });
  }
  return scored.sort((x, y) => y.score - x.score || x.food.name.length - y.food.name.length).slice(0, limit);
}

export type TriggerInsight = { tag: Tag; stat: PersonalStat; rate: number };

/** Tags that the user reacted badly to. Needs 3 rated meals with that tag, like the weights that use it. */
export function triggerInsights(meals: Meal[]): { triggers: TriggerInsight[]; safe: TriggerInsight[] } {
  const all: TriggerInsight[] = [];
  statsByTag(meals).forEach((stat, tag) => {
    if (stat.n < TAG_MIN_N || tag === 'hafif') return;
    all.push({ tag, stat, rate: (stat.mild * 0.5 + stat.bad) / stat.n });
  });
  return {
    triggers: all.filter((x) => x.rate >= 0.5).sort((a, b) => b.rate - a.rate || b.stat.n - a.stat.n),
    safe: all.filter((x) => x.rate < 0.2).sort((a, b) => b.stat.n - a.stat.n),
  };
}

export type FoodPattern = {
  key: string;
  name: string;
  foodId: string | null;
  n: number;
  hits: number;
  bad: number;
  /** latest reactions, oldest first */
  recent: Reaction[];
  /** why it sits in this group when that's not obvious ("sadece atakta dokundu") */
  note: string | null;
  group: 'dokunan' | 'bazen' | 'dokunmayan';
};

/**
 * Foods sorted into "Dokunanlar / Bazen dokunanlar / Dokunmayanlar" from the user's ratings.
 * - Dokunanlar: bothered at least half the time, or the one time it was eaten.
 * - Dokunmayanlar: eaten at least twice without trouble (one mild time in 5+ is noise).
 * - Bazen dokunanlar: the rest with any trouble.
 * Two refinements: trouble only during a flare while it went fine in remission points at the
 * flare, not the food; and the last two times count extra, because the gut changes.
 * A single "normal" isn't shown: once proves little.
 */
export function foodPatterns(meals: Meal[]) {
  const all: (FoodPattern & { sev: number; share: number; last: number })[] = [];
  for (const [key, s] of statsByName(meals)) {
    const hits = s.mild + s.bad;
    const share = hits / s.n;
    const rem = s.phases.remisyon;
    let group: FoodPattern['group'] | null = null;
    let note: string | null = null;
    if (s.n === 1) {
      if (hits) {
        group = 'dokunan';
        note = s.phases.atak.n ? 'tek kayıt, atakta' : 'tek kayıt';
      }
    } else if (!hits) group = 'dokunmayan';
    else if (share >= 0.5) group = 'dokunan';
    else if (s.n >= 5 && share <= 0.2 && !s.bad) {
      group = 'dokunmayan';
      note = 'bir kez hafif dokundu';
    } else group = 'bazen';
    if (!group) continue;

    const flareOnly = hits > 0 && rem.n > 0 && rem.mild + rem.bad === 0;
    const last2 = s.recent.slice(-2).map((x) => x.r);
    if (group === 'dokunan' && s.n >= 2 && flareOnly) {
      group = 'bazen';
      note = 'sadece atakta dokundu';
    } else if (group === 'bazen' && flareOnly) note = 'sadece atakta dokundu';
    if (s.n >= 3 && last2.length === 2) {
      if (group === 'dokunan' && last2.every((r) => r === 0)) {
        group = 'bazen';
        note = 'son 2 kez sorun çıkmadı';
      } else if (group === 'bazen' && last2.every((r) => r > 0)) {
        group = 'dokunan';
        note = 'son 2 kez dokundu';
      }
    }
    const food = FOOD_BY_ID[key] ?? findFoodByName(s.name);
    all.push({ key, name: s.name, foodId: food?.id ?? null, n: s.n, hits, bad: s.bad, recent: s.recent.map((x) => x.r), note, group, sev: (s.mild * 0.5 + s.bad) / s.n, share, last: s.last });
  }
  const pick = (g: FoodPattern['group']) => all.filter((x) => x.group === g);
  return {
    dokunan: pick('dokunan').sort((a, b) => Number(b.n >= 2) - Number(a.n >= 2) || b.sev - a.sev || b.n - a.n),
    bazen: pick('bazen').sort((a, b) => b.share - a.share || b.n - a.n),
    dokunmayan: pick('dokunmayan').sort((a, b) => b.n - a.n || b.last - a.last),
  };
}

/** Compact summary sent to the AI so it can personalise. */
export function historyForAI(meals: Meal[]) {
  const p = foodPatterns(meals);
  const fmt = (x: FoodPattern) => `${x.name} (${x.n} kayıtta ${x.hits} kez dokundu${x.note ? `, ${x.note}` : ''})`;
  const { triggers } = triggerInsights(meals);
  return {
    dokunanlar: p.dokunan.slice(0, 25).map(fmt),
    bazen_dokunanlar: p.bazen.slice(0, 25).map(fmt),
    dokunmayanlar: p.dokunmayan.slice(0, 30).map((x) => `${x.name} (${x.n}x)`),
    olasi_tetikleyiciler: triggers.map((t) => `${TAGS[t.tag].label} (${t.stat.n} kayıtta ${t.stat.mild + t.stat.bad} kez dokundu)`),
  };
}
