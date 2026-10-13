import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { AddMenu } from '../../components/AddMenu';
import { MealRow } from '../../components/MealRow';
import { BRISTOL, bristolTone } from '../../components/bristol';
import { Card, Empty, IconButton, Row, Screen, Segmented, T, Tap } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { dayKey, dayLabel, timeLabel } from '../../lib/dates';
import * as db from '../../lib/db';
import { palette, type } from '../../lib/theme';

type Entry =
  | { kind: 'meal'; at: number; item: db.MealGroup }
  | { kind: 'symptom'; at: number; item: db.SymptomLog }
  | { kind: 'bowel'; at: number; item: db.BowelLog };

type Filter = 'hepsi' | 'meal' | 'symptom' | 'bowel';

export default function Journal() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<Filter>('hepsi');

  const load = useCallback(async () => {
    const [m, s, b] = await Promise.all([db.listMeals(sql, 400), db.listSymptoms(sql, 400), db.listBowel(sql, 400)]);
    setEntries(
      [
        ...db.groupMeals(m).map((item) => ({ kind: 'meal' as const, at: item.eaten_at, item })),
        ...s.map((item) => ({ kind: 'symptom' as const, at: item.at, item })),
        ...b.map((item) => ({ kind: 'bowel' as const, at: item.at, item })),
      ].sort((a, c) => c.at - a.at),
    );
  }, [sql]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const days = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries.filter((x) => filter === 'hepsi' || x.kind === filter)) {
      const k = dayKey(e.at);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.values()];
  }, [entries, filter]);

  const remove = (e: Entry) => {
    Alert.alert('Kayıt silinsin mi?', undefined, [
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
    <Screen tone={app.phase === 'atak' ? 'flare' : 'calm'}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
        <T v="large">Günlük</T>
        <IconButton name="plus" label="Kayıt ekle" fallback="+" onPress={() => setAdding(true)} />
      </Row>
      <AddMenu visible={adding} onClose={() => setAdding(false)} />
      <Segmented
        value={filter}
        onChange={setFilter}
        items={[
          { key: 'hepsi', label: 'Hepsi' },
          { key: 'meal', label: 'Öğün', color: palette.lettuceDeep },
          { key: 'symptom', label: 'Semptom', color: palette.peri },
          { key: 'bowel', label: 'Tuvalet', color: palette.sky },
        ]}
      />

      {days.length === 0 ? (
        <Empty emoji="📖" title="Henüz kayıt yok" text="Yediklerini, nasıl hissettiğini ve tuvalet kayıtlarını yazdıkça örüntüler burada birikir." />
      ) : (
        days.map((list) => (
          <View key={dayKey(list[0].at)} style={{ gap: 8 }}>
            <T v="h2" style={{ marginTop: 8, paddingHorizontal: 2 }}>
              {dayLabel(list[0].at)}
            </T>
            {list.map((e) =>
              e.kind === 'meal' ? (
                <MealRow key={e.item.key} group={e.item} />
              ) : e.kind === 'symptom' ? (
                <Tap key={`s${e.item.id}`} onLongPress={() => remove(e)}>
                  <Card style={{ padding: 12, gap: 6 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Row gap={8}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.peri }} />
                        <T v="h3">Semptom</T>
                      </Row>
                      <T v="small" color={palette.inkSoft}>
                        {timeLabel(e.at)}
                      </T>
                    </Row>
                    <Row gap={14} style={{ flexWrap: 'wrap' }}>
                      <Metric label="Ağrı" v={e.item.pain} />
                      <Metric label="Şişkinlik" v={e.item.bloating} />
                      <Metric label="Gaz" v={e.item.gas} />
                      <Metric label="Yorgunluk" v={e.item.fatigue} />
                    </Row>
                    {e.item.note ? (
                      <T v="small" color={palette.inkSoft}>
                        {e.item.note}
                      </T>
                    ) : null}
                  </Card>
                </Tap>
              ) : (
                <Tap key={`b${e.item.id}`} onLongPress={() => remove(e)}>
                  <Card style={{ padding: 12, gap: 4 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Row gap={8}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: bristolTone(e.item.bristol) }} />
                        <Text style={{ fontSize: 18 }}>{BRISTOL[e.item.bristol - 1]?.emoji}</Text>
                        <T v="h3">
                          {e.item.bristol}. {BRISTOL[e.item.bristol - 1]?.short}
                        </T>
                      </Row>
                      <T v="small" color={palette.inkSoft}>
                        {timeLabel(e.at)}
                      </T>
                    </Row>
                    {e.item.blood || e.item.urgency ? (
                      <T v="small" color={e.item.blood ? palette.bad : palette.inkSoft} style={type.semibold}>
                        {[e.item.blood ? 'Kan vardı' : null, e.item.urgency ? 'Zor yetişti' : null].filter(Boolean).join(' · ')}
                      </T>
                    ) : null}
                    {e.item.note ? (
                      <T v="small" color={palette.inkSoft}>
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
        <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', fontWeight: '400' }}>
          Öğünü düzenlemek için dokun. Semptom ve tuvalet kaydını silmek için basılı tut.
        </T>
      ) : null}
    </Screen>
  );
}

function Metric({ label, v }: { label: string; v: number }) {
  return (
    <T v="small" color={palette.inkSoft}>
      {label}{' '}
      <T v="small" color={v >= 4 ? palette.bad : palette.ink} style={type.semibold}>
        {v}/5
      </T>
    </T>
  );
}
