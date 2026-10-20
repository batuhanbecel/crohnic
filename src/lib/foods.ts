import { ALIAS_SOURCE, FOOD_SOURCE } from './food-data';

export type Phase = 'remisyon' | 'atak';
export type Verdict = 'iyi' | 'dikkat' | 'riskli';

export type Tag =
  | 'hafif'
  | 'pure'
  | 'lif'
  | 'cig'
  | 'kabuk'
  | 'kuruyemis'
  | 'cekirdek'
  | 'baklagil'
  | 'baklagil_az'
  | 'lahana'
  | 'yag'
  | 'yag_hafif'
  | 'aci'
  | 'aci_hafif'
  | 'asit'
  | 'sut'
  | 'sut_az'
  | 'fermente'
  | 'kafein'
  | 'kafein_hafif'
  | 'alkol'
  | 'gazli'
  | 'seker'
  | 'islenmis'
  | 'tatlandirici'
  | 'katki'
  | 'cig_hayvansal'
  | 'sigara';

/**
 * Weights per phase. Negative = gentle on the gut. A food's score is the sum of its tags:
 * under 0.9 → iyi, under 2 → dikkat, otherwise riskli (see tolerance.ts).
 *
 * Sources and how they map:
 * - IOIBD dietary guidance (Levine et al., Clin Gastroenterol Hepatol 2020) and ESPEN IBD
 *   guideline (2023): no single diet for Crohn's; reduce saturated/trans fat, processed meat
 *   and emulsifier-rich ultra-processed food; restrict insoluble fibre only in symptomatic
 *   stricturing disease; no consensus to restrict dairy; insufficient evidence on sugar;
 *   avoid unpasteurised/raw animal food (infection risk on immunosuppressants).
 * - Flare: short-term low-residue practice (less insoluble fibre, skins, seeds, fat, spice).
 * - Things without Crohn's-specific evidence (acidity, sugar, lactose without intolerance)
 *   carry small weights; personal factors (stricture, stoma, lactose intolerance) and the
 *   user's own reactions adjust weights in tolerance.ts.
 */
export const TAGS: Record<Tag, { label: string; reason: string; w: Record<Phase, number> }> = {
  hafif: { label: 'Hafif', reason: 'Sade pişmiş, mideyi yormaz', w: { remisyon: -1, atak: -1 } },
  pure: { label: 'Püre', reason: 'Püre kıvamında, lifi yumuşamış', w: { remisyon: 0, atak: 0.2 } },
  lif: { label: 'Bol lif', reason: 'Çözünmeyen lifi yüksek', w: { remisyon: 0.3, atak: 2 } },
  cig: { label: 'Çiğ sebze', reason: 'Çiğ sebze bağırsağı daha çok çalıştırır', w: { remisyon: 0.4, atak: 2 } },
  kabuk: { label: 'Kabuk', reason: 'Kabuk ve zar zor sindirilir', w: { remisyon: 0.5, atak: 2 } },
  kuruyemis: { label: 'Kuruyemiş', reason: 'Kuruyemiş ve tohum sert, lifli', w: { remisyon: 0.4, atak: 2 } },
  cekirdek: { label: 'Çekirdek', reason: 'Küçük çekirdekleri var', w: { remisyon: 0.2, atak: 1.5 } },
  baklagil: { label: 'Baklagil', reason: 'Baklagiller gaz ve şişkinlik yapabilir', w: { remisyon: 0.6, atak: 2 } },
  baklagil_az: { label: 'Süzülmüş baklagil', reason: 'Kabuksuz ya da süzülmüş baklagil, yine de biraz gaz yapabilir', w: { remisyon: 0.1, atak: 0.9 } },
  lahana: { label: 'Gaz yapar', reason: 'Lahanagiller, soğan ve sarımsak gaz yapabilir', w: { remisyon: 0.7, atak: 1.5 } },
  yag: { label: 'Yağlı', reason: 'Yağlı ya da kızartma, ishali tetikleyebilir', w: { remisyon: 0.9, atak: 1.8 } },
  yag_hafif: { label: 'Biraz yağlı', reason: 'Bir miktar yağ var', w: { remisyon: 0.3, atak: 0.9 } },
  aci: { label: 'Acı', reason: 'Acı ve yoğun baharat bağırsağı tahriş edebilir', w: { remisyon: 1, atak: 2 } },
  aci_hafif: { label: 'Az baharatlı', reason: 'Hafif baharatlı', w: { remisyon: 0.3, atak: 0.9 } },
  asit: { label: 'Asitli', reason: 'Domates, sirke ve narenciye asidi bazılarına dokunur', w: { remisyon: 0.1, atak: 0.5 } },
  sut: { label: 'Laktoz', reason: 'Laktoz içeriyor, laktoz intoleransı olanlarda ishal ve gaz yapar', w: { remisyon: 0.4, atak: 1 } },
  sut_az: { label: 'Az laktoz', reason: 'Laktozu düşük bir süt ürünü', w: { remisyon: 0.1, atak: 0.4 } },
  fermente: { label: 'Fermente', reason: 'Yoğurt ve kefir çoğu kişide iyi tolere edilir', w: { remisyon: 0.2, atak: 0.8 } },
  kafein: { label: 'Kafein', reason: 'Kafein bağırsağı hızlandırır', w: { remisyon: 0.9, atak: 1.5 } },
  kafein_hafif: { label: 'Az kafein', reason: 'Biraz kafein var', w: { remisyon: 0.1, atak: 0.6 } },
  alkol: { label: 'Alkol', reason: 'Alkol bağırsak zarını tahriş eder', w: { remisyon: 1.5, atak: 2.5 } },
  gazli: { label: 'Gazlı', reason: 'Gazlı içecekler şişkinlik yapar', w: { remisyon: 0.9, atak: 1.5 } },
  seker: { label: 'Şekerli', reason: 'Yoğun şeker ishali artırabilir', w: { remisyon: 0.3, atak: 0.7 } },
  islenmis: { label: 'İşlenmiş et', reason: 'İşlenmiş et yağlı ve katkılı', w: { remisyon: 0.9, atak: 1.6 } },
  tatlandirici: { label: 'Tatlandırıcı', reason: 'Sorbitol gibi tatlandırıcılar gaz ve ishal yapabilir', w: { remisyon: 0.9, atak: 1.5 } },
  katki: { label: 'Katkılı', reason: 'Çok işlenmiş, katkılı ürünler Crohn ile ilişkilendiriliyor', w: { remisyon: 0.6, atak: 0.9 } },
  cig_hayvansal: { label: 'Çiğ / az pişmiş', reason: 'Çiğ ya da az pişmiş hayvansal gıda, bağışıklığı baskılayan ilaç kullananlarda enfeksiyon riski taşır', w: { remisyon: 0.9, atak: 1.5 } },
  sigara: {
    label: 'Tütün',
    reason: "Sigara Crohn'u en çok kötüleştiren çevresel etken: atak, ilaç ihtiyacı ve ameliyat riskini artırır. Bırakmak da en etkili tedavilerden biri sayılıyor",
    w: { remisyon: 2.5, atak: 3 },
  },
};

/** With lactose intolerance (set in Ayarlar) lactose carries real weight. */
export const LACTOSE_WEIGHTS: Partial<Record<Tag, Record<Phase, number>>> = {
  sut: { remisyon: 2, atak: 2.5 },
  sut_az: { remisyon: 0.5, atak: 0.9 },
};

/** Tags that stay risky in remission when the user has a stricture (narrowing). */
export const STRICTURE_TAGS: Tag[] = ['lif', 'cig', 'kabuk', 'kuruyemis', 'cekirdek', 'baklagil'];

export const ALL_TAGS = Object.keys(TAGS) as Tag[];

export function isTag(t: string): t is Tag {
  return t in TAGS;
}

export type Category = string;

export type Food = {
  id: string;
  name: string;
  emoji: string;
  cat: Category;
  tags: Tag[];
};

const TR_MAP: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };

export function slug(s: string) {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîû]/g, (c) => TR_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parse(source: string) {
  const foods: Food[] = [];
  const cats: string[] = [];
  const seen = new Set<string>();
  let cat = 'Diğer';
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      cat = line.slice(1).trim();
      cats.push(cat);
      continue;
    }
    const [name, emoji, tagStr = ''] = line.split('|').map((x) => x.trim());
    let id = slug(name);
    while (seen.has(id)) id += '-2';
    seen.add(id);
    foods.push({ id, name, emoji, cat, tags: tagStr.split(/\s+/).filter(isTag) });
  }
  return { foods, cats };
}

const parsed = parse(FOOD_SOURCE);

export const FOODS: Food[] = parsed.foods;
export const CATEGORIES: Category[] = parsed.cats;

/** Foods most people rarely eat: suggestions and "instead" lists push them back. */
export const RARE_FOOD = /ıstakoz|yengeç|beyin|böbrek|ciğer|sushi|bulgogi|dim sum|yakitori|udon|onigiri|liçi|papaya|rambutan|ejder meyvesi|pitaya|longan|mangostan|yıldız meyvesi|guava|marakuya|kumkuat|kuru kızılcık|spor içeceği|ors|boza|salep|şerbet|cezerye|cevizli sucuk|kestane kebap/i;

export function normalizeName(s: string): string {
  return s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

const BY_SLUG = new Map(FOODS.map((x) => [x.id, x]));

/** Old or short names → the food they mean (merged duplicates, synonyms like "Nutella"). */
const ALIASES: [string, Food][] = ALIAS_SOURCE.split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .flatMap((l) => {
    const [from, to] = l.split('|').map((x) => x.trim());
    const food = BY_SLUG.get(slug(to));
    return food ? [[from, food] as [string, Food]] : [];
  });

const ALIAS_SLUGS = new Map<string, string[]>();
for (const [from, food] of ALIASES) ALIAS_SLUGS.set(food.id, [...(ALIAS_SLUGS.get(food.id) ?? []), slug(from)]);

/** Food by id, including ids of entries that were merged into another one. */
export const FOOD_BY_ID: Record<string, Food> = {
  ...Object.fromEntries(ALIASES.map(([from, food]) => [slug(from), food])),
  ...Object.fromEntries(FOODS.map((x) => [x.id, x])),
};

const BY_NAME = new Map<string, Food>([...ALIASES.map(([from, food]) => [normalizeName(from), food] as [string, Food]), ...FOODS.map((x) => [normalizeName(x.name), x] as [string, Food])]);

/**
 * One word without its Turkish case or possessive ending, consonants hardened back:
 * "fırında" → firin, "çorbası" → corba, "kebabı" → kebap, "tavuklu" → tavuk. Applied the same
 * way to the query and the names, so only the comparison has to agree, not the dictionary.
 */
const ENDINGS: [RegExp, number][] = [
  [/(dan|den|tan|ten)$/, 4],
  [/(lari|leri)$/, 4],
  [/(lar|ler)$/, 4],
  [/(da|de|ta|te)$/, 5], // locative; 5 keeps "salata" and "pasta" whole
  [/(si|su)$/, 3],
  [/(li|lu)$/, 4],
  [/(i|u)$/, 3],
];
function stem(word: string) {
  let w = word;
  for (const [re, min] of ENDINGS) {
    const m = w.match(re);
    if (m && w.length - m[0].length >= min) {
      w = w.slice(0, -m[0].length);
      break;
    }
  }
  return w.replace(/b$/, 'p').replace(/g$/, 'k').replace(/d$/, 't');
}

/** Order-free, ending-free form of a name: "Fırında somon" and "Somon fırın" meet here. */
function looseKey(name: string) {
  return slug(name)
    .split('-')
    .filter(Boolean)
    .map(stem)
    .sort()
    .join(' ');
}

const BY_LOOSE = new Map<string, Food | null>();
for (const [n, f] of [...FOODS.map((x) => [x.name, x] as [string, Food]), ...ALIASES]) {
  const k = looseKey(n);
  const prev = BY_LOOSE.get(k);
  // two different foods with the same loose form: don't guess between them
  BY_LOOSE.set(k, prev === undefined || prev?.id === f.id ? f : null);
}

export function findFoodByName(name: string): Food | undefined {
  return BY_NAME.get(normalizeName(name)) ?? BY_SLUG.get(slug(name)) ?? FOOD_BY_ID[slug(name)] ?? BY_LOOSE.get(looseKey(name)) ?? undefined;
}

/**
 * Turkish-aware word match: "kofte" finds "köfte", "ekmek" finds "ekmeği" (k→ğ softening)
 * and "tatlısı" finds "tatlı" (possessive suffix).
 */
function wordForms(w: string) {
  const forms = [w];
  const soft: Record<string, string> = { k: 'g', p: 'b', t: 'd', c: 'c' };
  if (w.length >= 4 && soft[w[w.length - 1]]) forms.push(w.slice(0, -1) + soft[w[w.length - 1]]);
  const bare = w.replace(/(si|su|i|u)$/, '');
  if (bare !== w && bare.length >= 4) forms.push(bare);
  return forms;
}

/**
 * Search form of a name: like the slug, but accents fold ("Nestlé" → nestle, "Caffè" → caffe)
 * and apostrophes vanish ("McDonald's" → mcdonalds). Ids keep using slug(), so stored meals
 * still find their food.
 */
const KEYS = new Map<string, string>();
function searchKey(s: string) {
  let k = KEYS.get(s);
  if (k == null) {
    k = slug(
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['’`]/g, ''),
    );
    KEYS.set(s, k);
  }
  return k;
}

function matches(target: string, words: string[][]) {
  return words.every((forms) => forms.some((f) => target.includes(f)));
}

/** Search that ignores Turkish characters and suffixes, and knows old/short names. */
export function searchFoods(q: string, list: Food[] = FOODS) {
  const n = searchKey(q);
  if (!n) return list;
  const words = n.split('-').map((w) => [...wordForms(w), stem(w)]);
  const allowed = list === FOODS ? null : new Set(list.map((f) => f.id));
  const hits = new Map<string, Food>();
  for (const f of list) if (matches(searchKey(f.name), words)) hits.set(f.id, f);
  for (const [from, food] of ALIASES) {
    if ((!allowed || allowed.has(food.id)) && matches(searchKey(from), words)) hits.set(food.id, food);
  }
  const aliasOf = (f: Food) => ALIAS_SLUGS.get(f.id) ?? [];
  // exact name or short name first ("muz" → Olgun muz), then names that begin with the query as
  // whole words, then names that contain it as a word ("zeytin" → Siyah zeytin before
  // Zeytinyağlı …), then plain prefixes; shorter names first within a rank
  const rank = (f: Food) => {
    const s = searchKey(f.name);
    const al = aliasOf(f);
    if (s === n || al.includes(n)) return 0;
    if (s.startsWith(`${n}-`)) return 1;
    if (s.includes(`-${n}-`) || s.endsWith(`-${n}`)) return 2;
    if (s.startsWith(n)) return 3;
    if (al.some((a) => a.startsWith(n))) return 4;
    return 5;
  };
  return [...hits.values()].sort((a, b) => rank(a) - rank(b) || a.name.length - b.name.length);
}

// ---------- chains ("Dışarıda ne yesem?") ----------
export type Brand = { name: string; emoji: string; kind: 'restoran' | 'kafe' };

/** Chains in the food list, roughly by how common they are in Turkey. */
export const BRANDS: Brand[] = [
  { name: "McDonald's", emoji: '🍔', kind: 'restoran' },
  { name: 'Burger King', emoji: '👑', kind: 'restoran' },
  { name: 'KFC', emoji: '🍗', kind: 'restoran' },
  { name: 'Popeyes', emoji: '🍗', kind: 'restoran' },
  { name: "Domino's", emoji: '🍕', kind: 'restoran' },
  { name: 'Little Caesars', emoji: '🍕', kind: 'restoran' },
  { name: 'Sbarro', emoji: '🍕', kind: 'restoran' },
  { name: 'Pizza Hut', emoji: '🍕', kind: 'restoran' },
  { name: "Papa John's", emoji: '🍕', kind: 'restoran' },
  { name: 'Subway', emoji: '🥪', kind: 'restoran' },
  { name: "Arby's", emoji: '🥪', kind: 'restoran' },
  { name: 'Tavuk Dünyası', emoji: '🍗', kind: 'restoran' },
  { name: 'Usta Dönerci', emoji: '🥙', kind: 'restoran' },
  { name: 'Maydonoz Döner', emoji: '🥙', kind: 'restoran' },
  { name: 'Bereket Döner', emoji: '🥙', kind: 'restoran' },
  { name: 'Paşa Döner', emoji: '🥙', kind: 'restoran' },
  { name: 'Baydöner', emoji: '🥙', kind: 'restoran' },
  { name: 'HD İskender', emoji: '🥙', kind: 'restoran' },
  { name: 'Kasap Döner', emoji: '🥙', kind: 'restoran' },
  { name: 'Köfteci Yusuf', emoji: '🍖', kind: 'restoran' },
  { name: 'Komagene', emoji: '🌯', kind: 'restoran' },
  { name: 'Çiğköftem', emoji: '🌯', kind: 'restoran' },
  { name: 'Burger Yiyelim', emoji: '🍔', kind: 'restoran' },
  { name: 'Big Chefs', emoji: '🍽️', kind: 'restoran' },
  { name: 'Midyeci Ahmet', emoji: '🦪', kind: 'restoran' },
  { name: "Carl's Jr.", emoji: '🍔', kind: 'restoran' },
  { name: 'Shake Shack', emoji: '🍔', kind: 'restoran' },
  { name: 'Five Guys', emoji: '🍔', kind: 'restoran' },
  { name: "Wendy's", emoji: '🍔', kind: 'restoran' },
  { name: 'Taco Bell', emoji: '🌮', kind: 'restoran' },
  { name: 'Chipotle', emoji: '🌯', kind: 'restoran' },
  { name: 'Panda Express', emoji: '🥡', kind: 'restoran' },
  { name: 'Starbucks', emoji: '☕', kind: 'kafe' },
  { name: 'Kahve Dünyası', emoji: '☕', kind: 'kafe' },
  { name: 'Espressolab', emoji: '☕', kind: 'kafe' },
  { name: 'Simit Sarayı', emoji: '🥯', kind: 'kafe' },
  { name: 'Mado', emoji: '🍨', kind: 'kafe' },
  { name: 'Caribou', emoji: '☕', kind: 'kafe' },
  { name: "Gloria Jean's", emoji: '☕', kind: 'kafe' },
  { name: 'Costa', emoji: '☕', kind: 'kafe' },
  { name: 'Tim Hortons', emoji: '🍩', kind: 'kafe' },
  { name: "Dunkin'", emoji: '🍩', kind: 'kafe' },
  { name: 'Hafız Mustafa', emoji: '🍬', kind: 'kafe' },
  { name: 'Saray Muhallebicisi', emoji: '🍮', kind: 'kafe' },
  { name: 'Pelit', emoji: '🍰', kind: 'kafe' },
  { name: 'Koska', emoji: '🍯', kind: 'kafe' },
];

const BRAND_FOODS = new Map(BRANDS.map((b) => [b.name, FOODS.filter((f) => f.name.startsWith(`${b.name} `))]));

/** The chain's items in the food list. */
export function brandFoods(brand: string) {
  return BRAND_FOODS.get(brand) ?? [];
}

/** "Big Mac" for "McDonald's Big Mac" on the chain's own page. */
export function withoutBrand(name: string, brand: string) {
  return name.startsWith(`${brand} `) ? name.slice(brand.length + 1) : name;
}
