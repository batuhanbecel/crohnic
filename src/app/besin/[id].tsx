import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Mascot } from '../../components/Mascot';
import { ThinkingOverlay } from '../../components/ThinkingOverlay';
import { Button, Card, Row, Screen, T, VERDICT_UI, VerdictBadge } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import * as db from '../../lib/db';
import { FOOD_BY_ID, TAGS } from '../../lib/foods';
import { now } from '../../lib/dates';
import { colors, fonts, radius } from '../../lib/theme';
import { assessFood, generalVerdict } from '../../lib/tolerance';
import { useAnalyze } from '../../lib/use-analyze';

export default function FoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const food = FOOD_BY_ID[id ?? ''];
  const sql = useSQLiteContext();
  const app = useApp();
  const { busy, byName } = useAnalyze();
  const [meals, setMeals] = useState<db.Meal[]>([]);

  useEffect(() => {
    db.allRatedMeals(sql).then(setMeals);
  }, [sql, app.dataVersion]);

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
    setTimeout(() => Alert.alert('Afiyet olsun! 🍽️', 'Kaydettim. Birkaç saat sonra nasıl geldiğini soracağım.'), 350);
  };

  const mood = a.verdict === 'iyi' ? 'cheer' : a.verdict === 'dikkat' ? 'ok' : 'worried';
  const line =
    a.confidence === 'kişisel'
      ? a.verdict === 'iyi'
        ? 'Kayıtlarına bakılırsa bununla aran iyi. Afiyet!'
        : a.verdict === 'dikkat'
          ? 'Sana bazen dokunmuş. Az porsiyon, yavaş ye.'
          : 'Kayıtların net: bu sana dokunuyor. Bugünlük pas.'
      : a.verdict === 'iyi'
        ? 'Genelde mideyi yormayan bir seçim.'
        : a.verdict === 'dikkat'
          ? 'Bazı Crohn’lulara dokunabilir. Az dene, bana haber ver.'
          : app.phase === 'atak'
            ? 'Atak döneminde bundan uzak durmak akıllıca.'
            : 'Çoğu kişiye dokunan bir içerik var. Dikkatli ol.';

  return (
    <Screen padTop={false}>
      <ThinkingOverlay mode={busy} />
      <Card tint={u.bg} style={{ gap: 12 }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ fontSize: 48 }}>{food.emoji}</Text>
            <T v="h1">{food.name}</T>
            <VerdictBadge verdict={a.verdict} />
          </View>
          <Mascot mood={mood} size={92} />
        </Row>
        <View style={{ backgroundColor: '#fff', borderRadius: radius.md, padding: 14 }}>
          <T v="body" style={{ fontFamily: fonts.bold }}>
            “{line}”
          </T>
        </View>
      </Card>

      {a.stat && a.stat.n > 0 ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Senin kayıtların</T>
          <Row gap={8}>
            <Mini label="İyi geldi" value={a.stat.good} bg={colors.mintSoft} fg={colors.mint} />
            <Mini label="Biraz" value={a.stat.mild} bg={colors.butterSoft} fg="#C98A06" />
            <Mini label="Çok dokundu" value={a.stat.bad} bg={colors.tomatoSoft} fg={colors.tomato} />
          </Row>
        </Card>
      ) : (
        <Card tint={colors.lavSoft}>
          <T v="small">Bunu henüz hiç kaydetmedin. Yiyip “nasıl geldi” dersen bir dahakine sana özel söylerim.</T>
        </Card>
      )}

      {food.tags.length ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">İçinde ne var?</T>
          {a.reasons.map((r, i) => (
            <Row key={i} gap={10} style={{ alignItems: 'flex-start' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: u.fg, marginTop: 8 }} />
              <T v="body" style={{ flex: 1 }}>
                {r}
              </T>
            </Row>
          ))}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {food.tags.map((t) => (
              <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: colors.bg }}>
                <T v="tiny">{TAGS[t].label.toLocaleUpperCase('tr-TR')}</T>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card style={{ gap: 10 }}>
        <T v="h3">Döneme göre genel durum</T>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="body">🌤️ Remisyonda</T>
          <VerdictBadge verdict={rem} size="sm" />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="body">🌧️ Atakta</T>
          <VerdictBadge verdict={flare} size="sm" />
        </Row>
      </Card>

      <View style={{ gap: 10 }}>
        <Button title="Yedim, kaydet" icon="checkmark" color={colors.mint} onPress={ate} />
        <Button title="Kıvırcık’a detaylı sor" kind="soft" icon="sparkles" onPress={() => byName(food.name, food.id)} />
      </View>
    </Screen>
  );
}

function Mini({ label, value, bg, fg }: { label: string; value: number; bg: string; fg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: radius.md, padding: 12, alignItems: 'center' }}>
      <T v="h1" color={fg}>
        {value}
      </T>
      <T v="tiny" color={fg}>
        {label.toLocaleUpperCase('tr-TR')}
      </T>
    </View>
  );
}
