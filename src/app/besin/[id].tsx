import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Mascot } from '../../components/Mascot';
import { ThinkingOverlay } from '../../components/ThinkingOverlay';
import { Button, Card, Row, Screen, T, VERDICT_UI, VerdictBadge } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { now } from '../../lib/dates';
import * as db from '../../lib/db';
import { FOOD_BY_ID, FOODS, TAGS } from '../../lib/foods';
import { palette, radius, surface, type } from '../../lib/theme';
import { assessFood, generalVerdict } from '../../lib/tolerance';
import { useAnalyze } from '../../lib/use-analyze';

export default function FoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const food = FOOD_BY_ID[id ?? ''];
  const sql = useSQLiteContext();
  const app = useApp();
  const { busy, byName, hasAi } = useAnalyze();
  const [meals, setMeals] = useState<db.Meal[]>([]);

  useEffect(() => {
    db.allRatedMeals(sql).then(setMeals);
  }, [sql, app.dataVersion]);

  /** Gentler foods from the same category, for the "instead" row. */
  const alternatives = useMemo(() => {
    if (!food) return [];
    return FOODS.filter((f) => f.cat === food.cat && f.id !== food.id && generalVerdict(f.tags, app.phase).verdict === 'iyi').slice(0, 4);
  }, [food, app.phase]);

  if (!food) return null;
  const a = assessFood(food, app.phase, meals);
  const u = VERDICT_UI[a.verdict];
  const rem = generalVerdict(food.tags, 'remisyon').verdict;
  const flare = generalVerdict(food.tags, 'atak').verdict;

  const ate = async () => {
    await db.addMeal(sql, {
      name: food.name,
      food_id: food.id,
      tags: food.tags.join(','),
      photo: null,
      eaten_at: now(),
      ai_verdict: a.verdict,
      phase: app.phase,
    });
    app.bump();
    router.back();
    setTimeout(() => Alert.alert('Kaydedildi', 'Birkaç saat sonra nasıl geçtiğini soracağım.'), 350);
  };

  const mood = a.verdict === 'iyi' ? 'cheer' : a.verdict === 'dikkat' ? 'ok' : 'worried';
  const line =
    a.confidence === 'kişisel'
      ? a.verdict === 'iyi'
        ? 'Kayıtlarına bakılırsa bununla aran iyi.'
        : a.verdict === 'dikkat'
          ? 'Bu sana bazen dokunmuş. Küçük porsiyon, yavaş ye.'
          : 'Kayıtlarında bu çoğu zaman dokunmuş. Bugün başka bir şey seçmek daha iyi.'
      : a.verdict === 'iyi'
        ? 'Çoğu kişide sorun çıkarmayan bir seçim.'
        : a.verdict === 'dikkat'
          ? 'Bazı kişilere dokunabilir. Az deneyip nasıl geçtiğini yaz.'
          : app.phase === 'atak'
            ? 'Atak döneminde bundan uzak durmak daha iyi.'
            : 'Çoğu kişiye dokunan içerikleri var. Denersen az dene.';

  return (
    <Screen header={false}>
      <ThinkingOverlay mode={busy} />
      <Card style={{ gap: 12 }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ fontSize: 44 }}>{food.emoji}</Text>
            <T v="title">{food.name}</T>
            <Row gap={8}>
              <VerdictBadge verdict={a.verdict} />
              <T v="caption" color={palette.inkSoft}>
                {food.cat}
              </T>
            </Row>
          </View>
          <Mascot mood={mood} size={88} />
        </Row>
        <View style={{ backgroundColor: u.bg, borderRadius: radius.md, padding: 14 }}>
          <T v="callout" style={type.medium}>
            {line}
          </T>
        </View>
      </Card>

      {a.stat && a.stat.n > 0 ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Senin kayıtların</T>
          <Row gap={8}>
            <Mini label="İyi geldi" value={a.stat.good} bg={palette.goodSoft} fg={palette.good} />
            <Mini label="Biraz" value={a.stat.mild} bg={palette.warnSoft} fg={palette.warn} />
            <Mini label="Çok dokundu" value={a.stat.bad} bg={palette.badSoft} fg={palette.bad} />
          </Row>
        </Card>
      ) : (
        <Card tint={palette.periSoft}>
          <T v="small">Bunu henüz kaydetmedin. Yiyip nasıl geçtiğini yazarsan bir dahaki sefere sana göre söylerim.</T>
        </Card>
      )}

      <Card style={{ gap: 10 }}>
        <T v="h3">Neden</T>
        {a.reasons.map((r, i) => (
          <Row key={i} gap={10} style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: u.fg, marginTop: 8 }} />
            <T v="callout" style={{ flex: 1 }}>
              {r}
            </T>
          </Row>
        ))}
        {food.tags.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {food.tags.map((t) => (
              <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: surface.well }}>
                <T v="caption" color={palette.inkSoft}>
                  {TAGS[t].label}
                </T>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Döneme göre</T>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="callout">Remisyonda</T>
          <VerdictBadge verdict={rem} size="sm" />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="callout">Atakta</T>
          <VerdictBadge verdict={flare} size="sm" />
        </Row>
      </Card>

      {a.verdict !== 'iyi' && alternatives.length ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Bunun yerine</T>
          {alternatives.map((f) => (
            <Row key={f.id} gap={10}>
              <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
              <T v="callout" style={{ flex: 1 }} onPress={() => router.replace(`/besin/${f.id}`)}>
                {f.name}
              </T>
              <VerdictBadge verdict="iyi" size="sm" />
            </Row>
          ))}
        </Card>
      ) : null}

      <View style={{ gap: 8 }}>
        <Button title="Yedim, kaydet" icon="checkmark" onPress={ate} />
        {hasAi ? <Button title="Daha ayrıntılı sor" kind="glass" icon="sparkles" onPress={() => byName(food.name, food.id)} /> : null}
      </View>
    </Screen>
  );
}

function Mini({ label, value, bg, fg }: { label: string; value: number; bg: string; fg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: radius.md, padding: 12, alignItems: 'center' }}>
      <T v="title" color={fg}>
        {value}
      </T>
      <T v="caption" color={fg}>
        {label}
      </T>
    </View>
  );
}
