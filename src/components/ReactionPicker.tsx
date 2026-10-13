import { Text, View } from 'react-native';
import type { Reaction } from '../lib/db';
import { palette, radius } from '../lib/theme';
import { T, Tap } from './ui';

export const REACTIONS: { value: Reaction; emoji: string; label: string; color: string; bg: string }[] = [
  { value: 0, emoji: '😌', label: 'İyi geldi', color: palette.good, bg: palette.goodSoft },
  { value: 1, emoji: '😕', label: 'Biraz dokundu', color: palette.warn, bg: palette.warnSoft },
  { value: 2, emoji: '😣', label: 'Çok dokundu', color: palette.bad, bg: palette.badSoft },
];

export function ReactionPicker({ value, onChange, compact }: { value?: Reaction | null; onChange: (r: Reaction) => void; compact?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {REACTIONS.map((r) => {
        const active = value === r.value;
        return (
          <Tap
            key={r.value}
            onPress={() => onChange(r.value)}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 4,
              paddingVertical: compact ? 10 : 14,
              borderRadius: radius.md,
              backgroundColor: active ? r.color : r.bg,
            }}
          >
            <Text style={{ fontSize: compact ? 22 : 28 }}>{r.emoji}</Text>
            <T v="caption" color={active ? '#fff' : r.color} style={{ textAlign: 'center' }}>
              {r.label}
            </T>
          </Tap>
        );
      })}
    </View>
  );
}
