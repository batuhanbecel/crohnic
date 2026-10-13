import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { MealRow } from '../../components/MealRow';
import { BRISTOL } from '../../components/bristol';
import { Card, Chip, Empty, Row, Screen, T, Tap } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { dayKey, dayLabel, timeLabel } from '../../lib/dates';
import * as db from '../../lib/db';
import { colors, fonts } from '../../lib/theme';

type Entry =
  | { kind: 'meal'; at: number; item: db.Meal }
  | { kind: 'symptom'; at: number; item: db.SymptomLog }
  | { kind: 'bowel'; at: number; item: db.BowelLog };

type Filter = 'hepsi' | 'meal' | 'symptom' | 'bowel';

export default function Journal() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState<Filter>('hepsi');

  const load = useCallback(async () => {
    const [m, s, b] = await Promise.all([db.listMeals(sql, 300), db.listSymptoms(sql, 300), db.listBowel(sql, 300)]);
    const all: Entry[] = [
      ...m.map((item) => ({ kind: 'meal' as const, at: item.eaten_at, item })),
      ...s.map((item) => ({ kind: 'symptom' as const, at: item.at, item })),
      ...b.map((item) => ({ kind: 'bowel' as const, at: item.at, item })),
    ].sort((a, c) => c.at - a.at);
    setEntries(all);
  }, [sql]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const days = useMemo(() => {
    const list = entries.filter((e) => filter === 'hepsi' || e.kind === filter);
    const map = new Map<string, Entry[]>();
    for (const e of list) {
      const k = dayKey(e.at);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.values()];
  }, [entries, filter]);

  const remove = (e: Entry) => {
    Alert.alert('Silinsin mi?', 'Bu kayıt kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          if (e.kind === 'symptom') await db.deleteSymptom(sql, e.item.id);
          if (e.kind === 'bowel') await db.deleteBowel(sql, e.item.id);
          app.bump();
          load();
        },
      },
    ]);
  };

  return (
    <Screen>
      <T v="title">Günlük</T>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <Chip label="Hepsi" active={filter === 'hepsi'} onPress={() => setFilter('hepsi')} />
        <Chip label="Öğün" emoji="🍽️" active={filter === 'meal'} onPress={() => setFilter('meal')} />
        <Chip label="Semptom" emoji="🌡️" active={filter === 'symptom'} color={colors.lavender} onPress={() => setFilter('symptom')} />
        <Chip label="Tuvalet" emoji="💧" active={filter === 'bowel'} color={colors.sky} onPress={() => setFilter('bowel')} />
      </Row>

      {days.length === 0 ? (
        <Empty emoji="📖" title="Günlük boş" text="Yediklerini, nasıl hissettiğini ve tuvalet kayıtlarını buraya yazdıkça örüntüleri birlikte bulacağız." />
      ) : (
        days.map((list) => (
          <View key={dayKey(list[0].at)} style={{ gap: 10 }}>
            <T v="h2" style={{ marginTop: 6 }}>
              {dayLabel(list[0].at)}
            </T>
            {list.map((e) =>
              e.kind === 'meal' ? (
                <MealRow key={`m${e.item.id}`} meal={e.item} />
              ) : e.kind === 'symptom' ? (
                <Tap key={`s${e.item.id}`} onLongPress={() => remove(e)} onPress={() => remove(e)}>
                  <Card style={{ padding: 12, gap: 6 }} tint={colors.lavSoft}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <T v="h3">🌡️ Semptom</T>
                      <T v="small" color={colors.inkSoft}>
                        {timeLabel(e.at)}
                      </T>
                    </Row>
                    <Row gap={12} style={{ flexWrap: 'wrap' }}>
                      <Metric label="Ağrı" v={e.item.pain} />
                      <Metric label="Şişkinlik" v={e.item.bloating} />
                      <Metric label="Gaz" v={e.item.gas} />
                      <Metric label="Yorgunluk" v={e.item.fatigue} />
                    </Row>
                    {e.item.note ? (
                      <T v="small" color={colors.inkSoft}>
                        {e.item.note}
                      </T>
                    ) : null}
                  </Card>
                </Tap>
              ) : (
                <Tap key={`b${e.item.id}`} onLongPress={() => remove(e)} onPress={() => remove(e)}>
                  <Card style={{ padding: 12, gap: 4 }} tint={colors.skySoft}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Row gap={8}>
                        <Text style={{ fontSize: 20 }}>{BRISTOL[e.item.bristol - 1]?.emoji}</Text>
                        <T v="h3">
                          Tip {e.item.bristol} · {BRISTOL[e.item.bristol - 1]?.short}
                        </T>
                      </Row>
                      <T v="small" color={colors.inkSoft}>
                        {timeLabel(e.at)}
                      </T>
                    </Row>
                    {e.item.blood || e.item.urgency ? (
                      <T v="small" color={e.item.blood ? colors.tomato : colors.inkSoft} style={{ fontFamily: fonts.bold }}>
                        {[e.item.blood ? '🩸 Kan vardı' : null, e.item.urgency ? '⚡ Aciliyet' : null].filter(Boolean).join('  ·  ')}
                      </T>
                    ) : null}
                    {e.item.note ? (
                      <T v="small" color={colors.inkSoft}>
                        {e.item.note}
                      </T>
                    ) : null}
                  </Card>
                </Tap>
              ),
            )}
          </View>
        ))
      )}
      {days.length ? (
        <T v="tiny" color={colors.inkFaint} style={{ textAlign: 'center' }}>
          Öğüne dokunarak düzenle. Semptom ve tuvalet kaydını silmek için üzerine dokun.
        </T>
      ) : null}
      <Tap onPress={() => router.push('/yemek-ekle')} style={{ alignSelf: 'center' }}>
        <T v="h3" color={colors.coral}>
          + Geçmiş bir öğün ekle
        </T>
      </Tap>
    </Screen>
  );
}

function Metric({ label, v }: { label: string; v: number }) {
  return (
    <T v="small" style={{ fontFamily: fonts.bold }}>
      {label} <T v="small" color={v >= 4 ? colors.tomato : colors.lavender} style={{ fontFamily: fonts.black }}>{v}/5</T>
    </T>
  );
}
