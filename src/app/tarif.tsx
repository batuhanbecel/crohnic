import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Mascot } from '../components/Mascot';
import { ThinkingOverlay } from '../components/ThinkingOverlay';
import { Button, Card, Icon, Row, Screen, T } from '../components/ui';
import { fetchRecipe, type Recipe } from '../lib/ai';
import { useApp } from '../lib/app-state';
import * as db from '../lib/db';
import { FOOD_BY_ID } from '../lib/foods';
import { palette, radius } from '../lib/theme';
import { assessContext } from '../lib/tolerance';
import { buildRecent } from '../lib/use-analyze';

const KEEP = 30 * 86400000;

/**
 * "Nasıl yaparım?": a home recipe for a food, adapted by Kıvırcık to the phase, personal
 * factors and the medicines switched on. Kept for 30 days per food and situation, so opening it
 * again costs nothing; "Yeniden yaz" asks for a fresh one.
 */
export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const food = FOOD_BY_ID[id ?? ''];
  const sql = useSQLiteContext();
  const app = useApp();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctx = assessContext(app.phase);
  const key = food ? `${food.id}|${app.phase}|${ctx.extras.join(',')}` : '';

  /** Ask Kıvırcık for a new one (also the "Yeniden yaz" button). */
  const write = useCallback(async () => {
    if (!food || !app.ai) return;
    setError(null);
    setBusy(true);
    try {
      const r = await fetchRecipe(app.ai, { foodName: food.name, phase: app.phase, history: {}, recent: (await buildRecent(sql)) || undefined });
      await db.saveRecipe(sql, key, r);
      setRecipe(r);
    } catch (e: any) {
      setError(e?.message ?? 'Tarif alınamadı.');
    } finally {
      setBusy(false);
    }
  }, [sql, key, food, app.ai, app.phase]);

  // a kept one opens instantly; otherwise write it
  useEffect(() => {
    if (!food || !app.ai) return;
    db.getRecipe(sql, key, KEEP).then((cached) => (cached ? setRecipe(cached as Recipe) : write()));
  }, [sql, key, food, app.ai, write]);

  if (!food) return null;

  return (
    <Screen title={recipe?.title ?? food.name}>
      <ThinkingOverlay mode={busy ? 'recipe' : null} />
      {!app.ai ? (
        <Card tint={palette.apricotSoft} style={{ gap: 4 }}>
          <T v="h3">Tarif için Kıvırcık’ın sunucusu gerekli</T>
          <T v="small">Ayarlar’daki fotoğraf analizi bağlıyken çalışır.</T>
        </Card>
      ) : null}
      {error ? (
        <Card tint={palette.badSoft} style={{ gap: 10 }}>
          <T v="callout">{error}</T>
          <Button title="Tekrar dene" kind="glass" icon="arrow.clockwise" onPress={write} />
        </Card>
      ) : null}
      {recipe ? (
        <>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {[recipe.time, recipe.servings, `${ctx.phase}${ctx.extras.length ? ` · ${ctx.extras.join(' · ')}` : ''}`].filter(Boolean).map((x) => (
              <View key={x} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: palette.lettuceSoft }}>
                <T v="caption" color={palette.lettuceDeep} style={{ fontWeight: '700' }}>
                  {x}
                </T>
              </View>
            ))}
          </Row>

          {recipe.changes.length ? (
            <Card tint={palette.lettuceSoft} style={{ gap: 8 }}>
              <Row gap={8}>
                <Mascot mood="mutlu" size={40} />
                <T v="h3" style={{ flex: 1 }}>
                  Sana göre uyarladım
                </T>
              </Row>
              {recipe.changes.map((c) => (
                <Row key={c} gap={8} style={{ alignItems: 'flex-start' }}>
                  <Icon name="checkmark" size={12} color={palette.lettuceDeep} fallback="✓" />
                  <T v="small" style={{ flex: 1 }}>
                    {c}
                  </T>
                </Row>
              ))}
            </Card>
          ) : null}

          <Card style={{ gap: 8 }}>
            <T v="h3">Malzemeler</T>
            {recipe.ingredients.map((x, i) => (
              <Row key={`${x.item}-${i}`} gap={10} style={{ paddingVertical: 4, borderTopWidth: i ? 1 : 0, borderTopColor: palette.hairline }}>
                <T v="callout" style={{ flex: 1 }}>
                  {x.item}
                </T>
                <T v="callout" color={palette.inkSoft}>
                  {x.amount}
                </T>
              </Row>
            ))}
          </Card>

          <Card style={{ gap: 12 }}>
            <T v="h3">Yapılışı</T>
            {recipe.steps.map((step, i) => (
              <Row key={i} gap={12} style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: palette.lettuce, alignItems: 'center', justifyContent: 'center' }}>
                  <T v="caption" color="#FFFFFF" style={{ fontWeight: '800' }}>
                    {String(i + 1)}
                  </T>
                </View>
                <T v="callout" style={{ flex: 1, lineHeight: 22 }}>
                  {step}
                </T>
              </Row>
            ))}
          </Card>

          {recipe.note ? (
            <Card style={{ gap: 4 }}>
              <T v="caption" color={palette.inkSoft}>
                Not
              </T>
              <T v="small">{recipe.note}</T>
            </Card>
          ) : null}

          <Row gap={8}>
            <Button title="Yeniden yaz" kind="glass" icon="arrow.clockwise" onPress={write} style={{ flex: 1 }} />
            <Button title="Yemeğe dön" kind="glass" icon="chevron.left" onPress={() => router.back()} style={{ flex: 1 }} />
          </Row>
          <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', fontWeight: '400' }}>
            Genel bir tariftir. Diyetisyeninin önerdiği her zaman önce gelir.
          </T>
        </>
      ) : null}
    </Screen>
  );
}
