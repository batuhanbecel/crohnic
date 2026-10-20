/**
 * Plant variety: how many different plants (vegetables, fruit, grains, pulses, nuts, seeds,
 * herbs) went into a week. A varied plant diet goes with a more varied gut flora; in remission
 * IBD guidelines don't ask for a narrow diet. Each plant counts once a week, however it came
 * (ıspanaklı börek and ıspanak salatası are one: ıspanak). In a flare variety isn't the goal.
 *
 * Read from meal names, so free-typed and AI-named meals count too. Rules run most specific
 * first and a matched phrase is taken out, so "kabak çekirdeği" isn't also "kabak".
 */
type Rule = [plant: string, pattern: string];

const RULES: Rule[] = [
  // multi-word and tricky ones first
  ['Hindistan cevizi', 'hindistan ?cevizi'],
  ['Kabak çekirdeği', 'kabak çekirde'],
  ['Ay çekirdeği', 'ay çekirde'],
  ['Yer fıstığı', 'yer ?fıstı'],
  ['Antep fıstığı', 'antep fıstı|fıstıklı|fıstık'],
  ['Balkabağı', 'bal ?kaba'],
  ['Tatlı patates', 'tatlı patates'],
  ['Brüksel lahanası', 'brüksel'],
  ['Kara lahana', 'kara ?lahana'],
  ['Taze fasulye', 'taze fasulye|yeşil fasulye'],
  ['Kuru fasulye', 'kuru fasulye|fasulye'],
  ['Yaban mersini', 'yaban mersin'],
  ['Keten tohumu', 'keten'],
  ['Zeytin', 'zeytin(?!ya)'],
  ['Nohut', 'nohut|humus|falafel|leblebi'],
  ['Soya', 'soya|tofu|edamame'],
  ['Bulgur', 'bulgur|kısır|içli köfte|çiğ köfte'],
  ['Pirinç', 'pirinç|sütlaç|risotto|suşi|sushi|sarma|dolma'],
  ['Buğday', 'arpa şehriye|buğday|ekmek|lavaş|pide|bazlama|simit|makarna|erişte|şehriye|mantı|börek|kruvasan|poğaça|açma|gözleme|lahmacun|pizza|kuskus|irmik|tost|sandviç|bagel|yufka|kete|katmer|baklava|kadayıf'],
  ['Susam', 'susam|tahin'],
  // vegetables
  ['Domates', 'domates'],
  ['Salatalık', 'salatalık|hıyar|cacık'],
  ['Biber', 'biber'],
  ['Patlıcan', 'patlıcan|beğendi|imam bayıldı|karnıyarık|musakka|baba ?ganuş'],
  ['Kabak', 'kabak|mücver'],
  ['Havuç', 'havuç'],
  ['Patates', 'patates|kumpir'],
  ['Soğan', 'soğan'],
  ['Sarımsak', 'sarımsak'],
  ['Pırasa', 'pırasa'],
  ['Ispanak', 'ıspanak'],
  ['Pazı', 'pazı'],
  ['Semizotu', 'semizotu'],
  ['Roka', 'roka'],
  ['Marul', 'marul|kıvırcık|göbek salata'],
  ['Lahana', 'lahana|kapuska'],
  ['Brokoli', 'brokoli'],
  ['Karnabahar', 'karnabahar'],
  ['Kereviz', 'kereviz'],
  ['Enginar', 'enginar'],
  ['Bamya', 'bamya'],
  ['Bezelye', 'bezelye'],
  ['Börülce', 'börülce'],
  ['Bakla', 'bakla(?!va)'],
  ['Mantar', 'mantar'],
  ['Pancar', 'pancar'],
  ['Turp', 'turp'],
  ['Şalgam', 'şalgam'],
  ['Kuşkonmaz', 'kuşkonmaz'],
  ['Ebegümeci', 'ebegümeci'],
  ['Isırgan', 'ısırgan'],
  ['Mısır', 'mısır'],
  ['Avokado', 'avokado'],
  ['Maydanoz', 'maydanoz|tabule'],
  ['Dereotu', 'dereotu'],
  ['Nane', 'nane'],
  ['Fesleğen', 'fesleğen|pesto'],
  ['Kişniş', 'kişniş'],
  ['Tere', 'tere(?!yağ)'],
  ['Zencefil', 'zencefil'],
  // pulses and grains
  ['Mercimek', 'mercimek|ezogelin'],
  ['Barbunya', 'barbunya'],
  ['Yulaf', 'yulaf|granola|müsli'],
  ['Arpa', 'arpa(?! şehriye)'],
  ['Çavdar', 'çavdar'],
  ['Karabuğday', 'karabuğday'],
  ['Kinoa', 'kinoa'],
  ['Firik', 'firik'],
  // fruit
  ['Elma', 'elma'],
  ['Armut', 'armut'],
  ['Muz', 'muz'],
  ['Portakal', 'portakal'],
  ['Mandalina', 'mandalina'],
  ['Limon', 'limon'],
  ['Nar', 'nar(?!g)'],
  ['Üzüm', 'üzüm|pekmez'],
  ['Kiraz', 'kiraz'],
  ['Vişne', 'vişne'],
  ['Çilek', 'çilek'],
  ['Frambuaz', 'frambuaz|ahududu'],
  ['Böğürtlen', 'böğürtlen'],
  ['Dut', 'dut'],
  ['İncir', 'incir'],
  ['Kayısı', 'kayısı'],
  ['Şeftali', 'şeftali'],
  ['Erik', 'erik'],
  ['Kavun', 'kavun'],
  ['Karpuz', 'karpuz'],
  ['Kivi', 'kivi'],
  ['Ananas', 'ananas'],
  ['Mango', 'mango'],
  ['Hurma', 'hurma'],
  ['Ayva', 'ayva'],
  ['Papaya', 'papaya'],
  // nuts
  ['Ceviz', 'ceviz'],
  ['Fındık', 'fındık'],
  ['Badem', 'badem'],
  ['Kaju', 'kaju'],
  ['Chia', 'chia'],
  ['Kestane', 'kestane'],
];

const L = 'a-zçğıöşüâîû';
const COMPILED = RULES.map(([plant, p]) => ({ plant, re: new RegExp(`(^|[^${L}])(?:${p})`, 'g') }));

/** Packaged, branded or drink names that would count a plant they barely contain. */
const SKIP = new RegExp(`(^|[^${L}])(çay|kahve|latte|cappuccino|mocha|frappuccino|kola|cola|gazoz|soda|ice tea|fuse tea|lipton|enerji|red bull|monster|bira |şarap|rakı|votka|viski|likör|kokteyl|sigara|nargile|şerbet|aromalı|şekeri)`);

/** Dishes whose name doesn't say what's in them. */
const DISHES: [RegExp, string[]][] = [
  [/menemen/, ['Domates', 'Biber']],
  [/çoban salata|mevsim salata|gavurdağı/, ['Domates', 'Salatalık', 'Biber', 'Soğan']],
  [/türlü|ratatouille|şakşuka/, ['Patlıcan', 'Kabak', 'Biber', 'Domates']],
  [/tarhana/, ['Buğday', 'Domates', 'Biber']],
  [/kısır|tabule/, ['Bulgur', 'Maydanoz', 'Domates']],
  [/humus/, ['Nohut', 'Susam']],
  [/ezogelin/, ['Mercimek', 'Bulgur', 'Pirinç']],
  [/yaprak sarma|sarma/, ['Pirinç']],
  [/guacamole/, ['Avokado', 'Domates']],
  [/lahmacun/, ['Domates', 'Biber', 'Soğan']],
  [/acılı ezme|ezme salata/, ['Domates', 'Biber', 'Soğan']],
];

/** "Pilav" is rice unless the name says another grain. */
const OTHER_PILAV = /bulgur|şehriye|kinoa|firik|kuskus|arpa|karabuğday|freekeh/;

/** The plants in one meal name. */
export function plantsIn(name: string): string[] {
  let n = name.toLocaleLowerCase('tr-TR');
  if (SKIP.test(n)) return [];
  const out: string[] = [];
  if (/pilav/.test(n) && !OTHER_PILAV.test(n)) out.push('Pirinç');
  for (const [re, ps] of DISHES) if (re.test(n)) for (const p of ps) if (!out.includes(p)) out.push(p);
  for (const { plant, re } of COMPILED) {
    re.lastIndex = 0;
    if (re.test(n)) {
      if (!out.includes(plant)) out.push(plant);
      re.lastIndex = 0;
      n = n.replace(re, '$1 ');
    }
  }
  return out;
}

/** Distinct plants across these meal names, in the order first eaten. */
export function plantsOf(names: string[]) {
  const seen = new Set<string>();
  for (const name of names) for (const p of plantsIn(name)) seen.add(p);
  return [...seen];
}

/** A goal that's motivating without being a diet: 20 is a good week, 30 a great one. */
export const PLANT_GOAL = 20;
