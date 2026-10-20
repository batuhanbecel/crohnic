/**
 * Where the pain was, on the classic 3×3 map of the abdomen plus the area around the anus
 * (perianal disease is common in Crohn's) and "everywhere". Drawn the way you look down at your
 * own belly: your right side is on the right of the screen.
 * The lower right is where the end of the small intestine (terminal ileum) sits, the most
 * common place for Crohn's; doctors ask about it first.
 */
export type Area = { key: string; label: string; short: string; /** what lies there, in plain words */ organ: string };

/** Rows top to bottom; within a row, the user's left → right. */
export const GRID: Area[][] = [
  [
    { key: 'sol_ust', label: 'Sol üst', short: 'sol üst', organ: 'dalak kıvrımı, kalın bağırsak' },
    { key: 'ust_orta', label: 'Mide üstü', short: 'mide üstü', organ: 'mide' },
    { key: 'sag_ust', label: 'Sağ üst', short: 'sağ üst', organ: 'karaciğer kıvrımı, kalın bağırsak' },
  ],
  [
    { key: 'sol_yan', label: 'Sol yan', short: 'sol yan', organ: 'inen kalın bağırsak' },
    { key: 'gobek', label: 'Göbek çevresi', short: 'göbek', organ: 'ince bağırsak' },
    { key: 'sag_yan', label: 'Sağ yan', short: 'sağ yan', organ: 'çıkan kalın bağırsak' },
  ],
  [
    { key: 'sol_alt', label: 'Sol alt', short: 'sol alt', organ: 'sigmoid kolon' },
    { key: 'alt_orta', label: 'Kasık üstü', short: 'kasık üstü', organ: 'rektum ve mesane üstü' },
    { key: 'sag_alt', label: 'Sağ alt', short: 'sağ alt', organ: 'ince bağırsak sonu ve kör bağırsak' },
  ],
];

export const EXTRA: Area[] = [
  { key: 'makat', label: 'Makat çevresi', short: 'makat', organ: 'anüs ve çevresi' },
  { key: 'yaygin', label: 'Her yer, yaygın', short: 'yaygın', organ: 'karnın geneli' },
];

export const AREAS: Area[] = [...GRID.flat(), ...EXTRA];
const BY_KEY = new Map(AREAS.map((a) => [a.key, a]));

export function parseAreas(s: string | null | undefined) {
  return (s ?? '').split(',').filter((k) => BY_KEY.has(k));
}

export function areaShort(key: string) {
  return BY_KEY.get(key)?.short ?? key;
}

export function areaLabel(key: string) {
  return BY_KEY.get(key)?.label ?? key;
}

/** "sağ alt, göbek" */
export function areasText(s: string | null | undefined) {
  return parseAreas(s).map(areaShort).join(', ');
}

/** How often each area was marked (symptoms with pain only). */
export function areaCounts(symptoms: { pain: number; areas?: string | null }[]) {
  const out = new Map<string, number>();
  for (const s of symptoms) {
    if (!s.pain) continue;
    for (const k of parseAreas(s.areas)) out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}
