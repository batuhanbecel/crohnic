import { ScrollView, View } from 'react-native';
import { SLOT_SHORT, SLOTS, type MealSlot } from '../lib/meal-slot';
import { palette } from '../lib/theme';
import { Chip, Row, Segmented, T, Tap } from './ui';

export type Portion = 0 | 1 | 2;
const PORTION_KEYS = ['az', 'normal', 'cok'] as const;
export const PORTION_LABEL: Record<Portion, string> = { 0: 'Az', 1: 'Normal', 2: 'Çok' };

/**
 * Which meal this is (worked out from the time, changeable) and how much of it. Both apply
 * to the whole sitting. The portion tells "pilav bothers me" apart from "a big plate of pilav does".
 */
export function MealDetails({
  slot,
  auto,
  onSlot,
  portion,
  onPortion,
}: {
  slot: MealSlot;
  /** true while the name follows the clock */
  auto: boolean;
  /** null goes back to the automatic name */
  onSlot: (s: MealSlot | null) => void;
  portion: Portion;
  onPortion: (p: Portion) => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">Öğün</T>
          {auto ? (
            <T v="small" color={palette.inkSoft}>
              Saatine göre
            </T>
          ) : (
            <Tap onPress={() => onSlot(null)} hitSlop={8} accessibilityRole="button">
              <T v="small" color={palette.lettuceDeep} style={{ fontWeight: '700' }}>
                Saatine göre seç
              </T>
            </Tap>
          )}
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {SLOTS.map((s) => (
            <Chip key={s} label={SLOT_SHORT[s]} active={slot === s} onPress={() => onSlot(s)} />
          ))}
        </ScrollView>
      </View>
      <View style={{ gap: 8 }}>
        <T v="h3">Porsiyon</T>
        <Segmented
          value={PORTION_KEYS[portion]}
          onChange={(k) => onPortion(PORTION_KEYS.indexOf(k) as Portion)}
          items={[
            { key: 'az', label: 'Az' },
            { key: 'normal', label: 'Normal' },
            { key: 'cok', label: 'Çok' },
          ]}
        />
      </View>
    </View>
  );
}
