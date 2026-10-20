import type { SQLiteDatabase } from 'expo-sqlite';
import type { Phase, Verdict } from './foods';
import { isoDay } from './dates';

export type Reaction = 0 | 1 | 2; // 0 = normal geçti, 1 = biraz dokundu, 2 = kötü geçti (çok dokundu)

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
  /** 0 small, 1 normal, 2 large; null = not given (counts as normal) */
  portion?: number | null;
  /** breakfast/lunch… chosen by hand; null = worked out from the time */
  slot?: string | null;
};

export type SymptomLog = {
  id: number;
  at: number;
  pain: number;
  bloating: number;
  gas: number;
  fatigue: number;
  note: string | null;
  /** where the pain was: comma separated region keys (see pain-map) */
  areas?: string | null;
};

export type BowelLog = {
  id: number;
  at: number;
  bristol: number;
  blood: number;
  urgency: number;
  note: string | null;
};

const DB_VERSION = 7;

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

  if (v === 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        dose TEXT,
        kind TEXT NOT NULL DEFAULT 'daily',
        times TEXT NOT NULL DEFAULT '09:00',
        every_days INTEGER NOT NULL DEFAULT 1,
        start_day TEXT NOT NULL,
        remind INTEGER NOT NULL DEFAULT 1,
        active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS med_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        med_id INTEGER NOT NULL,
        due_at INTEGER NOT NULL,
        taken_at INTEGER,
        skipped INTEGER NOT NULL DEFAULT 0,
        UNIQUE(med_id, due_at)
      );
      CREATE INDEX IF NOT EXISTS med_logs_due ON med_logs(due_at);
      CREATE TABLE IF NOT EXISTS daily (
        day TEXT PRIMARY KEY,
        stress INTEGER,
        sleep_q INTEGER,
        sleep_h REAL,
        note TEXT,
        at INTEGER NOT NULL
      );
    `);
    v = 4;
  }

  if (v === 4) {
    // one-tap "how do you feel today" on the home screen (0 bad … 4 great)
    await db.execAsync(`ALTER TABLE daily ADD COLUMN feel INTEGER;`);
    v = 5;
  }

  if (v === 5) {
    // biologics: injection site rotation and how many doses are left at home;
    // daily: fever and fluids; labs: blood/stool results and weight for the doctor
    await db.execAsync(`
      ALTER TABLE meds ADD COLUMN injection INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE meds ADD COLUMN stock INTEGER;
      ALTER TABLE meds ADD COLUMN stock_alert INTEGER NOT NULL DEFAULT 2;
      ALTER TABLE med_logs ADD COLUMN site TEXT;
      ALTER TABLE daily ADD COLUMN temp REAL;
      ALTER TABLE daily ADD COLUMN water INTEGER;
      CREATE TABLE IF NOT EXISTS labs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at INTEGER NOT NULL,
        kind TEXT NOT NULL,
        value REAL NOT NULL,
        note TEXT
      );
      CREATE INDEX IF NOT EXISTS labs_at ON labs(at);
    `);
    v = 6;
  }

  if (v === 6) {
    // portion and meal name per sitting, where the pain was, the weekly activity score,
    // check-ups (appointments, labs, vaccines) and recipes kept for a while
    await db.execAsync(`
      ALTER TABLE meals ADD COLUMN portion INTEGER;
      ALTER TABLE meals ADD COLUMN slot TEXT;
      ALTER TABLE symptoms ADD COLUMN areas TEXT;
      CREATE TABLE IF NOT EXISTS hbi (
        week TEXT PRIMARY KEY,
        at INTEGER NOT NULL,
        wellbeing INTEGER NOT NULL,
        pain INTEGER NOT NULL,
        liquid REAL NOT NULL,
        complications TEXT,
        score REAL NOT NULL
      );
      CREATE TABLE IF NOT EXISTS checkups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        due_at INTEGER NOT NULL,
        timed INTEGER NOT NULL DEFAULT 0,
        every_days INTEGER NOT NULL DEFAULT 0,
        remind_days INTEGER NOT NULL DEFAULT 1,
        done_at INTEGER,
        note TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS checkups_due ON checkups(due_at);
      CREATE TABLE IF NOT EXISTS recipes (
        key TEXT PRIMARY KEY,
        json TEXT NOT NULL,
        at INTEGER NOT NULL
      );
    `);
    v = 7;
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

export async function listPhases(db: SQLiteDatabase) {
  return db.getAllAsync<{ phase: Phase; started_at: number }>('SELECT phase, started_at FROM phases ORDER BY started_at');
}

const END = Number.MAX_SAFE_INTEGER;

/** The phase that applies just before `t` (remisyon when nothing was recorded). */
async function phaseBefore(db: SQLiteDatabase, t: number): Promise<Phase> {
  const r = await db.getFirstAsync<{ phase: Phase }>('SELECT phase FROM phases WHERE started_at < ? ORDER BY started_at DESC LIMIT 1', t);
  return r?.phase ?? 'remisyon';
}

/** Drop changes that repeat the phase before them, so "since" is the start of the real period. */
async function collapsePhases(db: SQLiteDatabase) {
  await db.runAsync(
    `DELETE FROM phases WHERE id IN (
       SELECT p.id FROM phases p
       WHERE p.phase = (SELECT q.phase FROM phases q WHERE q.started_at < p.started_at ORDER BY q.started_at DESC LIMIT 1)
     )`,
  );
}

/**
 * Switch phase. A switch undone within 15 minutes was a slip or a try-out: the last change is
 * dropped instead of leaving a few-minutes-long period in the history (and in the report).
 */
export async function setPhase(db: SQLiteDatabase, phase: Phase) {
  const t = Date.now();
  await db.withTransactionAsync(async () => {
    const last = await db.getFirstAsync<{ id: number; started_at: number }>('SELECT id, started_at FROM phases ORDER BY started_at DESC LIMIT 1');
    if (last && t - last.started_at < 15 * 60000) {
      await db.runAsync('DELETE FROM phases WHERE id = ?', last.id);
      await db.runAsync('UPDATE meals SET phase = ? WHERE eaten_at >= ?', phase, last.started_at);
      if ((await phaseBefore(db, END)) === phase) return; // back where it was
    }
    await db.runAsync('INSERT INTO phases (phase, started_at) VALUES (?, ?)', phase, t);
  });
}

/**
 * Remove a period from the history (from … to, `to` null for the current one). The time it
 * covered falls back to the phase before it, and meals eaten in it are re-labelled to match.
 */
export async function deletePhasePeriod(db: SQLiteDatabase, from: number, to: number | null) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM phases WHERE started_at >= ? AND started_at < ?', from, to ?? END);
    await db.runAsync('UPDATE meals SET phase = ? WHERE eaten_at >= ? AND eaten_at < ?', await phaseBefore(db, from), from, to ?? END);
    await collapsePhases(db);
  });
}

// ---------- meals ----------
export async function addMeal(
  db: SQLiteDatabase,
  m: Omit<Meal, 'id' | 'reaction' | 'reaction_note' | 'group_id'> & { reaction?: Reaction | null; reaction_note?: string | null; group_id?: string | null },
) {
  const r = await db.runAsync(
    `INSERT INTO meals (name, food_id, tags, photo, eaten_at, ai_verdict, reaction, reaction_note, phase, group_id, portion, slot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    m.portion ?? null,
    m.slot ?? null,
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
  shared: { eaten_at: number; phase: Phase; reaction?: Reaction | null; portion?: number | null; slot?: string | null },
) {
  const group_id = items.length > 1 ? newGroupId() : null;
  const ids: number[] = [];
  await db.withTransactionAsync(async () => {
    for (const it of items) ids.push(await addMeal(db, { ...it, ...shared, group_id }));
  });
  return { group_id, ids };
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
    portion: base.portion ?? null,
    slot: base.slot ?? null,
  });
}

/** Portion and meal name apply to the whole sitting. */
export async function setGroupDetails(db: SQLiteDatabase, ids: number[], d: { portion?: number | null; slot?: string | null }) {
  await db.withTransactionAsync(async () => {
    for (const id of ids) {
      if (d.portion !== undefined) await db.runAsync('UPDATE meals SET portion = ? WHERE id = ?', d.portion, id);
      if (d.slot !== undefined) await db.runAsync('UPDATE meals SET slot = ? WHERE id = ?', d.slot, id);
    }
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
  portion: number | null;
  slot: string | null;
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
      portion: sorted[0].portion ?? null,
      slot: sorted[0].slot ?? null,
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
/** Tobacco is logged next to meals but isn't food: never asked about, never counted as a meal. */
export function isTobacco(m: Pick<Meal, 'tags'>) {
  return m.tags.split(',').includes('sigara');
}

export async function pendingReactions(db: SQLiteDatabase) {
  const cutoff = Date.now() - 90 * 60 * 1000;
  const since = Date.now() - 4 * 24 * 60 * 60 * 1000;
  const rows = await db.getAllAsync<Meal>(
    'SELECT * FROM meals WHERE reaction IS NULL AND eaten_at <= ? AND eaten_at >= ? ORDER BY eaten_at DESC LIMIT 40',
    cutoff,
    since,
  );
  return rows.filter((m) => !isTobacco(m));
}

// ---------- symptoms ----------
export async function addSymptom(db: SQLiteDatabase, s: Omit<SymptomLog, 'id'>) {
  await db.runAsync(
    'INSERT INTO symptoms (at, pain, bloating, gas, fatigue, note, areas) VALUES (?, ?, ?, ?, ?, ?, ?)',
    s.at,
    s.pain,
    s.bloating,
    s.gas,
    s.fatigue,
    s.note,
    s.areas ?? null,
  );
}

export async function getSymptom(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<SymptomLog>('SELECT * FROM symptoms WHERE id = ?', id);
}

export async function updateSymptom(db: SQLiteDatabase, s: SymptomLog) {
  await db.runAsync(
    'UPDATE symptoms SET at = ?, pain = ?, bloating = ?, gas = ?, fatigue = ?, note = ?, areas = ? WHERE id = ?',
    s.at, s.pain, s.bloating, s.gas, s.fatigue, s.note, s.areas ?? null, s.id,
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

export async function getBowel(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<BowelLog>('SELECT * FROM bowel WHERE id = ?', id);
}

export async function updateBowel(db: SQLiteDatabase, b: BowelLog) {
  await db.runAsync('UPDATE bowel SET at = ?, bristol = ?, blood = ?, urgency = ?, note = ? WHERE id = ?', b.at, b.bristol, b.blood, b.urgency, b.note, b.id);
}

export async function listBowel(db: SQLiteDatabase, limit = 200) {
  return db.getAllAsync<BowelLog>('SELECT * FROM bowel ORDER BY at DESC LIMIT ?', limit);
}

export async function deleteBowel(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM bowel WHERE id = ?', id);
}

// ---------- medications ----------
export type MedKind = 'daily' | 'interval';
export type Med = {
  id: number;
  name: string;
  dose: string | null;
  kind: MedKind;
  /** 'HH:MM' list, comma separated. Interval meds use the first one. */
  times: string;
  every_days: number;
  /** YYYY-MM-DD, first dose day (anchor for interval meds) */
  start_day: string;
  /** 0 = off, 1 = alarm + notification (default), 2 = notification only */
  remind: number;
  active: number;
  created_at: number;
  /** 1 = injection (site rotation is tracked) */
  injection?: number;
  /** doses left at home; null = not tracked */
  stock?: number | null;
  /** warn when stock is at or below this */
  stock_alert?: number;
};
export type MedLog = { id: number; med_id: number; due_at: number; taken_at: number | null; skipped: number; site?: string | null };

export async function listMeds(db: SQLiteDatabase, all = false) {
  return db.getAllAsync<Med>(`SELECT * FROM meds ${all ? '' : 'WHERE active = 1'} ORDER BY name`);
}

export async function getMed(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Med>('SELECT * FROM meds WHERE id = ?', id);
}

export async function saveMed(db: SQLiteDatabase, m: Omit<Med, 'id' | 'created_at' | 'active'> & { id?: number }) {
  const injection = m.injection ? 1 : 0;
  const stock = m.stock ?? null;
  const alert = m.stock_alert ?? 2;
  if (m.id) {
    await db.runAsync(
      'UPDATE meds SET name = ?, dose = ?, kind = ?, times = ?, every_days = ?, start_day = ?, remind = ?, injection = ?, stock = ?, stock_alert = ? WHERE id = ?',
      m.name, m.dose, m.kind, m.times, m.every_days, m.start_day, m.remind, injection, stock, alert, m.id,
    );
    return m.id;
  }
  const r = await db.runAsync(
    'INSERT INTO meds (name, dose, kind, times, every_days, start_day, remind, active, created_at, injection, stock, stock_alert) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)',
    m.name, m.dose, m.kind, m.times, m.every_days, m.start_day, m.remind, Date.now(), injection, stock, alert,
  );
  return r.lastInsertRowId;
}

/** Stop a medication but keep its history. */
export async function archiveMed(db: SQLiteDatabase, id: number) {
  await db.runAsync('UPDATE meds SET active = 0 WHERE id = ?', id);
}

export async function medLogsBetween(db: SQLiteDatabase, from: number, to: number) {
  return db.getAllAsync<MedLog>('SELECT * FROM med_logs WHERE due_at >= ? AND due_at < ?', from, to);
}

/** Mark a dose taken or skipped. A newly taken dose comes off the home stock. */
export async function logDose(db: SQLiteDatabase, medId: number, dueAt: number, taken: boolean, site?: string | null) {
  const prev = await db.getFirstAsync<MedLog>('SELECT * FROM med_logs WHERE med_id = ? AND due_at = ?', medId, dueAt);
  await db.runAsync(
    `INSERT INTO med_logs (med_id, due_at, taken_at, skipped, site) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(med_id, due_at) DO UPDATE SET taken_at = excluded.taken_at, skipped = excluded.skipped, site = excluded.site`,
    medId, dueAt, taken ? Date.now() : null, taken ? 0 : 1, taken ? site ?? null : null,
  );
  const wasTaken = prev?.taken_at != null;
  if (taken && !wasTaken) await db.runAsync('UPDATE meds SET stock = MAX(stock - 1, 0) WHERE id = ? AND stock IS NOT NULL', medId);
  if (!taken && wasTaken) await db.runAsync('UPDATE meds SET stock = stock + 1 WHERE id = ? AND stock IS NOT NULL', medId);
}

export async function undoDose(db: SQLiteDatabase, medId: number, dueAt: number) {
  const prev = await db.getFirstAsync<MedLog>('SELECT * FROM med_logs WHERE med_id = ? AND due_at = ?', medId, dueAt);
  await db.runAsync('DELETE FROM med_logs WHERE med_id = ? AND due_at = ?', medId, dueAt);
  if (prev?.taken_at != null) await db.runAsync('UPDATE meds SET stock = stock + 1 WHERE id = ? AND stock IS NOT NULL', medId);
}

/** Injection sites used for this med, newest first. */
export async function recentSites(db: SQLiteDatabase, medId: number, limit = 6) {
  const rows = await db.getAllAsync<{ site: string }>(
    'SELECT site FROM med_logs WHERE med_id = ? AND site IS NOT NULL ORDER BY taken_at DESC LIMIT ?',
    medId,
    limit,
  );
  return rows.map((r) => r.site);
}

export async function setStock(db: SQLiteDatabase, medId: number, stock: number | null) {
  await db.runAsync('UPDATE meds SET stock = ? WHERE id = ?', stock, medId);
}

/** Local days (YYYY-MM-DD) with at least one meal, toilet, symptom or check-in since `from`. */
export async function loggedDays(db: SQLiteDatabase, from: number) {
  const rows = await db.getAllAsync<{ at: number }>(
    `SELECT eaten_at AS at FROM meals WHERE eaten_at >= ?
     UNION ALL SELECT at FROM bowel WHERE at >= ?
     UNION ALL SELECT at FROM symptoms WHERE at >= ?`,
    from, from, from,
  );
  const days = new Set(rows.map((r) => isoDay(r.at)));
  const daily = await db.getAllAsync<{ day: string }>('SELECT day FROM daily WHERE day >= ?', isoDay(from));
  for (const d of daily) days.add(d.day);
  return days;
}

// ---------- lab results and weight ----------
export type Lab = { id: number; at: number; kind: string; value: number; note: string | null };

export async function listLabs(db: SQLiteDatabase, kind?: string) {
  return kind
    ? db.getAllAsync<Lab>('SELECT * FROM labs WHERE kind = ? ORDER BY at DESC', kind)
    : db.getAllAsync<Lab>('SELECT * FROM labs ORDER BY at DESC');
}

export async function labsBetween(db: SQLiteDatabase, from: number, to: number) {
  return db.getAllAsync<Lab>('SELECT * FROM labs WHERE at >= ? AND at < ? ORDER BY at', from, to);
}

export async function addLab(db: SQLiteDatabase, l: Omit<Lab, 'id'>) {
  await db.runAsync('INSERT INTO labs (at, kind, value, note) VALUES (?, ?, ?, ?)', l.at, l.kind, l.value, l.note);
}

export async function deleteLab(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM labs WHERE id = ?', id);
}

// ---------- daily check-in (stress, sleep) ----------
export type Daily = {
  day: string;
  stress: number | null;
  sleep_q: number | null;
  sleep_h: number | null;
  note: string | null;
  at: number;
  feel?: number | null;
  /** °C, only when the user had a fever */
  temp?: number | null;
  /** glasses of water/fluids */
  water?: number | null;
};

export async function getDaily(db: SQLiteDatabase, day: string) {
  return db.getFirstAsync<Daily>('SELECT * FROM daily WHERE day = ?', day);
}

export async function saveDaily(db: SQLiteDatabase, d: Omit<Daily, 'at'>) {
  await db.runAsync(
    `INSERT INTO daily (day, stress, sleep_q, sleep_h, note, temp, water, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET stress = excluded.stress, sleep_q = excluded.sleep_q, sleep_h = excluded.sleep_h, note = excluded.note,
       temp = excluded.temp, water = excluded.water, at = excluded.at`,
    d.day, d.stress, d.sleep_q, d.sleep_h, d.note, d.temp ?? null, d.water ?? null, Date.now(),
  );
}

/** Set only today's feeling; keeps stress/sleep if they were already filled in. */
export async function setFeel(db: SQLiteDatabase, day: string, feel: number | null) {
  await db.runAsync(
    `INSERT INTO daily (day, feel, at) VALUES (?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET feel = excluded.feel`,
    day, feel, Date.now(),
  );
}

/** Add (or take back) glasses of water for a day; never below zero. Keeps the rest of the check-in. */
export async function addWater(db: SQLiteDatabase, day: string, delta: number) {
  await db.runAsync(
    `INSERT INTO daily (day, water, at) VALUES (?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET water = MAX(0, COALESCE(water, 0) + ?)`,
    day, Math.max(0, delta), Date.now(), delta,
  );
}

export async function listDaily(db: SQLiteDatabase, limit = 400) {
  return db.getAllAsync<Daily>('SELECT * FROM daily ORDER BY day DESC LIMIT ?', limit);
}

// ---------- weekly activity score (Harvey-Bradshaw based) ----------
export type HbiRow = { week: string; at: number; wellbeing: number; pain: number; liquid: number; complications: string | null; score: number };

export async function getHbi(db: SQLiteDatabase, week: string) {
  return db.getFirstAsync<HbiRow>('SELECT * FROM hbi WHERE week = ?', week);
}

export async function listHbi(db: SQLiteDatabase, limit = 26) {
  return db.getAllAsync<HbiRow>('SELECT * FROM hbi ORDER BY week DESC LIMIT ?', limit);
}

export async function saveHbi(db: SQLiteDatabase, h: Omit<HbiRow, 'at'>) {
  await db.runAsync(
    `INSERT INTO hbi (week, at, wellbeing, pain, liquid, complications, score) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(week) DO UPDATE SET at = excluded.at, wellbeing = excluded.wellbeing, pain = excluded.pain,
       liquid = excluded.liquid, complications = excluded.complications, score = excluded.score`,
    h.week, Date.now(), h.wellbeing, h.pain, h.liquid, h.complications, h.score,
  );
}

export async function deleteHbi(db: SQLiteDatabase, week: string) {
  await db.runAsync('DELETE FROM hbi WHERE week = ?', week);
}

// ---------- check-ups: appointments, labs, vaccines ----------
export type Checkup = {
  id: number;
  kind: string;
  title: string;
  due_at: number;
  /** 1 = has a time of day (an appointment), 0 = just a day */
  timed: number;
  /** repeat every n days once done; 0 = once */
  every_days: number;
  /** remind this many days before (0 = on the day) */
  remind_days: number;
  done_at: number | null;
  note: string | null;
  created_at: number;
};

export async function listCheckups(db: SQLiteDatabase) {
  return db.getAllAsync<Checkup>('SELECT * FROM checkups ORDER BY done_at IS NOT NULL, due_at');
}

export async function getCheckup(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Checkup>('SELECT * FROM checkups WHERE id = ?', id);
}

export async function saveCheckup(db: SQLiteDatabase, c: Omit<Checkup, 'id' | 'created_at' | 'done_at'> & { id?: number }) {
  if (c.id) {
    await db.runAsync(
      'UPDATE checkups SET kind = ?, title = ?, due_at = ?, timed = ?, every_days = ?, remind_days = ?, note = ? WHERE id = ?',
      c.kind, c.title, c.due_at, c.timed, c.every_days, c.remind_days, c.note, c.id,
    );
    return c.id;
  }
  const r = await db.runAsync(
    'INSERT INTO checkups (kind, title, due_at, timed, every_days, remind_days, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    c.kind, c.title, c.due_at, c.timed, c.every_days, c.remind_days, c.note, Date.now(),
  );
  return r.lastInsertRowId;
}

/** Mark done; a repeating one comes back after its interval (counted from today, not the old date). */
export async function completeCheckup(db: SQLiteDatabase, id: number, at = Date.now()) {
  const c = await getCheckup(db, id);
  if (!c) return null;
  let next: number | null = null;
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE checkups SET done_at = ? WHERE id = ?', at, id);
    if (c.every_days > 0) {
      const d = new Date(at);
      const due = new Date(d.getFullYear(), d.getMonth(), d.getDate() + c.every_days, c.timed ? new Date(c.due_at).getHours() : 10, c.timed ? new Date(c.due_at).getMinutes() : 0).getTime();
      const r = await db.runAsync(
        'INSERT INTO checkups (kind, title, due_at, timed, every_days, remind_days, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        c.kind, c.title, due, c.timed, c.every_days, c.remind_days, null, Date.now(),
      );
      next = r.lastInsertRowId;
    }
  });
  return next;
}

export async function deleteCheckup(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM checkups WHERE id = ?', id);
}

// ---------- recipes (AI answers kept for a while; not personal data, not backed up) ----------
export async function getRecipe(db: SQLiteDatabase, key: string, maxAgeMs: number) {
  const r = await db.getFirstAsync<{ json: string; at: number }>('SELECT json, at FROM recipes WHERE key = ?', key);
  if (!r || Date.now() - r.at > maxAgeMs) return null;
  try {
    return JSON.parse(r.json) as unknown;
  } catch {
    return null;
  }
}

export async function saveRecipe(db: SQLiteDatabase, key: string, value: unknown) {
  await db.runAsync('INSERT OR REPLACE INTO recipes (key, json, at) VALUES (?, ?, ?)', key, JSON.stringify(value), Date.now());
}

// ---------- backup ----------
const BACKUP_TABLES = ['meals', 'symptoms', 'bowel', 'phases', 'meds', 'med_logs', 'daily', 'labs', 'hbi', 'checkups', 'settings'] as const;
/** "Tüm verilerimi sil": every personal record and setting. Only the anonymous install id stays (it rate-limits photo analysis). */
export async function wipeAll(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    for (const t of BACKUP_TABLES) await db.runAsync(t === 'settings' ? "DELETE FROM settings WHERE key <> 'install_id'" : `DELETE FROM ${t}`);
    await db.runAsync('DELETE FROM recipes');
  });
}

/** Settings that belong to this phone/build and are never restored. */
const LOCAL_SETTINGS = ['ai_url', 'ai_token', 'onboarded', 'last_backup', 'install_id', 'last_auto_backup'];

export async function exportAll(db: SQLiteDatabase) {
  const out: Record<string, unknown> = { app: 'Crohnic', format: 2, exported_at: new Date().toISOString() };
  for (const t of BACKUP_TABLES) {
    const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${t}`);
    out[t] = t === 'settings' ? rows.filter((r) => !LOCAL_SETTINGS.includes(String(r.key))) : rows;
  }
  return out;
}

export type BackupSummary = { meals: number; symptoms: number; bowel: number; meds: number; exported_at: string | null };

/** Throws a readable error when the file isn't a Crohnic backup. */
export function readBackup(text: string): { data: Record<string, unknown>; summary: BackupSummary } {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Dosya okunamadı. Crohnic yedeği olduğundan emin misin?');
  }
  if (data?.app !== 'Crohnic' || !Array.isArray(data.meals)) throw new Error('Bu bir Crohnic yedeği değil.');
  const n = (k: string) => (Array.isArray(data[k]) ? data[k].length : 0);
  return {
    data,
    summary: { meals: n('meals'), symptoms: n('symptoms'), bowel: n('bowel'), meds: n('meds'), exported_at: data.exported_at ?? null },
  };
}

/** Replace everything on this phone with the backup's contents. */
export async function importAll(db: SQLiteDatabase, data: Record<string, unknown>) {
  await db.withTransactionAsync(async () => {
    for (const t of BACKUP_TABLES) {
      const rows = Array.isArray(data[t]) ? (data[t] as Record<string, unknown>[]) : [];
      const cols = (await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${t})`)).map((c) => c.name);
      if (t === 'settings') {
        await db.runAsync(`DELETE FROM settings WHERE key NOT IN (${LOCAL_SETTINGS.map(() => '?').join(',')})`, ...LOCAL_SETTINGS);
      } else {
        await db.runAsync(`DELETE FROM ${t}`);
      }
      for (const r of rows) {
        if (t === 'settings' && LOCAL_SETTINGS.includes(String(r.key))) continue;
        const keys = Object.keys(r).filter((k) => cols.includes(k));
        if (!keys.length) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO ${t} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          ...keys.map((k) => (r[k] ?? null) as string | number | null),
        );
      }
    }
  });
}

export async function countMeals(db: SQLiteDatabase) {
  const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM meals');
  return r?.n ?? 0;
}

/** Everything in a time window, oldest first (report, insights). */
export async function rangeData(db: SQLiteDatabase, from: number, to: number) {
  const [meals, symptoms, bowel, phases, logs, meds, daily, labs, hbi] = await Promise.all([
    db.getAllAsync<Meal>('SELECT * FROM meals WHERE eaten_at >= ? AND eaten_at < ? ORDER BY eaten_at', from, to),
    db.getAllAsync<SymptomLog>('SELECT * FROM symptoms WHERE at >= ? AND at < ? ORDER BY at', from, to),
    db.getAllAsync<BowelLog>('SELECT * FROM bowel WHERE at >= ? AND at < ? ORDER BY at', from, to),
    db.getAllAsync<{ phase: Phase; started_at: number }>('SELECT phase, started_at FROM phases ORDER BY started_at'),
    medLogsBetween(db, from, to),
    listMeds(db, true),
    db.getAllAsync<Daily>('SELECT * FROM daily ORDER BY day'),
    db.getAllAsync<Lab>('SELECT * FROM labs ORDER BY at'),
    db.getAllAsync<HbiRow>('SELECT * FROM hbi ORDER BY week'),
  ]);
  return { meals, symptoms, bowel, phases, logs, meds, daily, labs, hbi };
}

/** Meals eaten in the window before a symptom (default 2–24 h), grouped into sittings. */
export async function mealsBefore(db: SQLiteDatabase, at: number, fromH = 24, toH = 2) {
  const rows = await db.getAllAsync<Meal>(
    'SELECT * FROM meals WHERE eaten_at >= ? AND eaten_at <= ? ORDER BY eaten_at DESC',
    at - fromH * 3600000,
    at - toH * 3600000,
  );
  return groupMeals(rows);
}

export async function setMealTime(db: SQLiteDatabase, id: number, at: number) {
  await db.runAsync('UPDATE meals SET eaten_at = ? WHERE id = ?', at, id);
}
