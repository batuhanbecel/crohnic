/**
 * Results people with Crohn's are usually followed with, plus weight. No judgement is
 * made on the values: reference ranges differ between labs, the doctor reads them.
 */
export type LabKind = { key: string; label: string; unit: string; decimals: number; hint?: string };

export const LAB_KINDS: LabKind[] = [
  { key: 'kilo', label: 'Kilo', unit: 'kg', decimals: 1 },
  { key: 'kalprotektin', label: 'Kalprotektin (dışkı)', unit: 'µg/g', decimals: 0, hint: 'Bağırsaktaki iltihabın en iyi göstergelerinden' },
  { key: 'crp', label: 'CRP', unit: 'mg/L', decimals: 1, hint: 'Vücuttaki iltihap' },
  { key: 'sedim', label: 'Sedimantasyon', unit: 'mm/sa', decimals: 0 },
  { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', decimals: 1, hint: 'Kansızlık' },
  { key: 'ferritin', label: 'Ferritin', unit: 'ng/mL', decimals: 0, hint: 'Demir deposu' },
  { key: 'b12', label: 'B12 vitamini', unit: 'pg/mL', decimals: 0 },
  { key: 'd', label: 'D vitamini', unit: 'ng/mL', decimals: 1 },
  { key: 'albumin', label: 'Albümin', unit: 'g/dL', decimals: 1, hint: 'Beslenme durumu' },
];

export const LAB_BY_KEY: Record<string, LabKind> = Object.fromEntries(LAB_KINDS.map((k) => [k.key, k]));

export function fmtLab(kind: string, value: number) {
  const k = LAB_BY_KEY[kind];
  const n = value.toLocaleString('tr-TR', { maximumFractionDigits: k?.decimals ?? 1, minimumFractionDigits: 0 });
  return k ? `${n} ${k.unit}` : String(n);
}

/** Parses "12,5" or "12.5"; null when it isn't a positive number. */
export function parseLabValue(s: string) {
  const v = Number(s.replace(',', '.').trim());
  return Number.isFinite(v) && v >= 0 && s.trim() !== '' ? v : null;
}
