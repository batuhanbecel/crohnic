import { Stack, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import Reanimated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddMenu } from '../../../components/AddMenu';
import { BRISTOL, bristolTone } from '../../../components/bristol';
import { Mascot } from '../../../components/Mascot';
import { GroupThumb } from '../../../components/MealRow';
import { MonthCalendar } from '../../../components/MonthCalendar';
import { REACTIONS } from '../../../components/ReactionPicker';
import { SwipeRow } from '../../../components/SwipeRow';
import { TextInput } from '../../../components/text';
import { Card, Empty, Icon, IconBubble, Row, Screen, Segmented, T, Tap, st } from '../../../components/ui';
import { useApp } from '../../../lib/app-state';
import { dayKey, dayLabel, isoDay, now, timeLabel } from '../../../lib/dates';
import * as db from '../../../lib/db';
import { dayStatuses } from '../../../lib/insights';
import { deletePhoto } from '../../../lib/photos';
import { palette, radius, surface, type } from '../../../lib/theme';

type Entry =
  | { kind: 'meal'; key: string; at: number; item: db.MealGroup }
  | { kind: 'symptom'; key: string; at: number; item: db.SymptomLog }
  | { kind: 'bowel'; key: string; at: number; item: db.BowelLog };

type Filter = 'hepsi' | 'meal' | 'symptom' | 'bowel';
type Mode = 'list' | 'calendar';

const fold = (s: string) => s.toLocaleLowerCase('tr');

function describe(e: Entry): { title: string; sub: string } {
  if (e.kind === 'meal') {
    const r = e.item.reaction != null ? REACTIONS[e.item.reaction].label : 'Nasıl geçtiği bekleniyor';
    return { title: e.item.name, sub: [r, e.item.phase === 'atak' ? 'atakta' : null].filter(Boolean).join(', ') };
  }
  if (e.kind === 'symptom') {
    const s = e.item;
    const parts = [s.pain ? `ağrı ${s.pain}` : null, s.bloating ? `şişkinlik ${s.bloating}` : null, s.gas ? `gaz ${s.gas}` : null, s.fatigue ? `yorgunluk ${s.fatigue}` : null].filter(Boolean);
    return { title: parts.length ? 'Semptom' : 'Şikayet yok', sub: [parts.join(', '), s.note].filter(Boolean).join(' · ') || 'Hepsi 0' };
  }
  const b = e.item;
  return {
    title: `Tuvalet, ${(BRISTOL[b.bristol - 1]?.short ?? `tip ${b.bristol}`).toLocaleLowerCase('tr')}`,
    sub: [`Bristol ${b.bristol}`, b.blood ? 'kan vardı' : null, b.urgency ? 'acil' : null, b.note].filter(Boolean).join(', '),
  };
}

export default function Journal() {
  const sql = useSQLiteContext();
  const app = useApp();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [daily, setDaily] = useState<db.Daily[]>([]);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<Filter>('hepsi');
  const [mode, setMode] = useState<Mode>('list');
  const [q, setQ] = useState('');
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(() => isoDay(now()));
  // deletes wait a few seconds so they can be undone
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<{ entry: Entry; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [toast] = useState(() => new Animated.Value(0));

  const load = useCallback(async () => {
    const [m, s, b, d] = await Promise.all([db.listMeals(sql, 600), db.listSymptoms(sql, 600), db.listBowel(sql, 600), db.listDaily(sql, 400)]);
    setEntries(
      [
        ...db.groupMeals(m).map((item) => ({ kind: 'meal' as const, key: `m${item.key}`, at: item.eaten_at, item })),
        ...s.map((item) => ({ kind: 'symptom' as const, key: `s${item.id}`, at: item.at, item })),
        ...b.map((item) => ({ kind: 'bowel' as const, key: `b${item.id}`, at: item.at, item })),
      ].sort((a, c) => c.at - a.at),
    );
    setDaily(d);
  }, [sql]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, app.dataVersion]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const commit = useCallback(
    async (e: Entry) => {
      if (e.kind === 'meal') {
        for (const id of e.item.ids) await db.deleteMeal(sql, id);
        deletePhoto(e.item.photo);
      }
      if (e.kind === 'symptom') await db.deleteSymptom(sql, e.item.id);
      if (e.kind === 'bowel') await db.deleteBowel(sql, e.item.id);
      app.bump();
    },
    [sql, app],
  );

  // leaving the screen finishes a pending delete
  const pending = useRef<{ entry: Entry; timer: ReturnType<typeof setTimeout> } | null>(null);
  useEffect(() => {
    pending.current = undo;
  }, [undo]);
  useEffect(
    () => () => {
      if (pending.current) {
        clearTimeout(pending.current.timer);
        commit(pending.current.entry);
      }
    },
    [commit],
  );

  const showToast = (on: boolean) => Animated.timing(toast, { toValue: on ? 1 : 0, duration: 180, useNativeDriver: true }).start();

  const remove = (e: Entry) => {
    if (undo) {
      clearTimeout(undo.timer);
      commit(undo.entry);
    }
    setHidden((h) => new Set(h).add(e.key));
    const timer = setTimeout(() => {
      commit(e);
      setUndo(null);
      showToast(false);
    }, 5000);
    setUndo({ entry: e, timer });
    showToast(true);
  };

  const restore = () => {
    if (!undo) return;
    clearTimeout(undo.timer);
    setHidden((h) => {
      const n = new Set(h);
      n.delete(undo.entry.key);
      return n;
    });
    setUndo(null);
    showToast(false);
  };

  const open = (e: Entry) => {
    if (e.kind === 'meal') router.push(`/ogun/${e.item.ids[0]}`);
    else if (e.kind === 'symptom') router.push({ pathname: '/semptom', params: { id: String(e.item.id) } });
    else router.push({ pathname: '/tuvalet', params: { id: String(e.item.id) } });
  };

  const visible = useMemo(() => {
    const term = fold(q.trim());
    return entries.filter((e) => {
      if (hidden.has(e.key)) return false;
      if (filter !== 'hepsi' && e.kind !== filter) return false;
      if (!term) return true;
      const d = describe(e);
      return fold(`${d.title} ${d.sub}`).includes(term);
    });
  }, [entries, hidden, filter, q]);

  const statuses = useMemo(
    () =>
      dayStatuses(
        entries.filter((e) => e.kind === 'meal').flatMap((e) => (e.kind === 'meal' ? e.item.items : [])),
        entries.flatMap((e) => (e.kind === 'symptom' ? [e.item] : [])),
        entries.flatMap((e) => (e.kind === 'bowel' ? [e.item] : [])),
        daily,
      ),
    [entries, daily],
  );

  const days = useMemo(() => {
    const list = mode === 'calendar' ? visible.filter((e) => isoDay(e.at) === selected) : visible;
    const map = new Map<string, Entry[]>();
    for (const e of list) {
      const k = dayKey(e.at);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.values()];
  }, [visible, mode, selected]);

  const selectedFeel = daily.find((d) => d.day === selected)?.feel;

  return (
    <View style={{ flex: 1 }}>
      <Screen tone={app.phase === 'atak' ? 'flare' : 'calm'}>
        <Stack.Screen
          options={{
            unstable_headerRightItems: () => [
              {
                type: 'button',
                label: mode === 'list' ? 'Takvim' : 'Liste',
                icon: { type: 'sfSymbol', name: mode === 'list' ? 'calendar' : 'list.bullet' },
                onPress: () => setMode(mode === 'list' ? 'calendar' : 'list'),
              },
              { type: 'button', label: 'Kayıt ekle', icon: { type: 'sfSymbol', name: 'plus' }, onPress: () => setAdding(true) },
            ],
          }}
        />
        <T v="large" accessibilityRole="header" style={{ marginTop: 2 }}>
          Günlük
        </T>
        <AddMenu visible={adding} onClose={() => setAdding(false)} />

        {mode === 'list' ? (
          <View>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Ara: sucuk, kramp, kan…"
              placeholderTextColor={palette.inkFaint}
              style={[st.input, { backgroundColor: surface.card, paddingLeft: 40 }]}
              clearButtonMode="while-editing"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Günlükte ara"
            />
            <View style={{ position: 'absolute', left: 13, top: 15 }} pointerEvents="none">
              <Icon name="magnifyingglass" size={16} color={palette.inkFaint} fallback="🔍" />
            </View>
          </View>
        ) : (
          <Card>
            <MonthCalendar
              month={month}
              status={statuses}
              selected={selected}
              today={isoDay(now())}
              onSelect={setSelected}
              onMonth={(d) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + d, 1))}
            />
          </Card>
        )}

        <Segmented
          value={filter}
          onChange={setFilter}
          items={[
            { key: 'hepsi', label: 'Hepsi' },
            { key: 'meal', label: 'Öğün' },
            { key: 'symptom', label: 'Semptom' },
            { key: 'bowel', label: 'Tuvalet' },
          ]}
        />

        {mode === 'calendar' && selected ? (
          <Row style={{ justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 4 }}>
            <T v="h2">{dayLabel(new Date(`${selected}T12:00:00`).getTime())}</T>
            {selectedFeel != null ? (
              <T v="small" color={palette.inkSoft}>
                {['😣 Kötü', '😕 Zor', '😐 İdare', '🙂 İyi', '😄 Harika'][selectedFeel]}
              </T>
            ) : null}
          </Row>
        ) : null}

        {days.length === 0 ? (
          q.trim() ? (
            <Empty art={<Mascot mood="arastirma" size={96} />} title="Bulunamadı" text={`“${q.trim()}” geçen bir kayıt yok.`} />
          ) : mode === 'calendar' ? (
            <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
              <T v="small" color={palette.inkSoft}>
                Bu gün için kayıt yok.
              </T>
            </Card>
          ) : (
            <Empty art={<Mascot mood="kayit" size={110} />} title="Henüz kayıt yok" text="Yediklerini, nasıl hissettiğini ve tuvalet kayıtlarını yazdıkça burada birikir." />
          )
        ) : (
          days.map((list) => (
            <View key={dayKey(list[0].at)} style={{ gap: 8 }}>
              {mode === 'list' ? (
                <T v="h2" style={{ marginTop: 8, paddingHorizontal: 4 }} accessibilityRole="header">
                  {dayLabel(list[0].at)}
                </T>
              ) : null}
              <View style={{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: surface.card }}>
                {list.map((e, i) => {
                  const d = describe(e);
                  return (
                    <Reanimated.View key={e.key} layout={LinearTransition.duration(220)} entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
                      {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline, marginLeft: 66 }} /> : null}
                      <SwipeRow onPress={() => open(e)} onDelete={() => remove(e)} label={`${timeLabel(e.at)}, ${d.title}, ${d.sub}`}>
                        <Row gap={12} style={{ paddingVertical: 11, paddingHorizontal: 14, backgroundColor: surface.card }}>
                          {e.kind === 'meal' ? (
                            <GroupThumb group={e.item} size={38} />
                          ) : e.kind === 'symptom' ? (
                            <IconBubble name="waveform.path.ecg" color={e.item.pain >= 3 ? palette.bad : palette.apricot} dim={38} fallback="🌡️" />
                          ) : (
                            <IconBubble name="drop.fill" color={e.item.blood ? palette.bad : bristolTone(e.item.bristol)} dim={38} fallback="💧" />
                          )}
                          <View style={{ flex: 1 }}>
                            <T v="callout" numberOfLines={1} style={type.medium}>
                              {d.title}
                            </T>
                            <T v="small" color={e.kind === 'bowel' && e.item.blood ? palette.bad : palette.inkSoft} numberOfLines={2}>
                              {d.sub}
                            </T>
                          </View>
                          <T v="small" color={palette.inkFaint}>
                            {timeLabel(e.at)}
                          </T>
                        </Row>
                      </SwipeRow>
                    </Reanimated.View>
                  );
                })}
              </View>
            </View>
          ))
        )}
        {days.length ? (
          <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center' }}>
            Düzenlemek için dokun, silmek için sola kaydır.
          </T>
        ) : null}
      </Screen>

      {undo ? (
        <Animated.View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: insets.bottom + 72,
            opacity: toast,
            transform: [{ translateY: toast.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }}
          accessibilityLiveRegion="polite"
        >
          <Row gap={12} style={{ backgroundColor: palette.ink, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 16 }}>
            <T v="callout" color={palette.onInk} style={{ flex: 1 }}>
              Kayıt silindi
            </T>
            <Tap onPress={restore} hitSlop={10} accessibilityRole="button" accessibilityLabel="Silmeyi geri al">
              <T v="callout" color={palette.onInk} style={[type.semibold, { textDecorationLine: 'underline' }]}>
                Geri al
              </T>
            </Tap>
          </Row>
        </Animated.View>
      ) : null}
    </View>
  );
}
