import { FOOD_SOURCE } from './food-data';

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
  | 'katki';

/** Weights per phase. Negative = gentle on the gut. */
export const TAGS: Record<Tag, { label: string; reason: string; w: Record<Phase, number> }> = {
  hafif: { label: 'Hafif', reason: 'Sade pişmiş, mideyi yormaz', w: { remisyon: -1, atak: -1 } },
  pure: { label: 'Püre', reason: 'Püre kıvamında, lifi yumuşamış', w: { remisyon: 0.3, atak: 1 } },
  lif: { label: 'Bol lif', reason: 'Çözünmeyen lifi yüksek', w: { remisyon: 0.9, atak: 2 } },
  cig: { label: 'Çiğ sebze', reason: 'Çiğ sebze bağırsağı daha çok çalıştırır', w: { remisyon: 0.9, atak: 2 } },
  kabuk: { label: 'Kabuk', reason: 'Kabuk ve zar zor sindirilir', w: { remisyon: 1, atak: 2 } },
  kuruyemis: { label: 'Kuruyemiş', reason: 'Kuruyemiş ve tohum sert, lifli', w: { remisyon: 0.9, atak: 2 } },
  cekirdek: { label: 'Çekirdek', reason: 'Küçük çekirdekleri var', w: { remisyon: 0.5, atak: 1.5 } },
  baklagil: { label: 'Baklagil', reason: 'Baklagiller gaz ve şişkinlik yapabilir', w: { remisyon: 1, atak: 2 } },
  lahana: { label: 'Gaz yapar', reason: 'Lahanagiller, soğan ve sarımsak gaz yapabilir', w: { remisyon: 0.9, atak: 1.5 } },
  yag: { label: 'Yağlı', reason: 'Yağlı ya da kızartma, ishali tetikleyebilir', w: { remisyon: 0.9, atak: 1.8 } },
  yag_hafif: { label: 'Biraz yağlı', reason: 'Bir miktar yağ var', w: { remisyon: 0.3, atak: 1 } },
  aci: { label: 'Acı', reason: 'Acı ve yoğun baharat bağırsağı tahriş edebilir', w: { remisyon: 1, atak: 2 } },
  aci_hafif: { label: 'Az baharatlı', reason: 'Hafif baharatlı', w: { remisyon: 0.3, atak: 0.9 } },
  asit: { label: 'Asitli', reason: 'Domates, sirke ve narenciye asidi bazılarına dokunur', w: { remisyon: 0.3, atak: 1 } },
  sut: { label: 'Laktoz', reason: 'Laktoz içeriyor', w: { remisyon: 0.9, atak: 1.4 } },
  sut_az: { label: 'Az laktoz', reason: 'Laktozu düşük bir süt ürünü', w: { remisyon: 0.2, atak: 0.6 } },
  fermente: { label: 'Fermente', reason: 'Yoğurt ve kefir çoğu kişide iyi tolere edilir', w: { remisyon: 0.2, atak: 0.8 } },
  kafein: { label: 'Kafein', reason: 'Kafein bağırsağı hızlandırır', w: { remisyon: 0.9, atak: 1.5 } },
  kafein_hafif: { label: 'Az kafein', reason: 'Biraz kafein var', w: { remisyon: 0.1, atak: 0.6 } },
  alkol: { label: 'Alkol', reason: 'Alkol bağırsak zarını tahriş eder', w: { remisyon: 1.5, atak: 2.5 } },
  gazli: { label: 'Gazlı', reason: 'Gazlı içecekler şişkinlik yapar', w: { remisyon: 0.9, atak: 1.5 } },
  seker: { label: 'Şekerli', reason: 'Yoğun şeker ishali artırabilir', w: { remisyon: 0.4, atak: 1 } },
  islenmis: { label: 'İşlenmiş et', reason: 'İşlenmiş et yağlı ve katkılı', w: { remisyon: 0.9, atak: 1.6 } },
  tatlandirici: { label: 'Tatlandırıcı', reason: 'Sorbitol gibi tatlandırıcılar gaz ve ishal yapabilir', w: { remisyon: 0.9, atak: 1.5 } },
  katki: { label: 'Katkılı', reason: 'Emülgatör ve katkı maddeleri bazı kişilerde sorun çıkarır', w: { remisyon: 0.4, atak: 0.8 } },
};

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
export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((x) => [x.id, x]));

export function normalizeName(s: string): string {
  return s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

const BY_NAME = new Map(FOODS.map((x) => [normalizeName(x.name), x]));

export function findFoodByName(name: string): Food | undefined {
  return BY_NAME.get(normalizeName(name));
}

/** Search that ignores Turkish characters, so "kofte" finds "köfte". */
export function searchFoods(q: string, list: Food[] = FOODS) {
  const n = slug(q);
  if (!n) return list;
  const words = n.split('-');
  return list
    .filter((f) => {
      const s = slug(f.name);
      return words.every((w) => s.includes(w));
    })
    .sort((a, b) => Number(!slug(a.name).startsWith(n)) - Number(!slug(b.name).startsWith(n)));
}
