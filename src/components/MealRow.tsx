import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { timeLabel } from '../lib/dates';
import type { Meal } from '../lib/db';
import { FOOD_BY_ID } from '../lib/foods';
import { photoUri } from '../lib/photos';
import { colors, radius } from '../lib/theme';
import { REACTIONS } from './ReactionPicker';
import { Card, Row, T, Tap, VERDICT_UI } from './ui';

export function MealThumb({ meal, size = 52 }: { meal: Pick<Meal, 'photo' | 'food_id'>; size?: number }) {
  const uri = photoUri(meal.photo);
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius.sm, backgroundColor: colors.line }} />;
  const emoji = meal.food_id ? FOOD_BY_ID[meal.food_id]?.emoji : null;
  return (
    <View
      style={{ width: size, height: size, borderRadius: radius.sm, backgroundColor: colors.coralSoft, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji ?? '🍽️'}</Text>
    </View>
  );
}

export function MealRow({ meal }: { meal: Meal }) {
  const r = meal.reaction != null ? REACTIONS[meal.reaction] : null;
  return (
    <Tap onPress={() => router.push(`/ogun/${meal.id}`)}>
      <Card style={{ padding: 12 }}>
        <Row gap={12}>
          <MealThumb meal={meal} />
          <View style={{ flex: 1, gap: 2 }}>
            <T v="h3" numberOfLines={1}>
              {meal.name}
            </T>
            <T v="small" color={colors.inkSoft}>
              {timeLabel(meal.eaten_at)}
              {meal.ai_verdict ? `  ·  ${VERDICT_UI[meal.ai_verdict].emoji} ${VERDICT_UI[meal.ai_verdict].short}` : ''}
              {meal.phase === 'atak' ? '  ·  atak' : ''}
            </T>
          </View>
          {r ? (
            <View style={{ alignItems: 'center', backgroundColor: r.bg, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.lavSoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
              <T v="tiny" color={colors.lavender}>
                NASILDI?
              </T>
            </View>
          )}
        </Row>
      </Card>
    </Tap>
  );
}
