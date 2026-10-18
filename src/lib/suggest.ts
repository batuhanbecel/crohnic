import type { Meal } from './db';
import { FOODS, RARE_FOOD, type Food, type Phase } from './foods';
import { assessFood, statsByName } from './tolerance';

/**
 * "Bugün ne yesem?": a varied plan for the day, built only from foods that come out
 * 'iyi' for the current phase after every personal adjustment (stricture, stoma, lactose,
 * per-tag history, the user's own ratings). Never a diet prescription, just ideas.
 *
 * Variety rules:
 * - the plan is seeded by the date, so it changes every day but stays put while the day lasts;
 *   "Başka öner" re-rolls one meal
 * - foods suggested yesterday or eaten in the last two days are pushed back
 * - within a day no food repeats and the same base (tavuk, patates, pirinç…) is avoided twice
 * - foods the user has rated well get a boost; foods that bothered them never show up
 */

export type SlotKey = 'kahvalti' | 'ogle' | 'ara' | 'aksam';

export type Suggestion = { food: Food; role: string; personal: boolean };
export type SlotPlan = { key: SlotKey; title: string; items: Suggestion[] };

type Part = {
  role: string;
  cats: string[];
  /** extra filters on the food */
  only?: RegExp;
  not?: RegExp;
  ok?: (f: Food) => boolean;
  /** skip this part when an earlier pick in the same meal already covers it */
  skipAfter?: RegExp;
};

type SlotDef = { key: SlotKey; title: string; parts: Part[] };

const SPREADS = /zeytin|tereyağı|^bal$|reçel|pekmez|ezmesi/i;
/** Plain snacks from the snack shelf; branded chocolate bars and crisps aren't suggested. */
const GENERIC_SNACK = /^(kraker|bisküvi|pirinç patlağı|galeta|granola bar|kuru meyve bar|enerji topu|protein bar|patlamış mısır)/i;
const BREAD_INSIDE = /tost|sandviç|simit|ekmek|yulaf|oats|müsli|chia|pankek|krep|kayganak|puding|pide|gözleme/i;

const SLOTS: SlotDef[] = [
  {
    key: 'kahvalti',
    title: 'Kahvaltı',
    parts: [
      { role: 'Ana', cats: ['Kahvaltı', 'Sandviç & tost'], not: SPREADS },
      { role: 'Yanına', cats: ['Süt ürünleri & peynir', 'Kahvaltı'], ok: (f) => (f.cat === 'Kahvaltı' ? SPREADS.test(f.name) : !/süt$|kefir/i.test(f.name)) },
      { role: 'Ekmek', cats: ['Ekmek'], not: /hamburger|galeta|grissini|bagel|tortilla/i, skipAfter: BREAD_INSIDE },
      { role: 'İçecek', cats: ['İçecekler'], only: /çay|ıhlamur|adaçayı|kafeinsiz kahve|süt$|sütü|ballı süt|tarçınlı süt|portakal suyu|smoothie/i, not: /soya|badem/i },
    ],
  },
  {
    key: 'ogle',
    title: 'Öğle',
    parts: [
      { role: 'Çorba', cats: ['Çorba'] },
      {
        role: 'Ana yemek',
        cats: ['Sebze yemekleri', 'Makarna & mantı', 'Bakliyat', 'Hamur işi & börek', 'Burger, pizza & sokak lezzetleri', 'Sandviç & tost', 'Dünya mutfağı'],
        not: /püresi|^naan$|focaccia|^simit$|tempeh|soya kıyması|maş/i,
      },
      { role: 'Yanına', cats: ['Salata & mezeler', 'Süt ürünleri & peynir', 'Sade sebze & yeşillik', 'İçecekler'], only: /salata|yoğurt|cacık|ayran|kefir|ezme|haşlanmış sebze|tabule|caprese/i, not: /turşu/i },
    ],
  },
  {
    key: 'ara',
    title: 'Ara öğün',
    parts: [
      { role: 'Meyve', cats: ['Meyve'], not: /^limon$|greyfurt|pomelo|bebek/i },
      { role: 'Atıştırmalık', cats: ['Kuruyemiş & çerez', 'Atıştırmalık & çikolata', 'Tatlı', 'Süt ürünleri & peynir', 'Hamur işi & börek'], ok: (f) => f.cat !== 'Atıştırmalık & çikolata' || GENERIC_SNACK.test(f.name), not: /peynir|kaşar|^lor|çökelek|mozzarella|feta|parmesan|gravyer|cheddar|tohumu|susam|börek|pide|gözleme|^süt$/i },
    ],
  },
  {
    key: 'aksam',
    title: 'Akşam',
    parts: [
      { role: 'Ana yemek', cats: ['Et & tavuk', 'Balık & deniz ürünleri'] },
      {
        role: 'Yanına',
        cats: ['Pilav & tahıl', 'Makarna & mantı', 'Sebze yemekleri', 'Sade sebze & yeşillik'],
        only: /pilav|pirinç|kuskus|bulgur|şehriye|makarna|erişte|püre|patates|zeytinyağlı|fırın|sote|graten|buharda|közlenmiş|haşlanmış|ızgara sebze|kinoa|karabuğday/i,
        not: /etli|kıymalı|dolması|sarma|musakka|oturtma|köfte/i,
      },
      { role: 'Salata / yoğurt', cats: ['Salata & mezeler', 'Süt ürünleri & peynir'], only: /salata|yoğurt|cacık|kefir|ezme|haşlanmış sebze|tabule|caprese|semizotu|börülce/i, not: /turşu|ton balıklı|tavuklu|somon/i },
    ],
  },
];

/** Fine to eat, just not something to suggest on an ordinary day. */
const RARE = RARE_FOOD;
/** Grapefruit and pomelo change how budesonide and some other drugs are absorbed: never suggested. */
const NEVER = /greyfurt|pomelo|^su$|limonlu su|ors \(|alkolsüz/i;

/** Bases that shouldn't come twice in one day ("tavuk suyu çorba" + "ızgara tavuk"). */
const BASES: string[][] = [
  ['tavuk'],
  ['hindi'],
  ['köfte'],
  ['et', 'etli', 'dana', 'kuzu', 'biftek', 'bonfile', 'antrikot', 'rosto', 'kebap', 'kebabı'],
  ['balık', 'balıklı', 'somon', 'levrek', 'çipura', 'alabalık', 'mezgit', 'hamsi', 'ton', 'karides'],
  ['yumurta', 'yumurtalı', 'omlet', 'menemen', 'çılbır', 'rafadan', 'poşe'],
  ['patates', 'patatesli'],
  ['kabak', 'kabaklı'],
  ['havuç', 'havuçlu'],
  ['ıspanak', 'ıspanaklı'],
  ['mercimek'],
  ['nohut'],
  ['fasulye'],
  ['makarna', 'erişte', 'şehriye', 'şehriyeli', 'noodle', 'mantı'],
  ['pirinç', 'pilav', 'pilavı', 'pilavlı', 'pilaki', 'sütlaç', 'muhallebisi'],
  ['yoğurt', 'yoğurtlu', 'yoğurdu', 'cacık', 'ayran', 'kefir'],
  ['muz', 'muzlu'],
  ['elma', 'elmalı'],
  ['yulaf', 'yulaflı'],
];

function basesOf(name: string): number[] {
  const words = name.toLocaleLowerCase('tr-TR').split(/[^a-zçğıöşü]+/).filter(Boolean);
  const out: number[] = [];
  BASES.forEach((group, i) => {
    if (words.some((w) => group.includes(w))) out.push(i);
  });
  return out;
}

// ---------- seeded randomness ----------

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick<T>(items: { x: T; w: number }[], rand: () => number): T | null {
  const total = items.reduce((s, i) => s + i.w, 0);
  if (total <= 0) return null;
  let r = rand() * total;
  for (const i of items) {
    r -= i.w;
    if (r <= 0) return i.x;
  }
  return items[items.length - 1].x;
}

// ---------- plan ----------

export type PlanInput = {
  /** YYYY-MM-DD of the day being planned */
  day: string;
  phase: Phase;
  /** rated meals: personal verdicts come from these */
  rated: Meal[];
  /** meal names (canonical food ids) eaten in the last couple of days */
  recent: Set<string>;
  /** "Başka öner" counters per meal */
  rolls?: Partial<Record<SlotKey, number>>;
  /** foods suggested the day before (pushed back) */
  yesterday?: Set<string>;
};

type Candidate = { food: Food; personal: boolean };

/** Foods that are 'iyi' for this phase and this person, grouped by category. */
function candidates(phase: Phase, rated: Meal[]) {
  const stats = statsByName(rated);
  const byCat = new Map<string, Candidate[]>();
  for (const f of FOODS) {
    if (NEVER.test(f.name)) continue;
    const a = assessFood(f, phase, rated, stats);
    if (a.verdict !== 'iyi') continue;
    // tolerated in this very phase (or even in a flare), not just "fine once in remission"
    const personal = a.confidence === 'kişisel' && a.personal === 'iyi';
    byCat.set(f.cat, [...(byCat.get(f.cat) ?? []), { food: f, personal }]);
  }
  return byCat;
}

function planWith(pool: Map<string, Candidate[]>, input: PlanInput): SlotPlan[] {
  const usedIds = new Set<string>();
  const usedBases = new Set<number>();
  return SLOTS.map((slot) => {
    const rand = rng(`${input.day}|${input.phase}|${slot.key}|${input.rolls?.[slot.key] ?? 0}`);
    const items: Suggestion[] = [];
    for (const part of slot.parts) {
      if (part.skipAfter && items.some((i) => part.skipAfter!.test(i.food.name))) continue;
      const options: { x: Candidate; w: number }[] = [];
      for (const cat of part.cats) {
        for (const c of pool.get(cat) ?? []) {
          const name = c.food.name;
          if (usedIds.has(c.food.id)) continue;
          if (part.only && !part.only.test(name)) continue;
          if (part.not && part.not.test(name)) continue;
          if (part.ok && !part.ok(c.food)) continue;
          let w = 1;
          if (c.personal) w *= 2.5;
          if (RARE.test(name)) w *= 0.25;
          if (input.recent.has(c.food.id)) w *= 0.3;
          if (input.yesterday?.has(c.food.id)) w *= 0.2;
          if (basesOf(name).some((b) => usedBases.has(b))) w *= 0.05;
          options.push({ x: c, w });
        }
      }
      const pick = weightedPick(options, rand);
      if (!pick) continue;
      usedIds.add(pick.food.id);
      basesOf(pick.food.name).forEach((b) => usedBases.add(b));
      items.push({ food: pick.food, role: part.role, personal: pick.personal });
    }
    return { key: slot.key, title: slot.title, items };
  });
}

/** The day's plan. Pure: the same inputs give the same plan. */
export function planDay(input: PlanInput): SlotPlan[] {
  const pool = candidates(input.phase, input.rated);
  // yesterday's plan (as it would have looked) so today doesn't repeat it
  const prev = new Date(dayStart(input.day) - 12 * 3600000); // noon of the day before, DST-safe
  const prevDay = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
  const yesterday = new Set(planWith(pool, { ...input, day: prevDay, rolls: {}, yesterday: undefined }).flatMap((s) => s.items.map((i) => i.food.id)));
  return planWith(pool, { ...input, yesterday });
}

function dayStart(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getTime();
}

/** Which meal is next at this hour. */
export function slotForHour(h: number): SlotKey {
  if (h < 11) return 'kahvalti';
  if (h < 15) return 'ogle';
  if (h < 18) return 'ara';
  return 'aksam';
}

export const PHASE_NOTE: Record<Phase, string> = {
  atak: 'Atak dönemine göre: yumuşak pişmiş, az lifli, az yağlı ve az baharatlı seçtim. Küçük porsiyonlar, sık öğün ve bol sıvı iyi gelir.',
  remisyon: 'Remisyon dönemine göre: çeşit önemli. Sebze, meyve, balık ve tahılı dönüşümlü öneriyorum, işlenmiş gıdadan uzak durdum.',
};
