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
  | 'asit'
  | 'sut'
  | 'sut_az'
  | 'fermente'
  | 'kafein'
  | 'kafein_hafif'
  | 'alkol'
  | 'gazli'
  | 'seker'
  | 'islenmis';

/** Weights per phase. Negative = gentle on the gut. */
export const TAGS: Record<Tag, { label: string; reason: string; w: Record<Phase, number> }> = {
  hafif: { label: 'Hafif', reason: 'Sindirimi kolay, sade pişirilmiş', w: { remisyon: -1, atak: -1 } },
  pure: { label: 'Püre / süzme', reason: 'Süzme olduğu için lifi yumuşamış', w: { remisyon: 0.3, atak: 1 } },
  lif: { label: 'Yüksek lif', reason: 'Çözünmeyen lifi yüksek', w: { remisyon: 0.9, atak: 2 } },
  cig: { label: 'Çiğ sebze', reason: 'Çiğ sebze bağırsağı daha çok çalıştırır', w: { remisyon: 0.9, atak: 2 } },
  kabuk: { label: 'Kabuk', reason: 'Kabuk ve zarlar zor sindirilir', w: { remisyon: 1, atak: 2 } },
  kuruyemis: { label: 'Kuruyemiş', reason: 'Kuruyemiş ve susam sert ve lifli', w: { remisyon: 0.9, atak: 2 } },
  cekirdek: { label: 'Çekirdek', reason: 'Küçük çekirdekler var', w: { remisyon: 0.5, atak: 1.5 } },
  baklagil: { label: 'Baklagil', reason: 'Baklagiller gaz ve şişkinlik yapabilir', w: { remisyon: 1, atak: 2 } },
  lahana: { label: 'Gaz yapıcı', reason: 'Lahanagiller, soğan, sarımsak gaz yapabilir', w: { remisyon: 0.7, atak: 1.5 } },
  yag: { label: 'Yağlı / kızartma', reason: 'Yağlı ve kızartma yemekler ishali tetikleyebilir', w: { remisyon: 0.8, atak: 1.8 } },
  yag_hafif: { label: 'Biraz yağlı', reason: 'Bir miktar yağ içeriyor', w: { remisyon: 0.3, atak: 1 } },
  aci: { label: 'Acı / baharatlı', reason: 'Acı ve yoğun baharat bağırsağı tahriş edebilir', w: { remisyon: 1, atak: 2 } },
  asit: { label: 'Asitli', reason: 'Domates ve narenciye asidi bazılarına dokunur', w: { remisyon: 0.3, atak: 1 } },
  sut: { label: 'Süt ürünü', reason: 'Laktoz içeriyor', w: { remisyon: 0.6, atak: 1.4 } },
  sut_az: { label: 'Az laktoz', reason: 'Laktozu düşük bir süt ürünü', w: { remisyon: 0.2, atak: 0.6 } },
  fermente: { label: 'Fermente', reason: 'Fermente süt ürünleri genelde daha kolay tolere edilir', w: { remisyon: 0.2, atak: 0.8 } },
  kafein: { label: 'Kafein', reason: 'Kafein bağırsak hareketlerini hızlandırır', w: { remisyon: 0.6, atak: 1.5 } },
  kafein_hafif: { label: 'Az kafein', reason: 'Bir miktar kafein var', w: { remisyon: 0.1, atak: 0.6 } },
  alkol: { label: 'Alkol', reason: 'Alkol bağırsak zarını tahriş eder', w: { remisyon: 1.5, atak: 2.5 } },
  gazli: { label: 'Gazlı içecek', reason: 'Gazlı içecekler şişkinlik yapar', w: { remisyon: 0.8, atak: 1.5 } },
  seker: { label: 'Yoğun şeker', reason: 'Yoğun şeker ishali artırabilir', w: { remisyon: 0.4, atak: 1 } },
  islenmis: { label: 'İşlenmiş et', reason: 'İşlenmiş etler yağlı ve katkılı', w: { remisyon: 0.9, atak: 1.6 } },
};

export const ALL_TAGS = Object.keys(TAGS) as Tag[];

export type Food = {
  id: string;
  name: string;
  emoji: string;
  cat: Category;
  tags: Tag[];
};

export type Category = 'Çorba' | 'Ana yemek' | 'Kahvaltı' | 'Sebze & salata' | 'Meyve' | 'Tatlı & atıştırmalık' | 'İçecek';

export const CATEGORIES: Category[] = ['Çorba', 'Ana yemek', 'Kahvaltı', 'Sebze & salata', 'Meyve', 'Tatlı & atıştırmalık', 'İçecek'];

const f = (id: string, name: string, emoji: string, cat: Category, tags: Tag[]): Food => ({ id, name, emoji, cat, tags });

export const FOODS: Food[] = [
  // Çorbalar
  f('mercimek', 'Mercimek çorbası', '🍲', 'Çorba', ['pure']),
  f('ezogelin', 'Ezogelin çorbası', '🍲', 'Çorba', ['pure', 'aci']),
  f('tavuk-suyu', 'Tavuk suyu çorba', '🍜', 'Çorba', ['hafif']),
  f('yayla', 'Yayla çorbası', '🥣', 'Çorba', ['fermente']),
  f('iskembe', 'İşkembe çorbası', '🍲', 'Çorba', ['yag', 'lahana']),
  f('domates-corba', 'Domates çorbası', '🍅', 'Çorba', ['asit']),
  f('sebze-corba', 'Süzme sebze çorbası', '🥕', 'Çorba', ['hafif']),
  f('kemik-suyu', 'Kemik suyu', '🦴', 'Çorba', ['hafif']),

  // Ana yemekler
  f('izgara-tavuk', 'Izgara tavuk', '🍗', 'Ana yemek', ['hafif']),
  f('firin-tavuk', 'Fırın tavuk & patates', '🍗', 'Ana yemek', ['hafif']),
  f('izgara-kofte', 'Izgara köfte', '🧆', 'Ana yemek', ['yag_hafif']),
  f('somon', 'Izgara somon', '🐟', 'Ana yemek', ['hafif']),
  f('levrek', 'Buğulama levrek', '🐟', 'Ana yemek', ['hafif']),
  f('tavuk-sote', 'Tavuk sote', '🥘', 'Ana yemek', ['yag_hafif', 'aci']),
  f('kuru-fasulye', 'Etli kuru fasulye', '🫘', 'Ana yemek', ['baklagil', 'yag_hafif']),
  f('nohut', 'Nohut yemeği', '🫘', 'Ana yemek', ['baklagil']),
  f('karniyarik', 'Karnıyarık', '🍆', 'Ana yemek', ['yag', 'kabuk']),
  f('imam-bayildi', 'İmam bayıldı', '🍆', 'Ana yemek', ['yag', 'lahana']),
  f('manti', 'Mantı', '🥟', 'Ana yemek', ['fermente', 'lahana', 'aci']),
  f('lahmacun', 'Lahmacun', '🫓', 'Ana yemek', ['aci', 'cig']),
  f('pide', 'Kıymalı pide', '🫓', 'Ana yemek', ['yag']),
  f('adana', 'Adana kebap', '🍢', 'Ana yemek', ['yag', 'aci']),
  f('doner', 'Et döner', '🥙', 'Ana yemek', ['yag', 'islenmis']),
  f('tavuk-doner', 'Tavuk döner', '🥙', 'Ana yemek', ['yag']),
  f('iskender', 'İskender', '🍖', 'Ana yemek', ['yag', 'sut']),
  f('hunkar', 'Hünkar beğendi', '🍖', 'Ana yemek', ['yag', 'sut']),
  f('taze-fasulye', 'Zeytinyağlı taze fasulye', '🫛', 'Ana yemek', ['lif']),
  f('ispanak', 'Ispanak yemeği', '🥬', 'Ana yemek', ['lif']),
  f('biber-dolma', 'Biber dolması', '🫑', 'Ana yemek', ['kabuk']),
  f('yaprak-sarma', 'Yaprak sarma', '🍃', 'Ana yemek', ['lif']),
  f('hamburger', 'Hamburger', '🍔', 'Ana yemek', ['yag', 'islenmis']),
  f('pizza', 'Pizza', '🍕', 'Ana yemek', ['yag', 'sut', 'asit']),
  f('nugget', 'Kızarmış tavuk / nugget', '🍗', 'Ana yemek', ['yag']),
  f('sushi', 'Sushi', '🍣', 'Ana yemek', []),
  f('sade-makarna', 'Sade makarna', '🍝', 'Ana yemek', ['hafif']),
  f('kremali-makarna', 'Kremalı makarna', '🍝', 'Ana yemek', ['sut', 'yag']),
  f('bolonez', 'Bolonez makarna', '🍝', 'Ana yemek', ['asit', 'yag_hafif']),
  f('pilav', 'Pirinç pilavı', '🍚', 'Ana yemek', ['hafif']),
  f('bulgur', 'Bulgur pilavı', '🍚', 'Ana yemek', ['lif']),
  f('kinoa', 'Kinoa salatası', '🥗', 'Ana yemek', ['lif', 'cig']),

  // Kahvaltı
  f('yumurta', 'Haşlanmış yumurta', '🥚', 'Kahvaltı', ['hafif']),
  f('omlet', 'Sade omlet', '🍳', 'Kahvaltı', ['yag_hafif']),
  f('menemen', 'Menemen', '🍳', 'Kahvaltı', ['asit', 'yag_hafif']),
  f('sucuk-yumurta', 'Sucuklu yumurta', '🍳', 'Kahvaltı', ['islenmis', 'yag', 'aci']),
  f('beyaz-peynir', 'Beyaz peynir', '🧀', 'Kahvaltı', ['sut_az']),
  f('kasar', 'Kaşar peyniri', '🧀', 'Kahvaltı', ['sut_az']),
  f('simit', 'Simit', '🥯', 'Kahvaltı', ['kuruyemis']),
  f('beyaz-ekmek', 'Beyaz ekmek', '🍞', 'Kahvaltı', ['hafif']),
  f('tam-bugday', 'Tam buğday ekmeği', '🍞', 'Kahvaltı', ['lif']),
  f('yulaf', 'Yulaf lapası', '🥣', 'Kahvaltı', ['pure']),
  f('yogurt', 'Yoğurt', '🥛', 'Kahvaltı', ['fermente']),
  f('kefir', 'Kefir', '🥛', 'Kahvaltı', ['fermente']),
  f('zeytin', 'Zeytin', '🫒', 'Kahvaltı', ['yag_hafif']),
  f('bal', 'Bal', '🍯', 'Kahvaltı', ['seker']),
  f('borek', 'Börek', '🥐', 'Kahvaltı', ['yag']),
  f('pogaca', 'Poğaça', '🥐', 'Kahvaltı', ['yag']),
  f('avokado', 'Avokado', '🥑', 'Kahvaltı', ['yag_hafif']),

  // Sebze & salata
  f('coban', 'Çoban salata', '🥗', 'Sebze & salata', ['cig', 'kabuk', 'lahana']),
  f('mevsim', 'Mevsim salata', '🥗', 'Sebze & salata', ['cig']),
  f('kabak', 'Haşlanmış kabak (kabuksuz)', '🥒', 'Sebze & salata', ['hafif']),
  f('havuc', 'Haşlanmış havuç', '🥕', 'Sebze & salata', ['hafif']),
  f('pure', 'Patates püresi', '🥔', 'Sebze & salata', ['hafif']),
  f('brokoli', 'Brokoli', '🥦', 'Sebze & salata', ['lahana', 'lif']),
  f('karnabahar', 'Karnabahar kızartması', '🥦', 'Sebze & salata', ['lahana', 'yag']),
  f('mantar', 'Mantar', '🍄', 'Sebze & salata', ['lif']),
  f('misir', 'Mısır', '🌽', 'Sebze & salata', ['lif', 'kabuk']),
  f('patates-kizartma', 'Patates kızartması', '🍟', 'Sebze & salata', ['yag']),

  // Meyve
  f('muz', 'Muz', '🍌', 'Meyve', ['hafif']),
  f('elma-kabuksuz', 'Kabuksuz elma', '🍏', 'Meyve', []),
  f('elma-kabuklu', 'Kabuklu elma', '🍎', 'Meyve', ['kabuk']),
  f('komposto', 'Haşlanmış elma / komposto', '🍮', 'Meyve', ['hafif']),
  f('kavun', 'Kavun / karpuz', '🍉', 'Meyve', []),
  f('cilek', 'Çilek', '🍓', 'Meyve', ['cekirdek']),
  f('kuru-meyve', 'Kuru incir / kuru meyve', '🍇', 'Meyve', ['lif', 'seker']),
  f('portakal', 'Portakal', '🍊', 'Meyve', ['asit', 'lif']),

  // Tatlı & atıştırmalık
  f('kuruyemis', 'Karışık kuruyemiş', '🥜', 'Tatlı & atıştırmalık', ['kuruyemis', 'yag_hafif']),
  f('cikolata', 'Çikolata', '🍫', 'Tatlı & atıştırmalık', ['seker', 'yag_hafif', 'kafein_hafif']),
  f('baklava', 'Baklava', '🍯', 'Tatlı & atıştırmalık', ['seker', 'yag', 'kuruyemis']),
  f('sutlac', 'Sütlaç', '🍮', 'Tatlı & atıştırmalık', ['sut', 'seker']),
  f('dondurma', 'Dondurma', '🍨', 'Tatlı & atıştırmalık', ['sut', 'seker', 'yag_hafif']),
  f('kurabiye', 'Kurabiye', '🍪', 'Tatlı & atıştırmalık', ['seker', 'yag_hafif']),
  f('cips', 'Cips', '🥔', 'Tatlı & atıştırmalık', ['yag', 'aci']),
  f('patlamis-misir', 'Patlamış mısır', '🍿', 'Tatlı & atıştırmalık', ['lif', 'kabuk']),

  // İçecek
  f('kahve', 'Kahve', '☕', 'İçecek', ['kafein']),
  f('cay', 'Çay', '🍵', 'İçecek', ['kafein_hafif']),
  f('papatya', 'Papatya / bitki çayı', '🌼', 'İçecek', ['hafif']),
  f('ayran', 'Ayran', '🥛', 'İçecek', ['fermente']),
  f('sut', 'Süt', '🥛', 'İçecek', ['sut']),
  f('kola', 'Kola', '🥤', 'İçecek', ['gazli', 'seker', 'kafein_hafif']),
  f('soda', 'Maden suyu / soda', '🫧', 'İçecek', ['gazli']),
  f('meyve-suyu', 'Taze sıkma meyve suyu', '🧃', 'İçecek', ['seker', 'asit']),
  f('bira', 'Bira', '🍺', 'İçecek', ['alkol', 'gazli']),
  f('sarap-raki', 'Şarap / rakı', '🍷', 'İçecek', ['alkol']),
];

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((x) => [x.id, x]));

export function normalizeName(s: string): string {
  return s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function findFoodByName(name: string): Food | undefined {
  const n = normalizeName(name);
  return FOODS.find((x) => normalizeName(x.name) === n);
}

export function isTag(t: string): t is Tag {
  return t in TAGS;
}
