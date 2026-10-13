import type { SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import type { Food } from './foods';

/**
 * One photo per food, looked up on Wikipedia / Wikimedia Commons the first
 * time a food is shown, then cached in SQLite. '' means "nothing found".
 */

const UA = 'Crohnic/1.0 (https://github.com/batuhanbecel/crohnic)';
const THUMB = 330; // a standard Wikimedia thumbnail width (non-standard sizes get throttled)
const RETRY_EMPTY_MS = 30 * 24 * 3600 * 1000;
const RETRY_ERROR_MS = 6 * 3600 * 1000;
const MAX_PARALLEL = 4;

const memory = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const failedAt = new Map<string, number>();

// ---- tiny queue so a fast scroll doesn't fire 100 requests at once
let running = 0;
const waiting: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL) await new Promise<void>((r) => waiting.push(r));
  running++;
  try {
    return await fn();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

async function getJson(url: string): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { 'Api-User-Agent': UA, 'User-Agent': UA }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const qs = (o: Record<string, string | number>) =>
  Object.entries(o)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

const fold = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşüâîû]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' })[c] ?? c);

/** "Pilav (pirinç) / bulgur" -> "Pilav" */
function cleanName(name: string) {
  return name.split('/')[0].replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
}

const STOP = new Set(['ve', 'ile', 'li', 'lu', 'su', 'az', 'sade', 'tam', 'ev', 'yapimi']);
function words(s: string) {
  return fold(s)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** True when the candidate title shares at least half of the query's words (prefix match handles Turkish suffixes). */
function looksRight(query: string, title: string) {
  const q = words(query);
  if (!q.length) return false;
  const t = words(title);
  const hit = q.filter((w) => t.some((x) => x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5)))).length;
  return hit >= Math.ceil(q.length / 2);
}

function firstThumb(data: any, check?: (title: string) => boolean): string {
  const pages: any[] = Object.values(data?.query?.pages ?? {});
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const p of pages) {
    const src: string | undefined = p?.thumbnail?.source ?? p?.imageinfo?.[0]?.thumburl;
    if (!src || /\.svg/i.test(src)) continue;
    if (check && !check(String(p.title ?? ''))) continue;
    return src;
  }
  return '';
}

async function lookup(name: string): Promise<string> {
  const q = cleanName(name);
  if (!q) return '';
  const wiki = 'https://tr.wikipedia.org/w/api.php?';
  const base = { action: 'query', format: 'json', formatversion: 1, redirects: 1 };

  // 1) exact Turkish Wikipedia article
  const exact = await getJson(wiki + qs({ ...base, prop: 'pageimages', piprop: 'thumbnail', pithumbsize: THUMB, titles: q }));
  let url = firstThumb(exact);
  if (url) return url;

  // 2) Turkish Wikipedia search, first matching article with a picture
  const search = await getJson(
    wiki +
      qs({ ...base, generator: 'search', gsrsearch: q, gsrlimit: 4, gsrnamespace: 0, prop: 'pageimages', piprop: 'thumbnail', pithumbsize: THUMB }),
  );
  url = firstThumb(search, (t) => looksRight(q, t));
  if (url) return url;

  // 3) Wikimedia Commons file search
  const commons = await getJson(
    'https://commons.wikimedia.org/w/api.php?' +
      qs({
        action: 'query',
        format: 'json',
        formatversion: 1,
        generator: 'search',
        gsrsearch: `${q} filetype:bitmap`,
        gsrnamespace: 6,
        gsrlimit: 4,
        prop: 'imageinfo',
        iiprop: 'url',
        iiurlwidth: THUMB,
      }),
  );
  return firstThumb(commons, (t) => looksRight(q, t.replace(/^File:|^Dosya:/, '')));
}

export async function foodImageUrl(db: SQLiteDatabase, food: Food): Promise<string> {
  const hit = memory.get(food.id);
  if (hit !== undefined) return hit;
  const running = inflight.get(food.id);
  if (running) return running;

  const p = (async () => {
    const row = await db.getFirstAsync<{ url: string | null; checked_at: number }>(
      'SELECT url, checked_at FROM food_images WHERE food_id = ?',
      food.id,
    );
    if (row && (row.url || Date.now() - row.checked_at < RETRY_EMPTY_MS)) return row.url ?? '';
    if (Date.now() - (failedAt.get(food.id) ?? 0) < RETRY_ERROR_MS) return '';

    try {
      const url = await slot(() => lookup(food.name));
      await db.runAsync(
        'INSERT OR REPLACE INTO food_images (food_id, url, checked_at) VALUES (?, ?, ?)',
        food.id,
        url,
        Date.now(),
      );
      return url;
    } catch {
      // offline or rate-limited: keep the emoji for now, try again later
      failedAt.set(food.id, Date.now());
      return '';
    }
  })();

  inflight.set(food.id, p);
  try {
    const url = await p;
    memory.set(food.id, url);
    return url;
  } finally {
    inflight.delete(food.id);
  }
}

/** Forget a photo that failed to load so it is looked up again next month. */
export async function markBroken(db: SQLiteDatabase, foodId: string) {
  memory.set(foodId, '');
  await db.runAsync('INSERT OR REPLACE INTO food_images (food_id, url, checked_at) VALUES (?, ?, ?)', foodId, '', Date.now());
}

export function useFoodImage(db: SQLiteDatabase, food: Food | null | undefined) {
  const id = food?.id ?? '';
  const [found, setFound] = useState<{ id: string; url: string }>(() => ({ id, url: memory.get(id) ?? '' }));
  useEffect(() => {
    if (!food) return;
    let alive = true;
    foodImageUrl(db, food).then((url) => {
      if (alive) setFound({ id: food.id, url });
    });
    return () => {
      alive = false;
    };
  }, [db, food]);
  return found.id === id ? found.url : memory.get(id) ?? '';
}
