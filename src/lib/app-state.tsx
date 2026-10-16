import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_AI, newInstallId, setInstallId, type AiConfig, type Analysis } from './ai';
import * as db from './db';
import { loadCustomEmojis } from './custom-emoji';
import { setLactose, setStoma, setStricture, setTagHistory } from './tolerance';
import type { Phase } from './foods';

type PendingResult = {
  analysis: Analysis;
  photoUri: string | null; // temp uri of the analysed photo
  foodId?: string | null;
};

type AppState = {
  ready: boolean;
  name: string;
  phase: Phase;
  phaseSince: number | null;
  ai: AiConfig | null;
  /** false only for a fresh install that hasn't seen the intro */
  onboarded: boolean;
  finishOnboarding: () => Promise<void>;
  dataVersion: number;
  pending: PendingResult | null;
  setPending: (p: PendingResult | null) => void;
  changePhase: (p: Phase) => Promise<void>;
  /** re-read the current phase after the history was edited */
  reloadPhase: () => Promise<void>;
  saveAi: (cfg: AiConfig | null) => Promise<void>;
  saveName: (n: string) => Promise<void>;
  bump: () => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const sql = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [phase, setPhaseState] = useState<Phase>('remisyon');
  const [phaseSince, setPhaseSince] = useState<number | null>(null);
  const [ai, setAi] = useState<AiConfig | null>(null);
  const [onboarded, setOnboarded] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const [pending, setPending] = useState<PendingResult | null>(null);

  useEffect(() => {
    (async () => {
      let install = await db.getSetting(sql, 'install_id');
      if (!install) {
        install = newInstallId();
        await db.setSetting(sql, 'install_id', install);
      }
      setInstallId(install);
      setStricture((await db.getSetting(sql, 'stricture')) === '1');
      setStoma((await db.getSetting(sql, 'stoma')) === '1');
      setLactose((await db.getSetting(sql, 'lactose')) === '1');
      setTagHistory(await db.allRatedMeals(sql));
      await loadCustomEmojis(sql);
      const [p, url, token, n, seen, mealCount] = await Promise.all([
        db.getPhase(sql),
        db.getSetting(sql, 'ai_url'),
        db.getSetting(sql, 'ai_token'),
        db.getSetting(sql, 'name'),
        db.getSetting(sql, 'onboarded'),
        db.countMeals(sql),
      ]);
      // people who already use the app skip the intro
      if (!seen && mealCount > 0) await db.setSetting(sql, 'onboarded', '1');
      setOnboarded(!!seen || mealCount > 0);
      setPhaseState(p.phase);
      setPhaseSince(p.since);
      // Built-in server wins when the build carries a token; manual entry is only a fallback (e.g. Expo Go).
      setAi(DEFAULT_AI ?? (url ? { url, token: token ?? '' } : null));
      setName(n ?? '');
      setReady(true);
    })();
  }, [sql]);

  // keep the per-tag history behind the general verdicts in step with new ratings
  useEffect(() => {
    if (dataVersion) db.allRatedMeals(sql).then(setTagHistory);
    // a restored backup brings its own emoji choices
    if (dataVersion) loadCustomEmojis(sql);
  }, [sql, dataVersion]);

  const reloadPhase = useCallback(async () => {
    const p = await db.getPhase(sql);
    setPhaseState(p.phase);
    setPhaseSince(p.since);
  }, [sql]);

  const changePhase = useCallback(
    async (p: Phase) => {
      await db.setPhase(sql, p);
      await reloadPhase();
      setDataVersion((v) => v + 1);
    },
    [sql, reloadPhase],
  );

  const saveAi = useCallback(
    async (cfg: AiConfig | null) => {
      await db.setSetting(sql, 'ai_url', cfg?.url.trim() || null);
      await db.setSetting(sql, 'ai_token', cfg?.token.trim() || null);
      setAi(DEFAULT_AI ?? (cfg?.url.trim() ? { url: cfg.url.trim(), token: cfg.token.trim() } : null));
    },
    [sql],
  );

  const saveName = useCallback(
    async (n: string) => {
      await db.setSetting(sql, 'name', n.trim());
      setName(n.trim());
    },
    [sql],
  );

  const bump = useCallback(() => setDataVersion((v) => v + 1), []);

  const finishOnboarding = useCallback(async () => {
    await db.setSetting(sql, 'onboarded', '1');
    const [p, n] = await Promise.all([db.getPhase(sql), db.getSetting(sql, 'name')]);
    setPhaseState(p.phase);
    setPhaseSince(p.since);
    setName(n ?? '');
    setOnboarded(true);
  }, [sql]);

  const value = useMemo(
    () => ({ ready, name, phase, phaseSince, ai, onboarded, finishOnboarding, dataVersion, pending, setPending, changePhase, reloadPhase, saveAi, saveName, bump }),
    [ready, name, phase, phaseSince, ai, onboarded, finishOnboarding, dataVersion, pending, changePhase, reloadPhase, saveAi, saveName, bump],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
