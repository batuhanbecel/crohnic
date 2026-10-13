import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Image, TextInput, View } from 'react-native';
import { MealThumb } from '../../components/MealRow';
import { ReactionPicker } from '../../components/ReactionPicker';
import { WhenField } from '../../components/WhenField';
import { Button, Card, Row, Screen, T, VerdictBadge, st } from '../../components/ui';
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
  const [meal, setMeal] = useState<db.Meal | null>(null);
  const [reaction, setReaction] = useState<db.Reaction | null>(null);
  const [note, setNote] = useState('');
  const [at, setAt] = useState(0);

  useEffect(() => {
    db.getMeal(sql, Number(id)).then((m) => {
      setMeal(m);
      setReaction(m?.reaction ?? null);
      setNote(m?.reaction_note ?? '');
      setAt(m?.eaten_at ?? 0);
    });
  }, [sql, id]);

  if (!meal) return null;
  const uri = photoUri(meal.photo);
  const tags = tagsOf(meal).filter((t) => t !== 'hafif');

  const save = async () => {
    await db.setReaction(sql, meal.id, reaction, note.trim() || null);
    if (at && at !== meal.eaten_at) await db.setMealTime(sql, meal.id, at);
    app.bump();
    router.back();
  };

  const remove = () =>
    Alert.alert('Öğün silinsin mi?', meal.name, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await db.deleteMeal(sql, meal.id);
          deletePhoto(meal.photo);
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
          <MealThumb meal={meal} size={64} />
        </Row>
      )}
      <View style={{ gap: 6, paddingHorizontal: 2 }}>
        <T v="title">{meal.name}</T>
        <Row gap={8}>
          {meal.ai_verdict ? <VerdictBadge verdict={meal.ai_verdict} size="sm" /> : null}
          <T v="small" color={palette.inkSoft}>
            {meal.phase === 'atak' ? 'Atak döneminde yendi' : 'Remisyonda yendi'}
          </T>
        </Row>
        {tags.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {tags.map((t) => (
              <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: surface.card }}>
                <T v="caption" color={palette.inkSoft}>
                  {TAGS[t].label}
                </T>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <Card>{at ? <WhenField value={at} onChange={setAt} /> : null}</Card>

      <Card style={{ gap: 12 }}>
        <T v="h3">Nasıl geçti?</T>
        <ReactionPicker value={reaction} onChange={setReaction} />
        <TextInput value={note} onChangeText={setNote} placeholder="Not (ör. 2 saat sonra şişkinlik)" placeholderTextColor={palette.inkFaint} style={st.input} />
      </Card>

      <Button title="Kaydet" icon="checkmark" onPress={save} />
      <Button title="Öğünü sil" kind="danger" icon="trash" onPress={remove} />
    </Screen>
  );
}
