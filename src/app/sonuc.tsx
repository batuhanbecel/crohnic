import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { Mascot, type Mood } from '../components/Mascot';
import { Button, Card, Row, Screen, T, Tap, VERDICT_UI, VerdictBadge } from '../components/ui';
import type { MealAnalysis, MenuAnalysis } from '../lib/ai';
import { useApp } from '../lib/app-state';
import * as db from '../lib/db';
import { TAGS, findFoodByName, normalizeName, type Tag, type Verdict } from '../lib/foods';
import { savePhoto } from '../lib/photos';
import { colors, fonts, radius } from '../lib/theme';
import { statsByName, type PersonalStat } from '../lib/tolerance';

const MOOD: Record<Verdict, Mood> = { iyi: 'cheer', dikkat: 'ok', riskli: 'worried' };

export default function Result() {
  const app = useApp();
  const p = app.pending;
  if (!p) {
    return (
      <Screen padTop={false}>
        <T v="h2">Burada bir şey yok</T>
        <Button title="Geri dön" onPress={() => router.back()} />
      </Screen>
    );
  }
  return p.analysis.kind === 'menu' ? (
    <MenuResult a={p.analysis} />
  ) : (
    <MealResult a={p.analysis} photo={p.photoUri} foodId={p.foodId ?? null} />
  );
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
    <Card tint={colors.lavSoft} style={{ gap: 4 }}>
      <T v="tiny" color={colors.lavender}>
        SENİN KAYITLARIN
      </T>
      <T v="body" style={{ fontFamily: fonts.bold }}>
        Bunu {stat.n} kez yemişsin: {parts}.
      </T>
    </Card>
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
      setTimeout(() => Alert.alert('Afiyet olsun! 🍽️', 'Kaydettim. Birkaç saat sonra ana sayfada “nasıl geldi?” diye soracağım.'), 350);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padTop={false}>
      {photo ? <Image source={{ uri: photo }} style={{ width: '100%', aspectRatio: 1.25, borderRadius: radius.lg, backgroundColor: colors.line }} /> : null}

      <Card style={{ gap: 12 }} tint={u.bg}>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 8 }}>
            <VerdictBadge verdict={a.verdict} />
            <T v="h1">{a.dish}</T>
          </View>
          <Mascot mood={MOOD[a.verdict]} size={84} />
        </Row>
        {a.headline ? (
          <View style={{ backgroundColor: '#fff', borderRadius: radius.md, padding: 14 }}>
            <T v="body" style={{ fontFamily: fonts.bold }}>
              “{a.headline}”
            </T>
          </View>
        ) : null}
      </Card>

      <PersonalNote stat={personal(a.dish, foodId)} />

      {a.reasons.length ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Neden?</T>
          {a.reasons.map((r, i) => (
            <Row key={i} gap={10} style={{ alignItems: 'flex-start' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: u.fg, marginTop: 8 }} />
              <T v="body" style={{ flex: 1 }}>
                {r}
              </T>
            </Row>
          ))}
        </Card>
      ) : null}

      {a.tips.length ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Yiyeceksen</T>
          {a.tips.map((r, i) => (
            <Row key={i} gap={10} style={{ alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 16, marginTop: 2 }}>💡</Text>
              <T v="body" style={{ flex: 1 }}>
                {r}
              </T>
            </Row>
          ))}
        </Card>
      ) : null}

      {a.swap ? (
        <Card tint={colors.mintSoft} style={{ gap: 4 }}>
          <T v="tiny" color={colors.mint}>
            DAHA NAZİK ALTERNATİF
          </T>
          <T v="body" style={{ fontFamily: fonts.bold }}>
            {a.swap}
          </T>
        </Card>
      ) : null}

      {a.ingredients.length || a.tags.length ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Gördüklerim</T>
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

      <View style={{ gap: 10, marginTop: 4 }}>
        <Button title="Yedim, kaydet" icon="checkmark" onPress={onSave} loading={saving} color={colors.mint} />
        <Button title="Yemedim, vazgeç" kind="ghost" onPress={() => router.back()} />
      </View>
      <Disclaimer />
    </Screen>
  );
}

function MenuResult({ a }: { a: MenuAnalysis }) {
  const save = useSaveMeal();
  const personal = usePersonal();
  const groups = useMemo(
    () =>
      (['iyi', 'dikkat', 'riskli'] as Verdict[])
        .map((v) => ({ v, items: a.dishes.filter((d) => d.verdict === v) }))
        .filter((g) => g.items.length),
    [a.dishes],
  );

  const pick = (d: MenuAnalysis['dishes'][number]) => {
    Alert.alert(d.name, 'Bunu mu söyledin? Kaydedeyim, sonra nasıl geldiğini sorarım.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Bunu yedim',
        onPress: async () => {
          await save({ name: d.name, tags: d.tags, verdict: d.verdict });
          Alert.alert('Kaydettim! 🍽️', 'Afiyet olsun.');
        },
      },
    ]);
  };

  return (
    <Screen padTop={false}>
      <Card tint={colors.lavSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Mascot mood="cheer" size={84} />
        <View style={{ flex: 1, gap: 4 }}>
          <T v="tiny" color={colors.lavender}>
            {a.dishes.length} YEMEK İNCELEDİM
          </T>
          <T v="body" style={{ fontFamily: fonts.bold }}>
            {a.headline}
          </T>
        </View>
      </Card>

      {a.best_pick ? (
        <Card tint={colors.mintSoft} style={{ gap: 4 }}>
          <T v="tiny" color={colors.mint}>
            BENİM SEÇİMİM 👑
          </T>
          <T v="h2">{a.best_pick}</T>
          {a.tip ? (
            <T v="small" color={colors.ink}>
              {a.tip}
            </T>
          ) : null}
        </Card>
      ) : null}

      {groups.map((g) => (
        <View key={g.v} style={{ gap: 10 }}>
          <Row gap={8} style={{ marginTop: 6 }}>
            <T v="h2">{VERDICT_UI[g.v].emoji}</T>
            <T v="h2">{VERDICT_UI[g.v].label}</T>
            <T v="small" color={colors.inkSoft}>
              {g.items.length}
            </T>
          </Row>
          {g.items.map((d, i) => {
            const st = personal(d.name);
            return (
              <Tap key={`${d.name}-${i}`} onPress={() => pick(d)}>
                <Card style={{ gap: 6, padding: 14, borderLeftWidth: 5, borderLeftColor: VERDICT_UI[d.verdict].fg }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T v="h3" style={{ flex: 1 }}>
                      {d.name}
                    </T>
                    <VerdictBadge verdict={d.verdict} size="sm" />
                  </Row>
                  {d.reason ? (
                    <T v="small" color={colors.inkSoft}>
                      {d.reason}
                    </T>
                  ) : null}
                  {st?.n ? (
                    <T v="tiny" color={colors.lavender}>
                      DAHA ÖNCE {st.n} KEZ YEDİN · {st.bad + st.mild ? `${st.bad + st.mild} KEZ DOKUNDU` : 'HEP İYİ GELDİ'}
                    </T>
                  ) : null}
                </Card>
              </Tap>
            );
          })}
        </View>
      ))}
      <T v="small" color={colors.inkSoft} style={{ textAlign: 'center' }}>
        Sipariş ettiğin yemeğe dokun, kaydedeyim.
      </T>
      <Disclaimer />
    </Screen>
  );
}

function Pill({ label, warn }: { label: string; warn?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: warn ? colors.butterSoft : colors.bg }}>
      <T v="small" color={warn ? '#A87406' : colors.ink} style={{ fontFamily: fonts.bold }}>
        {label}
      </T>
    </View>
  );
}

function Disclaimer() {
  return (
    <T v="tiny" color={colors.inkFaint} style={{ textAlign: 'center', lineHeight: 17 }}>
      Bu yorum genel bilgi ve senin kayıtlarına dayanır, tıbbi tavsiye değildir.
    </T>
  );
}
