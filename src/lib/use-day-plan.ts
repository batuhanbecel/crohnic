import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from './app-state';
import { isoDay, now, startOfDay } from './dates';
import * as db from './db';
import { FOOD_BY_ID, findFoodByName } from './foods';
import { planDay, slotForHour, type SlotKey, type SlotPlan } from './suggest';

const ROLLS_KEY = 'oneri-rolls';
type Rolls = Partial<Record<SlotKey, number>>;

/**
 * Today's suggestion plan for the current phase. Reloads on focus and after any change
 * (a new rating can drop a food or boost it). "Başka öner" taps are saved for the day, so
 * the Sor card and the full screen show the same plan.
 */
export function useDayPlan() {
  const sql = useSQLiteContext();
  const app = useApp();
  const day = isoDay(now());
  const [data, setData] = useState<{ rated: db.Meal[]; recent: Set<string> } | null>(null);
  const [rolls, setRolls] = useState<Rolls>({});

  const load = useCallback(() => {
    let alive = true;
    Promise.all([db.allRatedMeals(sql), db.listMeals(sql, 80), db.getSetting(sql, ROLLS_KEY)]).then(([rated, latest, saved]) => {
      if (!alive) return;
      const since = startOfDay(now()) - 2 * 86400000;
      const recent = new Set<string>();
      for (const m of latest) {
        if (m.eaten_at < since) continue;
        const f = (m.food_id && FOOD_BY_ID[m.food_id]) || findFoodByName(m.name);
        if (f) recent.add(f.id);
      }
      setData({ rated, recent });
      try {
        const r = saved ? (JSON.parse(saved) as { day: string; rolls: Rolls }) : null;
        setRolls(r && r.day === isoDay(now()) ? r.rolls : {});
      } catch {
        setRolls({});
      }
    });
    return () => {
      alive = false;
    };
  }, [sql]);

  // on focus (the other screen may have re-rolled) and after any change to the data
  useFocusEffect(load);
  useEffect(load, [load, app.dataVersion]);

  const plan: SlotPlan[] | null = useMemo(
    () => (data ? planDay({ day, phase: app.phase, rated: data.rated, recent: data.recent, rolls }) : null),
    // medsKey: suggestions follow the medicines too (no sweets pushed on cortisone)
    [data, day, app.phase, rolls, app.medsKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const reroll = useCallback(
    (slot: SlotKey) => {
      setRolls((prev) => {
        const next = { ...prev, [slot]: (prev[slot] ?? 0) + 1 };
        db.setSetting(sql, ROLLS_KEY, JSON.stringify({ day, rolls: next })).catch(() => {});
        return next;
      });
    },
    [sql, day],
  );

  return { plan, reroll, current: slotForHour(new Date(now()).getHours()), phase: app.phase };
}
