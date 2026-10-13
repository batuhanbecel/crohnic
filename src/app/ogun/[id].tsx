import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Text, TextInput, View } from 'react-native';
import { GroupThumb, emojiOf } from '../../components/MealRow';
import { ReactionPicker } from '../../components/ReactionPicker';
import { WhenField } from '../../components/WhenField';
import { Button, Card, Icon, Row, Screen, T, Tap, VerdictBadge, st } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import * as db from '../../lib/db';
import { TAGS } from '../../lib/foods';
import { deletePhoto, photoUri } from '../../lib/photos';
import { palette, radius, surface } from '../../lib/theme';
import { tagsOf } from '../../lib/tolerance';

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sql = useSQLiteContext();
  const app = useApp();
  const [items, setItems] = useState<db.Meal[]>([]);
  const [reaction, setReaction] = useState<db.Reaction | null>(null);
  const [note, setNote] = useState('');
  const [at, setAt] = useState(0);

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
    });
  }, [sql, id]);

  if (!items.length) return null;
  const group = db.groupMeals(items)[0];
  const uri = photoUri(group.photo);
  const tags = [...new Set(items.flatMap((m) => tagsOf(m)))].filter((t) => t !== 'hafif');

  const save = async () => {
    await db.setGroupReaction(sql, group.ids, reaction, note.trim() || null);
    if (at && at !== group.eaten_at) await db.setGroupTime(sql, group.ids, at);
    app.bump();
    router.back();
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
    <Screen header={false}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', aspectRatio: 1.3, borderRadius: radius.xl }} />
      ) : (
        <Row>
          <GroupThumb group={group} size={64} />
        </Row>
      )}
      <View style={{ gap: 6, paddingHorizontal: 2 }}>
        <T v="title">{items.length > 1 ? `${items.length} yemekli öğün` : items[0].name}</T>
        <T v="small" color={palette.inkSoft}>
          {group.phase === 'atak' ? 'Atak döneminde yendi' : 'Remisyonda yendi'}
        </T>
      </View>

      <Card style={{ gap: 8 }}>
        <T v="h3">Tabakta</T>
        {items.map((m) => (
          <Row key={m.id} gap={10} style={{ backgroundColor: surface.well, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 20 }}>{emojiOf(m)}</Text>
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

      <Card>{at ? <WhenField value={at} onChange={setAt} /> : null}</Card>

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
