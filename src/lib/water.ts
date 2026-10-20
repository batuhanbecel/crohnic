import type { BowelLog, Daily } from './db';
import type { Phase } from './foods';

/** One glass ≈ 200 ml. */
export const GLASS_ML = 200;

export function litres(glasses: number) {
  return `${((glasses * GLASS_ML) / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} L`;
}

/** Watery stools today (Bristol 6–7): each one costs fluid and salt. */
export function wateryCount(bowel: Pick<BowelLog, 'bristol'>[]) {
  return bowel.filter((b) => b.bristol >= 6).length;
}

/**
 * Today's goal in glasses. About 2 L on an ordinary day; more in a flare, with an ileostomy
 * (the colon no longer takes water back), for every watery stool and with a fever.
 */
export function waterTarget(o: { phase: Phase; watery: number; fever?: boolean; stoma?: boolean }) {
  let t = o.phase === 'atak' ? 10 : 8;
  if (o.stoma) t += 2;
  t += Math.min(6, o.watery);
  if (o.fever) t += 2;
  return t;
}

export type WaterNote = { tone: 'good' | 'warn' | 'bad'; text: string };

/** What to say under the counter; null when there's nothing worth saying. */
export function waterNote(o: { glasses: number; target: number; watery: number; hour: number; stoma?: boolean }): WaterNote | null {
  const left = Math.max(0, o.target - o.glasses);
  if (o.watery >= 3) {
    return {
      tone: left ? 'bad' : 'warn',
      text: `Bugün ${o.watery} sulu dışkı: su ve tuz kaybediyorsun.${left ? ` ${left} bardak daha iç.` : ''} Ayran, tuzlu çorba ya da eczaneden ORS kaybı daha iyi karşılar. Başın dönüyorsa, idrarın azaldıysa ya da koyulaştıysa doktoruna haber ver.`,
    };
  }
  if (o.watery > 0 && left) return { tone: 'warn', text: `Sulu dışkı sıvı kaybettirir; bugün hedefini ${o.target} bardağa çıkardım.` };
  if (o.stoma && left && o.hour >= 14) return { tone: 'warn', text: 'İleostomide sıvı kaybı fazladır; yudum yudum, gün boyuna yay.' };
  if (!left && o.glasses > 0) return { tone: 'good', text: 'Bugünkü hedef tamam.' };
  if (o.hour >= 18 && o.glasses < o.target / 2) return { tone: 'warn', text: `Akşam oldu, hedefin yarısına gelmedin. Yatmadan önce ${Math.min(left, 3)} bardak daha.` };
  return null;
}

/** Average glasses a day over the days that have a count. */
export function averageWater(days: Pick<Daily, 'water'>[]) {
  const v = days.map((d) => d.water).filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
