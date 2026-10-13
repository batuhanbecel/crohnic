import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { Phase, Tag, Verdict } from './foods';
import { isTag } from './foods';

export type Mode = 'meal' | 'menu' | 'food';

export type MealAnalysis = {
  kind: 'meal';
  dish: string;
  ingredients: string[];
  tags: Tag[];
  verdict: Verdict;
  headline: string;
  reasons: string[];
  tips: string[];
  swap: string | null;
};

export type MenuAnalysis = {
  kind: 'menu';
  headline: string;
  dishes: { name: string; verdict: Verdict; reason: string; tags: Tag[] }[];
  best_pick: string | null;
  tip: string | null;
};

export type Analysis = MealAnalysis | MenuAnalysis;

export type AnalyzeInput = {
  mode: Mode;
  imageBase64?: string;
  foodName?: string;
  phase: Phase;
  history: Record<string, string[]>;
  recent?: string;
};

export type AiConfig = { url: string; token: string };

/** Shrink the photo before upload: 1024px wide JPEG keeps it well under the server body limit. */
export async function prepareImage(uri: string, width = 1024): Promise<{ uri: string; base64: string }> {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width });
  const ref = await ctx.renderAsync();
  const res = await ref.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  if (!res.base64) throw new Error('Fotoğraf hazırlanamadı.');
  return { uri: res.uri, base64: res.base64 };
}

const VERDICTS: Verdict[] = ['iyi', 'dikkat', 'riskli'];
const asVerdict = (v: unknown): Verdict => (VERDICTS.includes(v as Verdict) ? (v as Verdict) : 'dikkat');
const asTags = (v: unknown): Tag[] => (Array.isArray(v) ? v.filter((t): t is Tag => typeof t === 'string' && isTag(t)) : []);
const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);

function sanitize(raw: any): Analysis {
  if (raw?.kind === 'menu') {
    return {
      kind: 'menu',
      headline: String(raw.headline ?? 'Menüye baktım!'),
      dishes: (Array.isArray(raw.dishes) ? raw.dishes : []).map((d: any) => ({
        name: String(d?.name ?? '?'),
        verdict: asVerdict(d?.verdict),
        reason: String(d?.reason ?? ''),
        tags: asTags(d?.tags),
      })),
      best_pick: raw.best_pick ? String(raw.best_pick) : null,
      tip: raw.tip ? String(raw.tip) : null,
    };
  }
  return {
    kind: 'meal',
    dish: String(raw?.dish ?? 'Bilinmeyen yemek'),
    ingredients: asStrings(raw?.ingredients),
    tags: asTags(raw?.tags),
    verdict: asVerdict(raw?.verdict),
    headline: String(raw?.headline ?? ''),
    reasons: asStrings(raw?.reasons),
    tips: asStrings(raw?.tips),
    swap: raw?.swap ? String(raw.swap) : null,
  };
}

export async function analyze(cfg: AiConfig, input: AnalyzeInput): Promise<Analysis> {
  const base = cfg.url.replace(/\/+$/, '');
  const endpoint = base.endsWith('/api/analyze') ? base : `${base}/api/analyze`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-crohnic-token': cfg.token },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401) throw new Error('Sunucu şifresi yanlış. Ayarlar’dan kontrol et.');
      throw new Error(json?.error ?? `Sunucu hata verdi (${res.status}).`);
    }
    return sanitize(json);
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('Cevap çok uzun sürdü, bir daha dener misin?');
    if (e instanceof TypeError) throw new Error('Sunucuya ulaşamadım. İnternetini ve sunucu adresini kontrol et.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
