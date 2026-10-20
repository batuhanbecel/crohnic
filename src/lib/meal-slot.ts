import { dayKey } from './dates';

/**
 * Breakfast, lunch, dinner… named from the clock, the way people talk about their day.
 * A second sitting in the same window, well after the first (a coffee at 14:30 after lunch at
 * 12:00), is a snack, not a second lunch. A name picked by hand always wins.
 */
export type MealSlot = 'kahvalti' | 'ogle' | 'ara' | 'aksam' | 'gece';

export const SLOTS: MealSlot[] = ['kahvalti', 'ogle', 'ara', 'aksam', 'gece'];

export const SLOT_LABEL: Record<MealSlot, string> = {
  kahvalti: 'Kahvaltı',
  ogle: 'Öğle yemeği',
  ara: 'Ara öğün',
  aksam: 'Akşam yemeği',
  gece: 'Gece atıştırması',
};

/** For chips and tight rows. */
export const SLOT_SHORT: Record<MealSlot, string> = { kahvalti: 'Kahvaltı', ogle: 'Öğle', ara: 'Ara öğün', aksam: 'Akşam', gece: 'Gece' };

/** "Öğle yemeğinde yediğin …" */
export const SLOT_IN: Record<MealSlot, string> = { kahvalti: 'Kahvaltıda', ogle: 'Öğle yemeğinde', ara: 'Ara öğünde', aksam: 'Akşam yemeğinde', gece: 'Gece' };

export const SLOT_EMOJI: Record<MealSlot, string> = { kahvalti: '🍳', ogle: '🍲', ara: '🍎', aksam: '🍽️', gece: '🌙' };

export function isSlot(s: unknown): s is MealSlot {
  return typeof s === 'string' && (SLOTS as string[]).includes(s);
}

/** The window a time falls in, before looking at the rest of the day. */
export function slotAt(ms: number): MealSlot {
  const d = new Date(ms);
  const m = d.getHours() * 60 + d.getMinutes();
  if (m >= 4 * 60 && m < 11 * 60) return 'kahvalti';
  if (m >= 11 * 60 && m < 15 * 60) return 'ogle';
  if (m >= 15 * 60 && m < 17 * 60) return 'ara';
  // dinner at 22:30 is still dinner in Turkey; after 23:00 it's a late-night bite
  if (m >= 17 * 60 && m < 23 * 60) return 'aksam';
  return 'gece';
}

/** Same-window sittings this far apart are separate meals: the later one is a snack. */
const SNACK_GAP = 75 * 60000;

type Sitting = { key: string; eaten_at: number; slot?: string | null };

/**
 * Names for a set of sittings (any number of days). Returns key → slot.
 * Within a day and a main window, the first sitting takes the meal's name; one that comes
 * 75+ minutes after it becomes "Ara öğün"; one that comes sooner (dessert logged apart) shares it.
 */
export function slotsFor(sittings: Sitting[]): Map<string, MealSlot> {
  const out = new Map<string, MealSlot>();
  const sorted = [...sittings].sort((a, b) => a.eaten_at - b.eaten_at);
  const first = new Map<string, number>(); // day|window → time of the first sitting
  for (const s of sorted) {
    if (isSlot(s.slot)) {
      out.set(s.key, s.slot);
      if (s.slot !== 'ara' && s.slot !== 'gece') first.set(`${dayKey(s.eaten_at)}|${s.slot}`, first.get(`${dayKey(s.eaten_at)}|${s.slot}`) ?? s.eaten_at);
      continue;
    }
    const w = slotAt(s.eaten_at);
    if (w === 'ara' || w === 'gece') {
      out.set(s.key, w);
      continue;
    }
    const k = `${dayKey(s.eaten_at)}|${w}`;
    const f = first.get(k);
    if (f == null) {
      first.set(k, s.eaten_at);
      out.set(s.key, w);
    } else out.set(s.key, s.eaten_at - f >= SNACK_GAP ? 'ara' : w);
  }
  return out;
}

/** The name a new sitting at `at` would get next to the ones already logged that day. */
export function slotForNew(at: number, sameDay: Sitting[], picked?: string | null): MealSlot {
  if (isSlot(picked)) return picked;
  return slotsFor([...sameDay.filter((s) => s.eaten_at !== at || s.key !== '__new'), { key: '__new', eaten_at: at }]).get('__new') ?? slotAt(at);
}
