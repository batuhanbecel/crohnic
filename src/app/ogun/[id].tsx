import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { TextInput } from '../../components/text';
import { FoodEmoji } from '../../components/FoodEmoji';
import { FoodPicker } from '../../components/FoodPicker';
import { GroupThumb } from '../../components/MealRow';
import { ReactionPicker } from '../../components/ReactionPicker';
import { WhenField } from '../../components/WhenField';
import { Button, Card, Icon, Row, Screen, Segmented, T, Tap, VerdictBadge, st } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import * as db from '../../lib/db';
import { cancelMealReminder } from '../../lib/reminders';
import { FOOD_BY_ID, TAGS, type Food, type Phase } from '../../lib/foods';
import { deletePhoto, photoUri } from '../../lib/photos';
import { palette, radius, surface } from '../../lib/theme';
import { generalVerdict, tagsOf } from '../../lib/tolerance';

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sql = useSQLiteContext();
  const app = useApp();
  const [items, setItems] = useState<db.Meal[]>([]);
  const [reaction, setReaction] = useState<db.Reaction | null>(null);
  const [note, setNote] = useState('');
  const [at, setAt] = useState(0);
  const [phase, setPhase] = useState<Phase>('remisyon');

  const load = useCallback(async () => {
    const list = await db.getMealGroup(sql, Number(id));
    setItems(list);
    return list;
  }, [sql, id]);

  useEffect(() => {
    db.getMealGroup(sql, Number(id)).then((list) => {
      setItems(list);
      const first = list[0];
      setReaction(first?.reaction ?? null);
      setNote(first?.reaction_note ?? '');
      setAt(first?.eaten_at ?? 0);
      setPhase(first?.phase ?? 'remisyon');
    });
  }, [sql, id]);

  if (!items.length) return null;
  const group = db.groupMeals(items)[0];
  const uri = photoUri(group.photo);
  const tags = [...new Set(items.flatMap((m) => tagsOf(m)))].filter((t) => t !== 'hafif');

  const save = async () => {
    await db.setGroupReaction(sql, group.ids, reaction, note.trim() || null);
    if (reaction != null) cancelMealReminder(group.ids);
    if (at && at !== group.eaten_at) await db.setGroupTime(sql, group.ids, at);
    if (phase !== group.phase) {
      await db.setGroupPhase(
        sql,
        items.map((m) => {
          const food = m.food_id ? FOOD_BY_ID[m.food_id] : undefined;
          // List foods get re-scored for the new phase; AI verdicts are kept as they were.
          return { id: m.id, verdict: food ? generalVerdict(food.tags, phase).verdict : m.ai_verdict };
        }),
        phase,
      );
    }
    app.bump();
    router.back();
  };

  const addItem = async (name: string, food: Food | null) => {
    await db.addToMeal(sql, items[0].id, {
      name,
      food_id: food?.id ?? null,
      tags: food?.tags.join(',') ?? '',
      ai_verdict: food ? generalVerdict(food.tags, phase).verdict : null,
    });
    app.bump();
    await load();
  };

  const removeItem = (m: db.Meal) =>
    Alert.alert(`${m.name} çıkarılsın mı?`, undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkar',
        style: 'destructive',
        onPress: async () => {
          await db.deleteMeal(sql, m.id);
          if (m.photo && !items.some((x) => x.id !== m.id && x.photo === m.photo)) deletePhoto(m.photo);
          app.bump();
          const rest = await load();
          if (!rest.length) router.back();
        },
      },
    ]);

  const removeAll = () =>
    Alert.alert('Öğün silinsin mi?', group.name, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          for (const m of items) {
            await db.deleteMeal(sql, m.id);
            deletePhoto(m.photo);
          }
          app.bump();
          router.back();
        },
      },
    ]);

  return (
    <Screen title="Öğün">
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', aspectRatio: 1.3, borderRadius: radius.xl }} />
      ) : (
        <Row>
          <GroupThumb group={group} size={64} />
        </Row>
      )}
      <View style={{ gap: 6, paddingHorizontal: 2 }}>
        <T v="title">{items.length > 1 ? `${items.length} yemekli öğün` : items[0].name}</T>
      </View>

      <Card style={{ gap: 8 }}>
        <T v="h3">Tabakta</T>
        {items.map((m) => (
          <Row key={m.id} gap={10} style={{ backgroundColor: surface.well, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 12 }}>
            <FoodEmoji name={m.name} foodId={m.food_id} />
            <T v="callout" style={{ flex: 1 }} numberOfLines={1}>
              {m.name}
            </T>
            {m.ai_verdict ? <VerdictBadge verdict={m.ai_verdict} size="sm" /> : null}
            {items.length > 1 ? (
              <Tap onPress={() => removeItem(m)} hitSlop={10} accessibilityLabel={`${m.name} çıkar`}>
                <Icon name="xmark.circle.fill" size={20} color={palette.inkFaint} fallback="✕" />
              </Tap>
            ) : null}
          </Row>
        ))}
        <FoodPicker onAdd={addItem} exclude={items.map((m) => m.food_id)} placeholder="Tabağa yemek ekle" />
        {tags.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {tags.map((t) => (
              <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: surface.well }}>
                <T v="caption" color={palette.inkSoft}>
                  {TAGS[t].label}
                </T>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Card style={{ gap: 14 }}>
        {at ? <WhenField value={at} onChange={setAt} /> : null}
        <View style={{ gap: 8 }}>
          <T v="h3">Dönem</T>
          <Segmented
            value={phase}
            onChange={setPhase}
            items={[
              { key: 'remisyon', label: 'Remisyon', color: palette.lettuceDeep, icon: 'leaf.fill' },
              { key: 'atak', label: 'Atak', color: palette.flare, icon: 'flame.fill' },
            ]}
          />
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="h3">Nasıl geçti?</T>
        {items.length > 1 ? (
          <T v="small" color={palette.inkSoft} style={{ marginTop: -8 }}>
            Cevabın tabaktaki her yemeğe işlenir. Hangisinin dokunduğunu zamanla örüntüler ayırır.
          </T>
        ) : null}
        <ReactionPicker value={reaction} onChange={setReaction} />
        <TextInput value={note} onChangeText={setNote} placeholder="Not (ör. 2 saat sonra şişkinlik)" placeholderTextColor={palette.inkFaint} style={st.input} />
      </Card>

      <Button title="Kaydet" icon="checkmark" onPress={save} />
      <Button title={items.length > 1 ? 'Öğünü komple sil' : 'Öğünü sil'} kind="danger" icon="trash" onPress={removeAll} />
    </Screen>
  );
}
