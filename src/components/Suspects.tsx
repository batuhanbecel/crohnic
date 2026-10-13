import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useApp } from '../lib/app-state';
import { relative } from '../lib/dates';
import * as db from '../lib/db';
import { cancelMealReminder } from '../lib/reminders';
import { palette } from '../lib/theme';
import { Mascot } from './Mascot';
import { GroupThumb } from './MealRow';
import { ReactionPicker } from './ReactionPicker';
import { Button, Card, Row, T } from './ui';

/**
 * Shown right after a bad symptom / bowel entry: meals from 2–24 h before,
 * so the user can mark the likely culprit while it's fresh.
 */
export function Suspects({ at, onDone }: { at: number; onDone: () => void }) {
  const sql = useSQLiteContext();
  const app = useApp();
  const [groups, setGroups] = useState<db.MealGroup[] | null>(null);

  useEffect(() => {
    db.mealsBefore(sql, at).then(setGroups);
  }, [sql, at]);

  const closed = useRef(false);
  useEffect(() => {
    if (groups && !groups.length && !closed.current) {
      closed.current = true;
      onDone();
    }
  }, [groups, onDone]);

  if (!groups?.length) return null;

  const react = async (g: db.MealGroup, r: db.Reaction) => {
    await db.setGroupReaction(sql, g.ids, r, g.items[0].reaction_note);
    cancelMealReminder(g.ids);
    setGroups((prev) => prev?.map((x) => (x.key === g.key ? { ...x, reaction: r } : x)) ?? null);
    app.bump();
  };

  return (
    <View style={{ gap: 12 }}>
      <Row gap={4}>
        <Mascot mood="worried" size={72} />
        <View style={{ flex: 1, gap: 2 }}>
          <T v="h3">Şüpheliler</T>
          <T v="small" color={palette.inkSoft}>
            Son 24 saatte bunları yemişsin. Sence hangisi dokundu? Emin değilsen boş bırak.
          </T>
        </View>
      </Row>
      {groups.map((g) => (
        <Card key={g.key} style={{ gap: 12 }}>
          <Row gap={12}>
            <GroupThumb group={g} size={44} />
            <View style={{ flex: 1 }}>
              <T v="caption" color={palette.inkSoft}>
                {relative(g.eaten_at)}
              </T>
              <T v="h3" numberOfLines={2}>
                {g.name}
              </T>
            </View>
          </Row>
          <ReactionPicker compact value={g.reaction} onChange={(r) => react(g, r)} />
        </Card>
      ))}
      <Button title="Bitti" icon="checkmark" onPress={onDone} />
    </View>
  );
}
