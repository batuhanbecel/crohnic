import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Image, TextInput, View } from 'react-native';
import { MealThumb } from '../../components/MealRow';
import { ReactionPicker } from '../../components/ReactionPicker';
import { Button, Card, Row, Screen, T, VerdictBadge, s as ui } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { dayLabel, timeLabel } from '../../lib/dates';
import * as db from '../../lib/db';
import { TAGS } from '../../lib/foods';
import { deletePhoto, photoUri } from '../../lib/photos';
import { colors, radius } from '../../lib/theme';
import { tagsOf } from '../../lib/tolerance';

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sql = useSQLiteContext();
  const app = useApp();
  const [meal, setMeal] = useState<db.Meal | null>(null);
  const [reaction, setReaction] = useState<db.Reaction | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    db.getMeal(sql, Number(id)).then((m) => {
      setMeal(m);
      setReaction(m?.reaction ?? null);
      setNote(m?.reaction_note ?? '');
    });
  }, [sql, id]);

  if (!meal) return null;
  const uri = photoUri(meal.photo);
  const tags = tagsOf(meal).filter((t) => t !== 'hafif');

  const save = async () => {
    await db.setReaction(sql, meal.id, reaction, note.trim() || null);
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
    <Screen padTop={false}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', aspectRatio: 1.3, borderRadius: radius.lg }} />
      ) : (
        <Row>
          <MealThumb meal={meal} size={64} />
        </Row>
      )}
      <View style={{ gap: 6 }}>
        <T v="h1">{meal.name}</T>
        <T v="small" color={colors.inkSoft}>
          {dayLabel(meal.eaten_at)}, {timeLabel(meal.eaten_at)} · {meal.phase === 'atak' ? '🌧️ atak döneminde' : '🌤️ remisyonda'}
        </T>
        {meal.ai_verdict ? (
          <Row gap={8}>
            <T v="small" color={colors.inkSoft}>
              Tahminim:
            </T>
            <VerdictBadge verdict={meal.ai_verdict} size="sm" />
          </Row>
        ) : null}
        {tags.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {tags.map((t) => (
              <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: colors.card }}>
                <T v="tiny">{TAGS[t].label.toLocaleUpperCase('tr-TR')}</T>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <Card style={{ gap: 12 }}>
        <T v="h3">Nasıl geldi?</T>
        <ReactionPicker value={reaction} onChange={setReaction} />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Not (ör. 2 saat sonra şişkinlik)"
          placeholderTextColor={colors.inkFaint}
          style={ui.input}
        />
      </Card>

      <Button title="Kaydet" icon="checkmark" onPress={save} />
      <Button title="Öğünü sil" kind="danger" icon="trash" onPress={remove} />
    </Screen>
  );
}
