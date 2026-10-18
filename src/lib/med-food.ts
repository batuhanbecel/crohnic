import { slug, type Tag, type Verdict } from './foods';

/**
 * What the user's medicines mean for what they eat. Only the medicine groups the user switched on
 * in Ayarlar › Sana özel durumlar count (cortisone is usually a few weeks, not for life). Names
 * they typed in İlaçlarım ("Prednol", "Pentasa") are recognised to suggest a group and to name it
 * in the notes, so it works without a drug database. Only well-known, label-level interactions and
 * IBD guideline advice; every text ends in "ask your doctor" territory rather than doses.
 *
 * A rule either rates a food ('kacin' → riskli, 'dikkat' → at least dikkat) or only adds a note
 * about timing ('bilgi', e.g. dairy two hours apart from ciprofloxacin), which leaves the verdict alone.
 */

export type MedClass =
  | 'steroid'
  | 'budesonid'
  | 'asa5'
  | 'sulfasalazin'
  | 'tiyopurin'
  | 'metotreksat'
  | 'biyolojik'
  | 'upadasitinib'
  | 'metronidazol'
  | 'siprofloksasin'
  | 'demir';

type ClassDef = {
  label: string;
  match: RegExp;
  tips: string[];
  /** brand names shown next to the switch, so "Prednol" is found under Kortizon */
  examples: string;
  /** what switching it on changes, one sentence */
  effect: string;
};

const IMMUNE = 'Bağışıklık baskılanabilir: çiğ ya da az pişmiş et, balık ve yumurtadan, pastörize olmayan süt ürünlerinden uzak dur; mutfak hijyenine dikkat et.';

export const MED_CLASSES: Record<MedClass, ClassDef> = {
  steroid: {
    label: 'Kortizon',
    examples: 'Prednol, Deltakortril, Medrol, Dekort',
    effect: 'Şekerli ve tuzlu yiyecekleri en az “dikkat” sayarım; alkol ve meyan kökü riskli, greyfurt dikkat. Çiğ hayvansal gıdaları da uyarırım.',
    match: /kortizon|kortikosteroid|steroid|prednol|prednizolon|prednisolon|prednizon|prednison|metilpred|methylpred|medrol|deltakortril|deltacortril|dekort|deksametazon|dexameth|hidrokortizon|hydrocort/,
    tips: [
      'Tok karnına al, tercihen kahvaltıyla; mideyi korur.',
      'Şekeri azalt: kortizon kan şekerini yükseltebilir. Tatlıyı küçük porsiyonla, yemekten sonra ye.',
      'Tuzu azalt: vücutta tuz ve su tutar, tansiyonu yükseltebilir. Turşu, sucuk, salam, cips ve hazır yiyeceklere dikkat.',
      'İştah artabilir: porsiyonu küçük tut, protein ağırlıklı ye.',
      'Kemiklerin için kalsiyum ve D vitamini önemli; takviye gerekip gerekmediğini doktoruna sor.',
      'Alkol, greyfurt ve meyan kökünden uzak dur.',
      IMMUNE,
    ],
  },
  budesonid: {
    label: 'Budesonid',
    examples: 'Entocort, Cortiment, Budenofalk',
    effect: 'Greyfurdu riskli sayarım.',
    match: /budesonid|entocort|cortiment|budenofalk|jorveza/,
    tips: ['Greyfurt ve greyfurt suyundan tedavi boyunca kaçın: ilacın kandaki düzeyini belirgin artırır.', 'Nasıl ve ne zaman alacağını doktorun ya da prospektüs söyler; genelde sabah alınır.'],
  },
  asa5: {
    label: 'Mesalazin',
    examples: 'Pentasa, Salofalk, Asacol',
    effect: 'Bilinen bir yiyecek etkileşimi yok, yemek puanları değişmez; açarsan su ve kullanım notlarını gösteririm.',
    match: /pentasa|salofalk|asacol|mesalazin|mesalamin|mezavant|lialda|apriso|claversal/,
    tips: [
      'Bilinen önemli bir yiyecek etkileşimi yok; aç ya da tok alınabilir.',
      'Gün içinde bol su iç; böbreklerin için iyi.',
      'Granülleri ya da tableti çiğneme, suyla yut.',
    ],
  },
  sulfasalazin: {
    label: 'Sülfasalazin',
    examples: 'Salazopyrin',
    effect: 'Yemek puanları değişmez; açarsan su ve folik asit notlarını gösteririm.',
    match: /sulfasalazin|salazopyrin/,
    tips: ['Bol su iç.', 'Folik asit eksikliği yapabilir; takviyeyi doktoruna sor.', 'İdrarı turuncuya boyayabilir, zararsızdır.'],
  },
  tiyopurin: {
    label: 'Azatiyoprin',
    examples: 'Imuran, Azoran, Purinethol',
    effect: 'Çiğ ve az pişmiş hayvansal gıdaları uyarırım.',
    match: /azatiyoprin|azathioprin|imuran|azoran|merkaptopurin|mercaptopurin|purinethol/,
    tips: ['Mide bulantısı yaparsa yemekle birlikte al.', IMMUNE],
  },
  metotreksat: {
    label: 'Metotreksat',
    examples: 'Metoject',
    effect: 'Alkolü riskli sayarım, çiğ hayvansal gıdaları uyarırım.',
    match: /metotreksat|methotrexat|metoject/,
    tips: ['Alkolden kaçın: karaciğere yük bindirir.', 'Folik asidi doktorunun söylediği günlerde al.', IMMUNE],
  },
  biyolojik: {
    label: 'Biyolojik ilaç',
    examples: 'Humira, Remicade, Entyvio, Stelara, Skyrizi',
    effect: 'Çiğ ve az pişmiş hayvansal gıdaları uyarırım.',
    match: /humira|adalimumab|amgevita|hyrimoz|idacio|imraldi|hulio|remicade|infliksimab|infliximab|remsima|inflectra|flixabi|entyvio|vedolizumab|stelara|ustekinumab|skyrizi|risankizumab|omvoh|mirikizumab|tremfya|guselkumab|cimzia|sertolizumab|certolizumab|simponi|golimumab|xeljanz|tofasitinib|zeposia|ozanimod|velsipity|etrasimod/,
    tips: ['Belirgin bir yiyecek etkileşimi yok.', IMMUNE],
  },
  upadasitinib: {
    label: 'Rinvoq',
    examples: 'upadasitinib',
    effect: 'Greyfurdu riskli sayarım, çiğ hayvansal gıdaları uyarırım.',
    match: /rinvoq|upadasitinib|upadacitinib/,
    tips: ['Greyfurt ve greyfurt suyundan kaçın.', IMMUNE],
  },
  metronidazol: {
    label: 'Metronidazol',
    examples: 'Flagyl',
    effect: 'Alkolü riskli sayarım.',
    match: /metronidazol|flagyl|nidazol/,
    tips: ['Tedavi boyunca ve bittikten sonra 3 gün alkol yok: ciddi bulantı, kusma ve çarpıntı yapar.', 'Mideni rahatsız ederse tok karnına al.'],
  },
  siprofloksasin: {
    label: 'Siprofloksasin',
    examples: 'Cipro, Siprobel',
    effect: 'Süt ürünleri ve kahvede ilaçla aynı saate denk getirmemen için not düşerim.',
    match: /siprofloksasin|ciprofloxacin|cipro|siprobel|ciproxin|ciflosin/,
    tips: ['Süt, yoğurt, ayran ve kalsiyumlu içeceklerle aynı anda alma: ilacı bunlardan 2 saat önce ya da 6 saat sonra al.', 'Kahveyi azalt: ilaç kafeinin etkisini artırır.'],
  },
  demir: {
    label: 'Demir',
    examples: 'Ferro Sanol, Maltofer',
    effect: 'Çay, kahve ve süt ürünlerinde ilaçtan ayrı zamanda içmeni hatırlatırım.',
    match: /demir|ferro|ferrum|maltofer|ferrosanol/,
    tips: ['Çay, kahve ve süt ürünlerinden en az 1 saat ayrı al.', 'C vitamini (örneğin portakal suyu) emilimi artırır.'],
  },
};

export type FoodLike = { name: string; tags: readonly Tag[] | readonly string[] };
export type RuleLevel = 'kacin' | 'dikkat' | 'bilgi';

type Rule = { id: string; classes: MedClass[]; level: RuleLevel; test: (f: FoodLike) => boolean; short: string; text: string };

const lower = (s: string) => s.toLocaleLowerCase('tr-TR');
const has = (f: FoodLike, t: Tag) => (f.tags as readonly string[]).includes(t);
const SALTY =
  /turşu|cips|sucuk|salam|sosis|pastırma|jambon|füme|soya sos|hazır çorba|hazır noodle|tuzlu|salamura|zeytin(?!yağ)|beyaz peynir|tulum peynir|hellim|feta|rokfor|parmesan|kokoreç|kavurma|çiroz|lakerda|tarama|ketçap|doritos|cheetos|pringles|lay's|ruffles|çerezza|patos|pretzel|kokteyl çerez|kraker|şalgam|pizza|burger|whopper|big mac|nugget|mcdonald|kfc|popeyes|domino|subway|arby|carl's|wendy|five guys|shake shack|taco bell|döner|tantuni|lahmacun/;
const isSugary = (f: FoodLike) => has(f, 'seker');
const NOT_SALTY = /cevizli sucuk|meyve cipsi|muz cipsi|elma cipsi/;
const isSalty = (f: FoodLike) => {
  const n = lower(f.name);
  if (NOT_SALTY.test(n)) return false;
  return SALTY.test(n) || (has(f, 'islenmis') && !has(f, 'seker'));
};
const isAlcohol = (f: FoodLike) => has(f, 'alkol');
const isGrapefruit = (f: FoodLike) => /greyfurt|pomelo|grapefruit/.test(lower(f.name));
const isLicorice = (f: FoodLike) => /meyan/.test(lower(f.name));
const isRaw = (f: FoodLike) => has(f, 'cig_hayvansal');
const isDairy = (f: FoodLike) => has(f, 'sut') || has(f, 'sut_az') || /süt|yoğurt|kefir|ayran|peynir/.test(lower(f.name));
const isTeaCoffee = (f: FoodLike) => has(f, 'kafein') || /çay|kahve|espresso|latte|cappuccino|americano|macchiato|mocha|matcha/.test(lower(f.name));
const isCoffee = (f: FoodLike) => has(f, 'kafein');

const IMMUNE_CLASSES: MedClass[] = ['steroid', 'tiyopurin', 'metotreksat', 'biyolojik', 'upadasitinib'];

const RULES: Rule[] = [
  { id: 'licorice', classes: ['steroid'], level: 'kacin', test: isLicorice, short: 'meyan kökünden kaçın', text: 'Meyan kökü kortizonun tuz tutma ve potasyum kaybettirme etkisini artırır, tansiyonu yükseltebilir.' },
  { id: 'alcohol-steroid', classes: ['steroid'], level: 'kacin', test: isAlcohol, short: 'alkolden kaçın', text: 'Kortizonla birlikte alkol mideyi tahriş eder, ülser ve kanama riskini artırır; kan şekerini de bozar.' },
  { id: 'alcohol-mtx', classes: ['metotreksat'], level: 'kacin', test: isAlcohol, short: 'alkolden kaçın', text: 'Metotreksat ile alkol karaciğere yük bindirir; tedavi boyunca kaçın.' },
  { id: 'alcohol-metronidazol', classes: ['metronidazol'], level: 'kacin', test: isAlcohol, short: 'alkol kesinlikle yok', text: 'Metronidazolle alkol ciddi bulantı, kusma ve çarpıntı yapar. Tedavi bitince de 3 gün içme.' },
  { id: 'grapefruit-strong', classes: ['budesonid', 'upadasitinib'], level: 'kacin', test: isGrapefruit, short: 'greyfurttan kaçın', text: 'Greyfurt ilacın kandaki düzeyini belirgin artırır; tedavi boyunca greyfurt ve suyundan kaçın.' },
  { id: 'grapefruit-steroid', classes: ['steroid'], level: 'dikkat', test: isGrapefruit, short: 'greyfurdu sık tüketme', text: 'Greyfurt, metilprednizolon (Prednol gibi) başta bazı kortizon ilaçlarının kandaki düzeyini artırabilir. Doktoruna sormadan sık tüketme.' },
  { id: 'sugar-steroid', classes: ['steroid'], level: 'dikkat', test: isSugary, short: 'şekerli yiyecekleri sınırla', text: 'Kortizon kan şekerini yükseltebilir. Şekerli yiyecek ve içecekleri sınırla; tatlıyı küçük porsiyonla, yemekten sonra ye.' },
  { id: 'salt-steroid', classes: ['steroid'], level: 'dikkat', test: isSalty, short: 'tuzlu yiyecekleri azalt', text: 'Kortizon vücutta tuz ve su tutar, tansiyonu yükseltebilir. Tuzlu ve işlenmiş yiyecekleri azalt.' },
  { id: 'raw-immune', classes: IMMUNE_CLASSES, level: 'dikkat', test: isRaw, short: 'çiğ hayvansal gıdadan uzak dur', text: 'İlacın bağışıklığı baskılayabilir; çiğ ya da az pişmiş et, balık, yumurta ve pastörize olmayan süt ürünleri enfeksiyon riskini artırır.' },
  { id: 'dairy-cipro', classes: ['siprofloksasin'], level: 'bilgi', test: isDairy, short: 'ilaçla aynı anda alma', text: 'Süt ürünleri siprofloksasinin emilimini azaltır. İlacı bunlardan 2 saat önce ya da 6 saat sonra al.' },
  { id: 'coffee-cipro', classes: ['siprofloksasin'], level: 'bilgi', test: isCoffee, short: 'kahveyi azalt', text: 'Siprofloksasin kafeinin etkisini artırır; çarpıntı ve uykusuzluk yapabilir, kahveyi azalt.' },
  { id: 'tea-iron', classes: ['demir'], level: 'bilgi', test: isTeaCoffee, short: 'demirden 1 saat ayrı iç', text: 'Çay ve kahve demirin emilimini azaltır; demir ilacından en az 1 saat ayrı iç.' },
  { id: 'dairy-iron', classes: ['demir'], level: 'bilgi', test: isDairy, short: 'demirden ayrı zamanda tüket', text: 'Süt ürünleri demirin emilimini azaltır; demir ilacından ayrı zamanda tüket.' },
];

// ---------- the user's medicines ----------
/** The order of the switches in Ayarlar: the IBD regulars first. */
export const MED_ORDER: MedClass[] = ['steroid', 'asa5', 'budesonid', 'tiyopurin', 'metotreksat', 'biyolojik', 'upadasitinib', 'sulfasalazin', 'metronidazol', 'siprofloksasin', 'demir'];

export function isMedClass(s: string): s is MedClass {
  return s in MED_CLASSES;
}

/** Groups recognised in medicine names ("Prednol" → steroid), in MED_ORDER. */
export function classesIn(names: string[]): MedClass[] {
  const found = new Set<MedClass>();
  for (const name of names) {
    const s = slug(name);
    for (const cls of MED_ORDER) if (MED_CLASSES[cls].match.test(s)) found.add(cls);
  }
  return MED_ORDER.filter((c) => found.has(c));
}

/** The user's names in this group ("Prednol", "Kortizon"), or none. */
export function namesIn(cls: MedClass, names: string[]) {
  return names.map((n) => n.trim()).filter((n) => n && MED_CLASSES[cls].match.test(slug(n)));
}

/** Groups with a rule that can change how a food is rated (mesalazin only has timing notes). */
const RATES = new Set<MedClass>(RULES.filter((r) => r.level !== 'bilgi').flatMap((r) => r.classes));

let active: { cls: MedClass; names: string[] }[] = [];

/**
 * Call whenever the switches or the medicines list change. `on`: the groups switched on;
 * `names`: medicine names from İlaçlarım, used only to word the notes ("Prednol: …").
 */
export function setMedContext(on: MedClass[], names: string[]) {
  active = MED_ORDER.filter((c) => on.includes(c)).map((cls) => {
    const mine = namesIn(cls, names);
    return { cls, names: mine.length ? [...new Set(mine)] : [MED_CLASSES[cls].label] };
  });
}

export function activeMedClasses() {
  return active.map((a) => a.cls);
}

/** Labels of the switched-on groups that change ratings, for "what was taken into account". */
export function ratingMedLabels() {
  return active.filter((a) => RATES.has(a.cls)).map((a) => MED_CLASSES[a.cls].label);
}

/** Per medicine group: the user's medicine names and the general advice, for the medicines page. */
export function medGuide() {
  return active.map((a) => ({ cls: a.cls, label: MED_CLASSES[a.cls].label, names: a.names, tips: MED_CLASSES[a.cls].tips }));
}

export type MedHit = { id: string; level: RuleLevel; names: string[]; short: string; text: string };

/** What the user's medicines say about this food (empty when nothing applies). */
export function medHits(food: FoodLike): MedHit[] {
  if (!active.length) return [];
  const out: MedHit[] = [];
  for (const rule of RULES) {
    const mine = active.filter((a) => rule.classes.includes(a.cls));
    if (!mine.length || !rule.test(food)) continue;
    out.push({ id: rule.id, level: rule.level, names: [...new Set(mine.flatMap((a) => a.names))], short: rule.short, text: rule.text });
  }
  return out;
}

/** "Prednol, Kortizon": the user's own names for the medicines behind a hit. */
export function medNames(hit: MedHit) {
  return hit.names.join(', ');
}

/** One line for lists: "💊 Prednol: şekerli yiyecekleri sınırla". */
export function medLine(hit: MedHit) {
  return `💊 ${medNames(hit)}: ${hit.short}`;
}

/** What the AI should keep in mind about the medicines, one short line (sent with photo analyses). */
const AI_NOTES: Partial<Record<MedClass, string>> = {
  steroid: 'kortizon: şekerli ve tuzlu yiyecekleri, alkolü, greyfurdu ve meyan kökünü uyar; tok karnına alınmalı',
  budesonid: 'budesonid: greyfurttan kaçınmalı',
  tiyopurin: 'bağışıklık baskılayıcı: çiğ ve az pişmiş hayvansal gıdayı uyar',
  metotreksat: 'metotreksat: alkol yok, çiğ hayvansal gıdayı uyar',
  biyolojik: 'bağışıklık baskılayıcı: çiğ ve az pişmiş hayvansal gıdayı uyar',
  upadasitinib: 'Rinvoq: greyfurt yok, çiğ hayvansal gıdayı uyar',
  metronidazol: 'metronidazol: alkol kesinlikle yok',
  siprofloksasin: 'siprofloksasin: süt ürünleriyle aynı anda alınmamalı',
  demir: 'demir: çay, kahve ve süt ürünleriyle ayrı alınmalı',
};

/** Only the groups switched on: a medicine the user stopped shouldn't colour the analysis. */
export function medContextForAI() {
  if (!active.length) return null;
  const names = [...new Set(active.flatMap((a) => a.names))];
  const notes = [...new Set(active.map((a) => AI_NOTES[a.cls]).filter(Boolean))];
  return `Şu an kullandığı ilaçlar: ${names.join(', ')}${notes.length ? ` (${notes.join('; ')}). Yemekte buna dokunan bir şey varsa nedenlerde ve ipuçlarında ilacın adıyla belirt` : ''}`;
}

/** A verdict made no less careful than the medicines ask (for AI results, which come from outside). */
export function floorVerdict(v: Verdict, hits: MedHit[]): Verdict {
  const f = medFloor(hits);
  const rank = { iyi: 0, dikkat: 1, riskli: 2 } as const;
  return f && rank[f] > rank[v] ? f : v;
}

/** The most careful level among the hits that rate a food: kacin → riskli, dikkat → dikkat. */
export function medFloor(hits: MedHit[]): 'riskli' | 'dikkat' | null {
  if (hits.some((h) => h.level === 'kacin')) return 'riskli';
  if (hits.some((h) => h.level === 'dikkat')) return 'dikkat';
  return null;
}
