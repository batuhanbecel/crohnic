import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { Mascot, type Mood } from '../components/Mascot';
import { Button, Card, Icon, Row, Screen, T, Tap, VERDICT_UI, VerdictBadge } from '../components/ui';
import type { MealAnalysis, MenuAnalysis } from '../lib/ai';
import { useApp } from '../lib/app-state';
import * as db from '../lib/db';
import { TAGS, findFoodByName, normalizeName, type Tag, type Verdict } from '../lib/foods';
import { savePhoto } from '../lib/photos';
import { palette, radius, surface, type } from '../lib/theme';
import { statsByName, type PersonalStat } from '../lib/tolerance';

const MOOD: Record<Verdict, Mood> = { iyi: 'cheer', dikkat: 'ok', riskli: 'worried' };

export default function Result() {
  const app = useApp();
  const p = app.pending;
  if (!p) {
    return (
      <Screen header={false}>
        <T v="h2">Gösterecek bir sonuç yok</T>
        <Button title="Geri dön" onPress={() => router.back()} />
      </Screen>
    );
  }
  return p.analysis.kind === 'menu' ? <MenuResult a={p.analysis} /> : <MealResult a={p.analysis} photo={p.photoUri} foodId={p.foodId ?? null} />;
}

function usePersonal() {
  const sql = useSQLiteContext();
  const [stats, setStats] = useState<Map<string, PersonalStat & { name: string }>>(new Map());
  useEffect(() => {
    db.allRatedMeals(sql).then((m) => setStats(statsByName(m)));
  }, [sql]);
  return (name: string, foodId?: string | null) => {
    const known = foodId ?? findFoodByName(name)?.id;
    return (known ? stats.get(known) : undefined) ?? stats.get(normalizeName(name));
  };
}

function useSaveMeal() {
  const sql = useSQLiteContext();
  const app = useApp();
  return async (o: { name: string; tags: Tag[]; verdict: Verdict; photo?: string | null; foodId?: string | null }) => {
    let photo: string | null = null;
    try {
      photo = o.photo ? savePhoto(o.photo) : null;
    } catch {
      photo = null;
    }
    const id = await db.addMeal(sql, {
      name: o.name,
      food_id: o.foodId ?? findFoodByName(o.name)?.id ?? null,
      tags: o.tags.join(','),
      photo,
      eaten_at: Date.now(),
      ai_verdict: o.verdict,
      phase: app.phase,
    });
    app.bump();
    return id;
  };
}

function PersonalNote({ stat }: { stat?: PersonalStat }) {
  if (!stat || stat.n === 0) return null;
  const parts = [stat.good ? `${stat.good} kez iyi geldi` : null, stat.mild ? `${stat.mild} kez biraz dokundu` : null, stat.bad ? `${stat.bad} kez çok dokundu` : null]
    .filter(Boolean)
    .join(', ');
  return (
    <Card tint={palette.periSoft} style={{ gap: 4 }}>
      <T v="caption" color={palette.peri}>
        Senin kayıtların
      </T>
      <T v="callout" style={type.medium}>
        Bunu {stat.n} kez yemişsin: {parts}.
      </T>
    </Card>
  );
}

function Bullets({ items, color, icon }: { items: string[]; color: string; icon?: 'lightbulb' }) {
  return (
    <View style={{ gap: 10 }}>
      {items.map((r, i) => (
        <Row key={i} gap={10} style={{ alignItems: 'flex-start' }}>
          {icon ? (
            <View style={{ marginTop: 2 }}>
              <Icon name="lightbulb.fill" size={14} color={palette.apricot} fallback="💡" />
            </View>
          ) : (
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, marginTop: 8 }} />
          )}
          <T v="callout" style={{ flex: 1 }}>
            {r}
          </T>
        </Row>
      ))}
    </View>
  );
}

function MealResult({ a, photo, foodId }: { a: MealAnalysis; photo: string | null; foodId: string | null }) {
  const save = useSaveMeal();
  const personal = usePersonal();
  const [saving, setSaving] = useState(false);
  const u = VERDICT_UI[a.verdict];

  const onSave = async () => {
    setSaving(true);
    try {
      await save({ name: a.dish, tags: a.tags, verdict: a.verdict, photo, foodId });
      router.back();
      setTimeout(() => Alert.alert('Kaydedildi', 'Birkaç saat sonra ana sayfada nasıl geçtiğini soracağım.'), 350);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen header={false}>
      {photo ? <Image source={{ uri: photo }} style={{ width: '100%', aspectRatio: 1.25, borderRadius: radius.xl, backgroundColor: surface.well }} /> : null}

      <Card style={{ gap: 12 }}>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 8 }}>
            <VerdictBadge verdict={a.verdict} />
            <T v="title">{a.dish}</T>
          </View>
          <Mascot mood={MOOD[a.verdict]} size={80} />
        </Row>
        {a.headline ? (
          <View style={{ backgroundColor: u.bg, borderRadius: radius.md, padding: 14 }}>
            <T v="callout" style={type.medium}>
              {a.headline}
            </T>
          </View>
        ) : null}
      </Card>

      <PersonalNote stat={personal(a.dish, foodId)} />

      {a.reasons.length ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Neden</T>
          <Bullets items={a.reasons} color={u.fg} />
        </Card>
      ) : null}

      {a.tips.length ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Yiyeceksen</T>
          <Bullets items={a.tips} color={u.fg} icon="lightbulb" />
        </Card>
      ) : null}

      {a.swap ? (
        <Card tint={palette.goodSoft} style={{ gap: 4 }}>
          <T v="caption" color={palette.good}>
            Daha hafif bir seçenek
          </T>
          <T v="callout" style={type.medium}>
            {a.swap}
          </T>
        </Card>
      ) : null}

      {a.ingredients.length || a.tags.length ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">İçinde gördüklerim</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {a.ingredients.map((x) => (
              <Pill key={x} label={x} />
            ))}
            {a.tags
              .filter((t) => t !== 'hafif')
              .map((t) => (
                <Pill key={t} label={TAGS[t].label} warn />
              ))}
          </View>
        </Card>
      ) : null}

      <View style={{ gap: 8, marginTop: 4 }}>
        <Button title="Yedim, kaydet" icon="checkmark" onPress={onSave} loading={saving} />
        <Button title="Yemedim" kind="plain" onPress={() => router.back()} />
      </View>
      <Disclaimer />
    </Screen>
  );
}

function MenuResult({ a }: { a: MenuAnalysis }) {
  const sql = useSQLiteContext();
  const app = useApp();
  const personal = usePersonal();
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const groups = useMemo(
    () =>
      (['iyi', 'dikkat', 'riskli'] as Verdict[])
        .map((v) => ({ v, items: a.dishes.filter((d) => d.verdict === v) }))
        .filter((g) => g.items.length),
    [a.dishes],
  );

  const toggle = (idx: number) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  const saveOrder = async () => {
    const dishes = a.dishes.filter((_, i) => picked.has(i));
    if (!dishes.length) return;
    setSaving(true);
    try {
      await db.addMealGroup(
        sql,
        dishes.map((d) => ({
          name: d.name,
          food_id: findFoodByName(d.name)?.id ?? null,
          tags: d.tags.join(','),
          photo: null,
          ai_verdict: d.verdict,
        })),
        { eaten_at: Date.now(), phase: app.phase },
      );
      app.bump();
      router.back();
      setTimeout(() => Alert.alert('Kaydedildi', 'Afiyet olsun. Birkaç saat sonra nasıl geçtiğini soracağım.'), 350);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen header={false}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
        <Mascot mood="happy" size={80} />
        <View style={{ flex: 1, gap: 4 }}>
          <T v="caption" color={palette.peri}>
            {a.dishes.length} yemeğe baktım
          </T>
          <T v="callout" style={type.medium}>
            {a.headline}
          </T>
        </View>
      </Card>

      {a.best_pick ? (
        <Card tint={palette.goodSoft} style={{ gap: 4 }}>
          <T v="caption" color={palette.good}>
            Ben olsam bunu söylerdim
          </T>
          <T v="h2">{a.best_pick}</T>
          {a.tip ? <T v="small">{a.tip}</T> : null}
        </Card>
      ) : null}

      {groups.map((g) => (
        <View key={g.v} style={{ gap: 8 }}>
          <Row gap={8} style={{ marginTop: 6, paddingHorizontal: 2 }}>
            <Icon name={VERDICT_UI[g.v].icon} color={VERDICT_UI[g.v].fg} fallback={VERDICT_UI[g.v].dot} />
            <T v="h2">{VERDICT_UI[g.v].label}</T>
            <T v="small" color={palette.inkSoft}>
              {g.items.length}
            </T>
          </Row>
          {g.items.map((d) => {
            const idx = a.dishes.indexOf(d);
            const on = picked.has(idx);
            const stt = personal(d.name);
            return (
              <Tap key={`${d.name}-${idx}`} onPress={() => toggle(idx)}>
                <Card style={[{ gap: 4, padding: 14 }, on ? { borderColor: palette.ink, borderWidth: 2 } : null]}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: VERDICT_UI[d.verdict].fg }} />
                    <T v="h3" style={{ flex: 1 }}>
                      {d.name}
                    </T>
                    <Icon name={on ? 'checkmark.circle.fill' : 'circle'} size={22} color={on ? palette.ink : palette.inkFaint} fallback={on ? '✓' : '○'} />
                  </Row>
                  {d.reason ? (
                    <T v="small" color={palette.inkSoft}>
                      {d.reason}
                    </T>
                  ) : null}
                  {stt?.n ? (
                    <T v="caption" color={palette.peri}>
                      {stt.n} kez yemişsin, {stt.bad + stt.mild ? `${stt.bad + stt.mild} kez dokunmuş` : 'hep iyi gelmiş'}
                    </T>
                  ) : null}
                </Card>
              </Tap>
            );
          })}
        </View>
      ))}
      <T v="small" color={palette.inkSoft} style={{ textAlign: 'center' }}>
        Sipariş ettiklerini işaretle, tek öğün olarak kaydedeyim.
      </T>
      <Button
        title={picked.size ? `${picked.size} yemeği kaydet` : 'Yemek seç'}
        icon="checkmark"
        onPress={saveOrder}
        loading={saving}
        disabled={!picked.size}
      />
      <Disclaimer />
    </Screen>
  );
}

function Pill({ label, warn }: { label: string; warn?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: warn ? palette.warnSoft : surface.well }}>
      <T v="small" color={warn ? palette.warn : palette.ink} style={type.medium}>
        {label}
      </T>
    </View>
  );
}

function Disclaimer() {
  return (
    <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', lineHeight: 17, fontWeight: '400' }}>
      Genel bilgiye ve senin kayıtlarına dayanır, tıbbi tavsiye değildir.
    </T>
  );
}
