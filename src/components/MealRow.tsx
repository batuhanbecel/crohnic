import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { timeLabel } from '../lib/dates';
import type { Meal, MealGroup } from '../lib/db';
import { FOOD_BY_ID, findFoodByName } from '../lib/foods';
import { photoUri } from '../lib/photos';
import { palette, radius, surface } from '../lib/theme';
import { REACTIONS } from './ReactionPicker';
import { Card, Row, T, Tap, VERDICT_UI } from './ui';

export function emojiOf(meal: Pick<Meal, 'food_id' | 'name'>) {
  return (meal.food_id ? FOOD_BY_ID[meal.food_id]?.emoji : null) ?? findFoodByName(meal.name)?.emoji ?? '🍽️';
}

export function MealThumb({ meal, size = 50 }: { meal: Pick<Meal, 'photo' | 'food_id' | 'name'>; size?: number }) {
  const uri = photoUri(meal.photo);
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius.sm, backgroundColor: surface.well }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: radius.sm, backgroundColor: surface.well, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.5 }}>{emojiOf(meal)}</Text>
    </View>
  );
}

/** Thumbnail for a sitting: photo, single emoji, or up to 4 emojis in a grid. */
export function GroupThumb({ group, size = 50 }: { group: MealGroup; size?: number }) {
  const uri = photoUri(group.photo);
  if (uri || group.items.length === 1) return <MealThumb meal={uri ? { ...group.items[0], photo: group.photo } : group.items[0]} size={size} />;
  const emojis = group.items.slice(0, 4).map(emojiOf);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.sm,
        backgroundColor: surface.well,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
      }}
    >
      {emojis.map((e, i) => (
        <Text key={i} style={{ fontSize: size * 0.3, width: '50%', textAlign: 'center' }}>
          {e}
        </Text>
      ))}
    </View>
  );
}

export function MealRow({ group }: { group: MealGroup }) {
  const r = group.reaction != null ? REACTIONS[group.reaction] : null;
  const meta = [
    timeLabel(group.eaten_at),
    group.items.length > 1 ? `${group.items.length} yemek` : null,
    group.ai_verdict ? VERDICT_UI[group.ai_verdict].short : null,
    group.phase === 'atak' ? 'atakta' : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Tap onPress={() => router.push(`/ogun/${group.ids[0]}`)}>
      <Card style={{ padding: 10 }}>
        <Row gap={12}>
          <GroupThumb group={group} />
          <View style={{ flex: 1, gap: 2 }}>
            <T v="h3" numberOfLines={2}>
              {group.name}
            </T>
            <T v="small" color={palette.inkSoft} numberOfLines={1}>
              {meta}
            </T>
          </View>
          {r ? (
            <View style={{ backgroundColor: r.bg, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: palette.periSoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
              <T v="caption" color={palette.peri}>
                Nasıldı?
              </T>
            </View>
          )}
        </Row>
      </Card>
    </Tap>
  );
}
