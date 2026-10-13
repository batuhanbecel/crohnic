import type { SQLiteDatabase } from 'expo-sqlite';
import type { Phase, Verdict } from './foods';

export type Reaction = 0 | 1 | 2; // 0 = iyi geldi, 1 = biraz dokundu, 2 = çok dokundu

export type Meal = {
  id: number;
  name: string;
  food_id: string | null;
  tags: string; // comma separated Tag list
  photo: string | null; // file name inside the photos folder
  eaten_at: number;
  ai_verdict: Verdict | null;
  reaction: Reaction | null;
  reaction_note: string | null;
  phase: Phase;
  /** Items eaten together share a group id (one sitting = one group). */
  group_id: string | null;
};

export type SymptomLog = {
  id: number;
  at: number;
  pain: number;
  bloating: number;
  gas: number;
  fatigue: number;
  note: string | null;
};

export type BowelLog = {
  id: number;
  at: number;
  bristol: number;
  blood: number;
  urgency: number;
  note: string | null;
};

const DB_VERSION = 3;

export async function migrate(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let v = row?.user_version ?? 0;
  if (v >= DB_VERSION) return;

  if (v === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        food_id TEXT,
        tags TEXT NOT NULL DEFAULT '',
        photo TEXT,
        eaten_at INTEGER NOT NULL,
        ai_verdict TEXT,
        reaction INTEGER,
        reaction_note TEXT,
        phase TEXT NOT NULL DEFAULT 'remisyon'
      );
      CREATE INDEX IF NOT EXISTS meals_eaten_at ON meals(eaten_at);
      CREATE TABLE IF NOT EXISTS symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at INTEGER NOT NULL,
        pain INTEGER NOT NULL DEFAULT 0,
        bloating INTEGER NOT NULL DEFAULT 0,
        gas INTEGER NOT NULL DEFAULT 0,
        fatigue INTEGER NOT NULL DEFAULT 0,
        note TEXT
      );
      CREATE TABLE IF NOT EXISTS bowel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at INTEGER NOT NULL,
        bristol INTEGER NOT NULL,
        blood INTEGER NOT NULL DEFAULT 0,
        urgency INTEGER NOT NULL DEFAULT 0,
        note TEXT
      );
      CREATE TABLE IF NOT EXISTS phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phase TEXT NOT NULL,
        started_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    v = 1;
  }

  if (v === 1) {
    await db.execAsync(`
      ALTER TABLE meals ADD COLUMN group_id TEXT;
      CREATE INDEX IF NOT EXISTS meals_group ON meals(group_id);
    `);
    v = 2;
  }

  if (v === 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS food_images (
        food_id TEXT PRIMARY KEY,
        url TEXT,
        checked_at INTEGER NOT NULL
      );
    `);
    v = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}

// ---------- settings ----------
export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const r = await db.getFirstAsync<{ value: string | null }>('SELECT value FROM settings WHERE key = ?', key);
  return r?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string | null) {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

// ---------- phase ----------
export async function getPhase(db: SQLiteDatabase): Promise<{ phase: Phase; since: number | null }> {
  const r = await db.getFirstAsync<{ phase: Phase; started_at: number }>(
    'SELECT phase, started_at FROM phases ORDER BY started_at DESC LIMIT 1',
  );
  return r ? { phase: r.phase, since: r.started_at } : { phase: 'remisyon', since: null };
}

export async function setPhase(db: SQLiteDatabase, phase: Phase) {
  await db.runAsync('INSERT INTO phases (phase, started_at) VALUES (?, ?)', phase, Date.now());
}

// ---------- meals ----------
export async function addMeal(
  db: SQLiteDatabase,
  m: Omit<Meal, 'id' | 'reaction' | 'reaction_note' | 'group_id'> & { reaction?: Reaction | null; reaction_note?: string | null; group_id?: string | null },
) {
  const r = await db.runAsync(
    `INSERT INTO meals (name, food_id, tags, photo, eaten_at, ai_verdict, reaction, reaction_note, phase, group_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    m.name,
    m.food_id,
    m.tags,
    m.photo,
    m.eaten_at,
    m.ai_verdict,
    m.reaction ?? null,
    m.reaction_note ?? null,
    m.phase,
    m.group_id ?? null,
  );
  return r.lastInsertRowId;
}

export function newGroupId() {
  return `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Save several foods eaten in one sitting. Returns the group id. */
export async function addMealGroup(
  db: SQLiteDatabase,
  items: Omit<Meal, 'id' | 'reaction' | 'reaction_note' | 'group_id' | 'eaten_at' | 'phase'>[],
  shared: { eaten_at: number; phase: Phase; reaction?: Reaction | null },
) {
  const group_id = items.length > 1 ? newGroupId() : null;
  await db.withTransactionAsync(async () => {
    for (const it of items) await addMeal(db, { ...it, ...shared, group_id });
  });
  return group_id;
}

/** All rows that belong to the same sitting as this meal (or just the meal). */
export async function getMealGroup(db: SQLiteDatabase, id: number) {
  const m = await getMeal(db, id);
  if (!m) return [];
  if (!m.group_id) return [m];
  return db.getAllAsync<Meal>('SELECT * FROM meals WHERE group_id = ? ORDER BY id', m.group_id);
}

export async function setGroupReaction(db: SQLiteDatabase, ids: number[], reaction: Reaction | null, note: string | null) {
  await db.withTransactionAsync(async () => {
    for (const id of ids) await setReaction(db, id, reaction, note);
  });
}

export async function setGroupTime(db: SQLiteDatabase, ids: number[], at: number) {
  await db.withTransactionAsync(async () => {
    for (const id of ids) await db.runAsync('UPDATE meals SET eaten_at = ? WHERE id = ?', at, id);
  });
}

/** Add one food to an existing sitting; a single meal becomes a group on the first addition. */
export async function addToMeal(
  db: SQLiteDatabase,
  baseId: number,
  item: Pick<Meal, 'name' | 'food_id' | 'tags' | 'ai_verdict'>,
) {
  const base = await getMeal(db, baseId);
  if (!base) return;
  let gid = base.group_id;
  if (!gid) {
    gid = newGroupId();
    await db.runAsync('UPDATE meals SET group_id = ? WHERE id = ?', gid, base.id);
  }
  await addMeal(db, {
    ...item,
    photo: null,
    eaten_at: base.eaten_at,
    phase: base.phase,
    reaction: base.reaction,
    reaction_note: base.reaction_note,
    group_id: gid,
  });
}

export async function setGroupPhase(db: SQLiteDatabase, items: { id: number; verdict: Verdict | null }[], phase: Phase) {
  await db.withTransactionAsync(async () => {
    for (const it of items) await db.runAsync('UPDATE meals SET phase = ?, ai_verdict = ? WHERE id = ?', phase, it.verdict, it.id);
  });
}

export type MealGroup = {
  key: string;
  ids: number[];
  items: Meal[];
  name: string;
  eaten_at: number;
  photo: string | null;
  phase: Phase;
  reaction: Reaction | null;
  ai_verdict: Verdict | null;
};

const VRANK: Record<Verdict, number> = { iyi: 0, dikkat: 1, riskli: 2 };

/** Collapse rows into sittings, keeping the input order (newest first). */
export function groupMeals(meals: Meal[]): MealGroup[] {
  const map = new Map<string, Meal[]>();
  for (const m of meals) {
    const k = m.group_id ?? `m${m.id}`;
    map.set(k, [...(map.get(k) ?? []), m]);
  }
  return [...map.entries()].map(([key, items]) => {
    const sorted = [...items].sort((a, b) => a.id - b.id);
    const verdicts = sorted.map((x) => x.ai_verdict).filter((v): v is Verdict => !!v);
    const reactions = sorted.map((x) => x.reaction);
    return {
      key,
      ids: sorted.map((x) => x.id),
      items: sorted,
      name: sorted.map((x) => x.name).join(', '),
      eaten_at: sorted[0].eaten_at,
      photo: sorted.find((x) => x.photo)?.photo ?? null,
      phase: sorted[0].phase,
      reaction: reactions.every((r) => r === reactions[0]) ? reactions[0] : null,
      ai_verdict: verdicts.length ? verdicts.reduce((a, b) => (VRANK[b] > VRANK[a] ? b : a)) : null,
    };
  });
}

export async function setReaction(db: SQLiteDatabase, id: number, reaction: Reaction | null, note: string | null) {
  await db.runAsync('UPDATE meals SET reaction = ?, reaction_note = ? WHERE id = ?', reaction, note, id);
}

export async function getMeal(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Meal>('SELECT * FROM meals WHERE id = ?', id);
}

export async function deleteMeal(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM meals WHERE id = ?', id);
}

export async function listMeals(db: SQLiteDatabase, limit = 200) {
  return db.getAllAsync<Meal>('SELECT * FROM meals ORDER BY eaten_at DESC LIMIT ?', limit);
}

export async function allRatedMeals(db: SQLiteDatabase) {
  return db.getAllAsync<Meal>('SELECT * FROM meals WHERE reaction IS NOT NULL ORDER BY eaten_at DESC');
}

/** Meals eaten at least 90 minutes ago that still don't have a reaction. */
export async function pendingReactions(db: SQLiteDatabase) {
  const cutoff = Date.now() - 90 * 60 * 1000;
  const since = Date.now() - 4 * 24 * 60 * 60 * 1000;
  return db.getAllAsync<Meal>(
    'SELECT * FROM meals WHERE reaction IS NULL AND eaten_at <= ? AND eaten_at >= ? ORDER BY eaten_at DESC LIMIT 40',
    cutoff,
    since,
  );
}

// ---------- symptoms ----------
export async function addSymptom(db: SQLiteDatabase, s: Omit<SymptomLog, 'id'>) {
  await db.runAsync(
    'INSERT INTO symptoms (at, pain, bloating, gas, fatigue, note) VALUES (?, ?, ?, ?, ?, ?)',
    s.at,
    s.pain,
    s.bloating,
    s.gas,
    s.fatigue,
    s.note,
  );
}

export async function listSymptoms(db: SQLiteDatabase, limit = 200) {
  return db.getAllAsync<SymptomLog>('SELECT * FROM symptoms ORDER BY at DESC LIMIT ?', limit);
}

export async function deleteSymptom(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM symptoms WHERE id = ?', id);
}

// ---------- bowel ----------
export async function addBowel(db: SQLiteDatabase, b: Omit<BowelLog, 'id'>) {
  await db.runAsync(
    'INSERT INTO bowel (at, bristol, blood, urgency, note) VALUES (?, ?, ?, ?, ?)',
    b.at,
    b.bristol,
    b.blood,
    b.urgency,
    b.note,
  );
}

export async function listBowel(db: SQLiteDatabase, limit = 200) {
  return db.getAllAsync<BowelLog>('SELECT * FROM bowel ORDER BY at DESC LIMIT ?', limit);
}

export async function deleteBowel(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM bowel WHERE id = ?', id);
}

// ---------- export ----------
export async function exportAll(db: SQLiteDatabase) {
  const [meals, symptoms, bowel, phases] = await Promise.all([
    db.getAllAsync('SELECT * FROM meals ORDER BY eaten_at'),
    db.getAllAsync('SELECT * FROM symptoms ORDER BY at'),
    db.getAllAsync('SELECT * FROM bowel ORDER BY at'),
    db.getAllAsync('SELECT * FROM phases ORDER BY started_at'),
  ]);
  return { app: 'Crohnic', exported_at: new Date().toISOString(), meals, symptoms, bowel, phases };
}

export async function setMealTime(db: SQLiteDatabase, id: number, at: number) {
  await db.runAsync('UPDATE meals SET eaten_at = ? WHERE id = ?', at, id);
}
