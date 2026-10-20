import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { TextInput } from '../../components/text';
import { FoodEmoji } from '../../components/FoodEmoji';
import { FoodPicker } from '../../components/FoodPicker';
import { MealDetails, type Portion } from '../../components/MealDetails';
import { GroupThumb } from '../../components/MealRow';
import { ReactionPicker } from '../../components/ReactionPicker';
import { WhenField } from '../../components/WhenField';
import { Button, Card, Icon, Row, Screen, Segmented, T, Tap, VerdictBadge, st } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { dayKey, timeLabel } from '../../lib/dates';
import * as db from '../../lib/db';
import { SLOT_LABEL, isSlot, slotForNew, type MealSlot } from '../../lib/meal-slot';
import { cancelMealReminder } from '../../lib/reminders';
import { FOOD_BY_ID, TAGS, type Food, type Phase } from '../../lib/foods';
import { deletePhoto, photoUri } from '../../lib/photos';
import { palette, radius } from '../../lib/theme';
import { assessFood, tagsOf } from '../../lib/tolerance';

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sql = useSQLiteContext();
  const app = useApp();
  const [items, setItems] = useState<db.Meal[]>([]);
  const [reaction, setReaction] = useState<db.Reaction | null>(null);
  const [note, setNote] = useState('');
  const [at, setAt] = useState(0);
  const [phase, setPhase] = useState<Phase>('remisyon');
  const [portion, setPortion] = useState<Portion>(1);
  const [pickedSlot, setPickedSlot] = useState<MealSlot | null>(null);
  const [sameDay, setSameDay] = useState<{ key: string; eaten_at: number; slot: string | null }[]>([]);
  const [bigPhoto, setBigPhoto] = useState(false);

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
      setPortion((first?.portion ?? 1) as Portion);
      setPickedSlot(isSlot(first?.slot) ? first.slot : null);
    });
  }, [sql, id]);

  // the other sittings that day decide whether this one is "Öğle yemeği" or "Ara öğün"
  const day = at ? dayKey(at) : '';
  useEffect(() => {
    if (!day) return;
    db.listMeals(sql, 120).then((rows) =>
      setSameDay(
        db
          .groupMeals(rows.filter((m) => dayKey(m.eaten_at) === day && !db.isTobacco(m) && String(m.id) !== id && m.group_id !== items[0]?.group_id))
          .map((g) => ({ key: g.key, eaten_at: g.eaten_at, slot: g.slot })),
      ),
    );
  }, [sql, day, id, items]);

  if (!items.length) return null;
  const group = db.groupMeals(items)[0];
  const uri = photoUri(group.photo);
  const tags = [...new Set(items.flatMap((m) => tagsOf(m)))].filter((t) => t !== 'hafif');

  const save = async () => {
    await db.setGroupReaction(sql, group.ids, reaction, note.trim() || null);
    if (reaction != null) cancelMealReminder(group.ids);
    if (at && at !== group.eaten_at) await db.setGroupTime(sql, group.ids, at);
    if (portion !== (group.portion ?? 1) || pickedSlot !== (isSlot(group.slot) ? group.slot : null)) {
      await db.setGroupDetails(sql, group.ids, { portion, slot: pickedSlot });
    }
    if (phase !== group.phase) {
      await db.setGroupPhase(
        sql,
        items.map((m) => {
          const food = m.food_id ? FOOD_BY_ID[m.food_id] : undefined;
          // List foods get re-scored for the new phase; AI verdicts are kept as they were.
          return { id: m.id, verdict: food ? assessFood(food, phase).verdict : m.ai_verdict };
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
      ai_verdict: food ? assessFood(food, phase).verdict : null,
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

  const when = new Date(at || group.eaten_at);
  const meta = [
    `${when.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}, ${timeLabel(when.getTime())}`,
    group.phase === 'atak' ? 'atakta' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen
      title={SLOT_LABEL[slotForNew(at || group.eaten_at, sameDay, pickedSlot)]}
      footer={<Button title="Kaydet" icon="checkmark" onPress={save} />}
    >
      <Card style={{ gap: 10 }}>
        {/* one line for what and when; the photo opens full size on tap */}
        <Row gap={12}>
          <Tap onPress={uri ? () => setBigPhoto(!bigPhoto) : undefined} haptic={!!uri} accessibilityRole={uri ? 'button' : undefined} accessibilityLabel={uri ? 'Fotoğrafı büyüt' : undefined}>
            <GroupThumb group={group} size={56} />
          </Tap>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="h3" numberOfLines={2}>
              {items.length > 1 ? `${items.length} yemek` : items[0].name}
            </T>
            <T v="small" color={palette.inkSoft} numberOfLines={1}>
              {meta}
            </T>
          </View>
        </Row>
        {uri && bigPhoto ? <Image source={{ uri }} style={{ width: '100%', aspectRatio: 1.3, borderRadius: radius.lg }} /> : null}
        <View style={{ height: 1, backgroundColor: palette.hairline }} />
        {/* the plate as one list: name, verdict, remove */}
        <View>
          {items.map((m, i) => (
            <View key={m.id}>
              {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline, marginLeft: 36 }} /> : null}
              <Row gap={10} style={{ paddingVertical: 9 }}>
                <FoodEmoji name={m.name} foodId={m.food_id} />
                <T v="callout" style={{ flex: 1 }} numberOfLines={1}>
                  {m.name}
                </T>
                {m.ai_verdict ? <VerdictBadge verdict={m.ai_verdict} size="sm" inline /> : null}
                {items.length > 1 ? (
                  <Tap onPress={() => removeItem(m)} hitSlop={10} accessibilityLabel={`${m.name} çıkar`}>
                    <Icon name="minus.circle.fill" size={20} color={palette.inkFaint} fallback="−" />
                  </Tap>
                ) : null}
              </Row>
            </View>
          ))}
        </View>
        <FoodPicker onAdd={addItem} exclude={items.map((m) => m.food_id)} placeholder="Tabağa yemek ekle" />
        {tags.length ? (
          <T v="caption" color={palette.inkSoft} style={{ fontWeight: '400' }}>
            {`İçinde: ${tags.map((t) => TAGS[t].label.toLocaleLowerCase('tr-TR')).join(', ')}`}
          </T>
        ) : null}
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

      <Card style={{ gap: 14 }}>
        {at ? <WhenField value={at} onChange={setAt} /> : null}
        <MealDetails slot={slotForNew(at || group.eaten_at, sameDay, pickedSlot)} auto={!pickedSlot} onSlot={setPickedSlot} portion={portion} onPortion={setPortion} />
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

      <Button title={items.length > 1 ? 'Öğünü komple sil' : 'Öğünü sil'} kind="danger" icon="trash" onPress={removeAll} />
    </Screen>
  );
}
