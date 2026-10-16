import type { SQLiteDatabase } from 'expo-sqlite';
import * as db from './db';
import { FOOD_BY_ID, findFoodByName, normalizeName } from './foods';

/**
 * Emojis the user picked for foods that aren't in the list ("annemin kekiği" → 🧁).
 * Kept in settings as one JSON map (normalized name → emoji), so they travel with backups
 * and every past and future entry with that name shows the same emoji.
 */
const KEY = 'custom_emojis';
let map: Record<string, string> = {};

export async function loadCustomEmojis(sql: SQLiteDatabase) {
  try {
    const parsed = JSON.parse((await db.getSetting(sql, KEY)) ?? '{}');
    map = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    map = {};
  }
}

export function customEmoji(name: string): string | undefined {
  return map[normalizeName(name)];
}

export async function setCustomEmoji(sql: SQLiteDatabase, name: string, emoji: string) {
  map = { ...map, [normalizeName(name)]: emoji };
  await db.setSetting(sql, KEY, JSON.stringify(map));
}

/** True when the name matches nothing in the food list: only those get a user-chosen emoji. */
export function isCustomFood(name: string, foodId?: string | null) {
  return !(foodId && FOOD_BY_ID[foodId]) && !findFoodByName(name);
}
