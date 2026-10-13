import { Text, View } from 'react-native';
import type { Reaction } from '../lib/db';
import { colors, fonts, radius } from '../lib/theme';
import { T, Tap } from './ui';

export const REACTIONS: { value: Reaction; emoji: string; label: string; color: string; bg: string }[] = [
  { value: 0, emoji: '😌', label: 'İyi geldi', color: colors.mint, bg: colors.mintSoft },
  { value: 1, emoji: '😕', label: 'Biraz dokundu', color: '#C98A06', bg: colors.butterSoft },
  { value: 2, emoji: '😣', label: 'Çok dokundu', color: colors.tomato, bg: colors.tomatoSoft },
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
            <Text style={{ fontSize: compact ? 24 : 30 }}>{r.emoji}</Text>
            <T v="tiny" color={active ? '#fff' : r.color} style={{ fontFamily: fonts.heavy, textAlign: 'center' }}>
              {r.label}
            </T>
          </Tap>
        );
      })}
    </View>
  );
}
