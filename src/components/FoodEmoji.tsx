import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';
import { useApp } from '../lib/app-state';
import { customEmoji, isCustomFood, setCustomEmoji } from '../lib/custom-emoji';
import { FOOD_BY_ID, findFoodByName } from '../lib/foods';
import { palette, surface } from '../lib/theme';
import { EmojiPicker } from './EmojiPicker';
import { Text } from './text';
import { Icon, Tap } from './ui';

/**
 * A food's emoji. For foods that aren't in the list it's the user's own choice: tapping it
 * (a small pencil marks that it can be changed) opens the emoji sheet.
 */
export function FoodEmoji({ name, foodId, size = 20 }: { name: string; foodId?: string | null; size?: number }) {
  const sql = useSQLiteContext();
  const app = useApp();
  const [open, setOpen] = useState(false);
  const custom = isCustomFood(name, foodId);
  const emoji = (foodId ? FOOD_BY_ID[foodId]?.emoji : null) ?? findFoodByName(name)?.emoji ?? customEmoji(name) ?? '🍽️';

  if (!custom) return <Text style={{ fontSize: size }}>{emoji}</Text>;

  const pick = async (e: string) => {
    setOpen(false);
    await setCustomEmoji(sql, name, e);
    app.bump();
  };

  return (
    <>
      <Tap onPress={() => setOpen(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${name} için emoji seç`}>
        <View>
          <Text style={{ fontSize: size }}>{emoji}</Text>
          <View
            style={{
              position: 'absolute',
              right: -6,
              bottom: -4,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: surface.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="pencil.circle.fill" size={15} color={palette.lettuceDeep} fallback="✎" />
          </View>
        </View>
      </Tap>
      <EmojiPicker name={name} visible={open} onPick={pick} onClose={() => setOpen(false)} />
    </>
  );
}
