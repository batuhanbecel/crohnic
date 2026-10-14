import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_AI, type AiConfig, type Analysis } from './ai';
import * as db from './db';
import { setStricture } from './tolerance';
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
      setStricture((await db.getSetting(sql, 'stricture')) === '1');
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

  const changePhase = useCallback(
    async (p: Phase) => {
      await db.setPhase(sql, p);
      setPhaseState(p);
      setPhaseSince(Date.now());
    },
    [sql],
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
    () => ({ ready, name, phase, phaseSince, ai, onboarded, finishOnboarding, dataVersion, pending, setPending, changePhase, saveAi, saveName, bump }),
    [ready, name, phase, phaseSince, ai, onboarded, finishOnboarding, dataVersion, pending, changePhase, saveAi, saveName, bump],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
